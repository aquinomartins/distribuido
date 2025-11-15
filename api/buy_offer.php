<?php
// api/buy_offer.php — compra uma oferta específica (sem matching automático)
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ledger.php';
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';
require_login();
$pdo = db();
$buyer_id = current_user_id();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'POST only']); exit; }
$d = json_decode(file_get_contents('php://input'), true);
$offer_id = intval($d['offer_id'] ?? 0);
if (!$offer_id) { http_response_code(400); echo json_encode(['error'=>'missing_offer']); exit; }

// Carrega a oferta
$st = $pdo->prepare("SELECT * FROM offers WHERE id=? AND status='open' LIMIT 1");
$st->execute([$offer_id]);
$offer = $st->fetch();
if (!$offer) { http_response_code(404); echo json_encode(['error'=>'offer_not_found']); exit; }
if (intval($offer['seller_id']) === $buyer_id) { http_response_code(400); echo json_encode(['error'=>'self_purchase']); exit; }

// Garante contas
ensure_user_accounts($buyer_id);
ensure_user_accounts(intval($offer['seller_id']));

// Contas dinheiro
$acc = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose=? AND currency=? LIMIT 1");
$acc->execute([$buyer_id,'cash','BRL']);   $buyer_cash = $acc->fetchColumn();
$acc->execute([$offer['seller_id'],'cash','BRL']);  $seller_cash = $acc->fetchColumn();

$total = round(floatval($offer['qty']) * floatval($offer['price_brl']), 8);

// saldo do comprador
$balStmt = $pdo->prepare('SELECT COALESCE(SUM(debit - credit),0) FROM entries WHERE account_id = ?');
$balStmt->execute([$buyer_cash]);
$buyerBalance = (float)$balStmt->fetchColumn();
if ($buyerBalance + 1e-8 < $total) {
  http_response_code(400);
  echo json_encode(['error' => 'insufficient_funds']);
  exit;
}

if ($offer['kind'] === 'NFT') {
  $assetStmt = $pdo->prepare('SELECT asset_id FROM asset_instances WHERE id = ? LIMIT 1');
  $assetStmt->execute([intval($offer['asset_instance_id'])]);
  $assetId = (int)$assetStmt->fetchColumn();
  if ($assetId <= 0) {
    http_response_code(404);
    echo json_encode(['error' => 'asset_not_found']);
    exit;
  }

  $posStmt = $pdo->prepare("SELECT qty FROM positions WHERE owner_type='user' AND owner_id=? AND asset_id=? LIMIT 1");
  $posStmt->execute([intval($offer['seller_id']), $assetId]);
  $sellerQty = (float)$posStmt->fetchColumn();
  if ($sellerQty + 1e-8 < floatval($offer['qty'])) {
    http_response_code(400);
    echo json_encode(['error' => 'seller_not_owner']);
    exit;
  }
}

$pdo->beginTransaction();
try{
  // Lança BRL: comprador paga, vendedor recebe
  $jid = post_journal('market_purchase', NULL, 'Compra de oferta #'.$offer_id, [
    ['account_id'=>$seller_cash, 'debit'=>$total],
    ['account_id'=>$buyer_cash,  'credit'=>$total],
  ]);

  if ($offer['kind'] === 'NFT') {
    // transfere a instância do inventário do vendedor para o comprador
    $acc2 = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='nft_inventory' LIMIT 1");
    $acc2->execute([$offer['seller_id']]); $seller_inv = $acc2->fetchColumn();
    $acc2->execute([$buyer_id]);           $buyer_inv  = $acc2->fetchColumn();

    $stmtMV = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                             VALUES (?,?,?,?,?,?)");
    $stmtMV->execute([$jid, NULL, intval($offer['asset_instance_id']), floatval($offer['qty']), $seller_inv, $buyer_inv]);

    $qtyInt = (int)round(floatval($offer['qty']));
    if ($qtyInt > 0) {
      adjust_special_liquidity_assets($pdo, $buyer_id, ['nft' => $qtyInt, 'brl' => -$total]);
      adjust_special_liquidity_assets($pdo, intval($offer['seller_id']), ['nft' => -$qtyInt, 'brl' => $total]);
    }
  }
  if ($offer['kind'] === 'BTC') {
    // transfere BTC carteira -> carteira (fungível)
    $accB = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='bitcoin_wallet' LIMIT 1");
    $accB->execute([$offer['seller_id']]); $seller_btc = $accB->fetchColumn();
    $accB->execute([$buyer_id]);           $buyer_btc  = $accB->fetchColumn();

    $stmtMV = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                             VALUES (?,?,?,?,?,?)");
    // assumindo assets BTC mapeado como 'asset_id' especial? Se não houver, apenas posições por entries BTC já resolvem;
    // Para simplificar: usar entries nas contas BTC
    $stmtMV->execute([$jid, NULL, NULL, 0, NULL, NULL]); // placeholder opcional
    // Ajuste por entries (BTC fungível)
    $pdo->prepare("INSERT INTO entries(journal_id, account_id, debit, credit) VALUES (?,?,?,?)")
        ->execute([$jid, $buyer_btc, floatval($offer['qty']), 0]);
    $pdo->prepare("INSERT INTO entries(journal_id, account_id, debit, credit) VALUES (?,?,?,?)")
        ->execute([$jid, $seller_btc, 0, floatval($offer['qty'])]);
  }

  // fecha oferta
  $pdo->prepare("UPDATE offers SET status='filled' WHERE id=?")->execute([$offer_id]);

  $pdo->commit();
  echo json_encode(['ok'=>true,'journal_id'=>$jid]);
}catch(Exception $e){
  $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['error'=>'purchase_failed','detail'=>$e->getMessage()]);
}
