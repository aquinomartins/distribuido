<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ledger.php';
require_once __DIR__ . '/../lib/util.php';
require_login();

$pdo = db();
$uid = current_user_id();

if($_SERVER['REQUEST_METHOD']==='GET'){
  // list open orders for asset or user
  $asset_id = isset($_GET['asset_id']) ? intval($_GET['asset_id']) : null;
  $instance = isset($_GET['asset_instance_id']) ? intval($_GET['asset_instance_id']) : null;
  $sql = "SELECT * FROM orders WHERE status='open'";
  $params = [];
  if($asset_id){ $sql .= " AND asset_id=?"; $params[] = $asset_id; }
  if($instance){ $sql .= " AND asset_instance_id=?"; $params[] = $instance; }
  $sql .= " ORDER BY price DESC, id ASC";
  $st = $pdo->prepare($sql); $st->execute($params);
  echo json_encode($st->fetchAll()); exit;
}

if($_SERVER['REQUEST_METHOD']==='POST'){
  $d = json_decode(file_get_contents('php://input'), true);
  $side = $d['side'] ?? ''; // 'buy' or 'sell'
  $asset_id = isset($d['asset_id']) ? intval($d['asset_id']) : null;
  $asset_instance_id = isset($d['asset_instance_id']) ? intval($d['asset_instance_id']) : null;
  $qty = floatval($d['qty'] ?? 0);
  $price = floatval($d['price'] ?? 0);

  if(!in_array($side, ['buy','sell']) || $qty<=0 || $price<=0){
    http_response_code(400); echo json_encode(['error'=>'invalid_order']); exit;
  }
  if(!$asset_id && !$asset_instance_id){ http_response_code(400); echo json_encode(['error'=>'asset_required']); exit; }

  // Create order
  $st = $pdo->prepare("INSERT INTO orders(user_id, side, asset_id, asset_instance_id, qty, price, status) VALUES (?,?,?,?,?,?, 'open')");
  $st->execute([$uid,$side,$asset_id,$asset_instance_id,$qty,$price]);
  $order_id = intval($pdo->lastInsertId());

  // Attempt immediate match (simple, best-price)
  // For BUY: match against lowest-price SELL with same asset
  // For SELL: match against highest-price BUY with same asset
  $remaining = $qty;

  while ($remaining > 0.00000001) {
    if ($side === 'buy') {
      $q = "SELECT * FROM orders WHERE status='open' AND side='sell' AND price<=? ";
      $params = [$price];
    } else {
      $q = "SELECT * FROM orders WHERE status='open' AND side='buy' AND price>=? ";
      $params = [$price];
    }
    if ($asset_id) { $q .= " AND asset_id=?"; $params[] = $asset_id; }
    if ($asset_instance_id) { $q .= " AND asset_instance_id=?"; $params[] = $asset_instance_id; }
    $q .= $side==='buy' ? " ORDER BY price ASC, id ASC LIMIT 1" : " ORDER BY price DESC, id ASC LIMIT 1";
    $stM = $pdo->prepare($q); $stM->execute($params);
    $match = $stM->fetch();
    if(!$match) break;

    $match_qty = min($remaining, floatval($match['qty']));
    $exec_price = floatval($match['price']); // price do agressado

    // Settle trade via ledger + asset_moves
    $pdo->beginTransaction();
    try{
      // Prepare accounts
      ensure_user_accounts($uid);
      ensure_user_accounts(intval($match['user_id']));

      // Identify buyer/seller
      $buyer_id  = ($side==='buy') ? $uid : intval($match['user_id']);
      $seller_id = ($side==='buy') ? intval($match['user_id']) : $uid;

      // Accounts
      $acc = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose=? AND currency=? LIMIT 1");
      $acc->execute([$buyer_id,'cash','BRL']);   $buyer_cash = $acc->fetchColumn();
      $acc->execute([$seller_id,'cash','BRL']);  $seller_cash = $acc->fetchColumn();
      $acc2 = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose=? LIMIT 1");
      $acc2->execute([$buyer_id,'nft_inventory']);  $buyer_inv = $acc2->fetchColumn();
      $acc2->execute([$seller_id,'nft_inventory']); $seller_inv = $acc2->fetchColumn();

      // Journal money legs
      $total = round($match_qty * $exec_price, 8);
      $jid = post_journal('trade', NULL, 'Liquidacao de trade', [
        ['account_id'=>$seller_cash, 'debit'=>$total],
        ['account_id'=>$buyer_cash,  'credit'=>$total],
      ]);

      // Asset move (NFT or fungible)
      if ($asset_instance_id) {
        // transfer unique instance (qty=1 or fractional if allowed)
        $stmtMV = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                                 VALUES (?,?,?,?,?,?)");
        $stmtMV->execute([$jid, NULL, $asset_instance_id, $match_qty, $seller_inv, $buyer_inv]);
      } else {
        $stmtMV = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                                 VALUES (?,?,?,?,?,?)");
        $stmtMV->execute([$jid, $asset_id, NULL, $match_qty, $seller_inv, $buyer_inv]);
      }

      // Update matched order qty/status
      $new_match_qty = floatval($match['qty']) - $match_qty;
      if ($new_match_qty <= 0.00000001) {
        $pdo->prepare("UPDATE orders SET qty=0, status='filled' WHERE id=?")->execute([intval($match['id'])]);
      } else {
        $pdo->prepare("UPDATE orders SET qty=? WHERE id=?")->execute([$new_match_qty, intval($match['id'])]);
      }

      // Insert trade record
      if ($side==='buy') {
        $pdo->prepare("INSERT INTO trades(buy_order_id, sell_order_id, qty, price, journal_id) VALUES (?,?,?,?,?)")
            ->execute([$order_id, intval($match['id']), $match_qty, $exec_price, $jid]);
      } else {
        $pdo->prepare("INSERT INTO trades(buy_order_id, sell_order_id, qty, price, journal_id) VALUES (?,?,?,?,?)")
            ->execute([intval($match['id']), $order_id, $match_qty, $exec_price, $jid]);
      }

      $pdo->commit();
      $remaining = round($remaining - $match_qty, 8);
    } catch(Exception $e){
      $pdo->rollBack();
      http_response_code(400);
      echo json_encode(['error'=>'settlement_failed','detail'=>$e->getMessage()]);
      exit;
    }
  }

  // Update my order status/qty
  if ($remaining < $qty) {
    if ($remaining <= 0.00000001) {
      $pdo->prepare("UPDATE orders SET qty=0, status='filled' WHERE id=?")->execute([$order_id]);
    } else {
      $pdo->prepare("UPDATE orders SET qty=? WHERE id=?")->execute([$remaining, $order_id]);
    }
  }

  echo json_encode(['ok'=>true,'order_id'=>$order_id,'remaining'=>$remaining]);
  exit;
}

http_response_code(405);
echo json_encode(['error'=>'method_not_allowed']);
