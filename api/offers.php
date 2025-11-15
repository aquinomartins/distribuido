<?php
// api/offers.php — lista/cria ofertas de venda (manual marketplace)
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/util.php';
require_login();
$pdo = db();
$uid = current_user_id();

if ($_SERVER['REQUEST_METHOD']==='GET') {
  $kind = $_GET['kind'] ?? null; // 'NFT' or 'BTC' or null
  $q = "SELECT * FROM offers WHERE status='open' ";
  $p = [];
  if ($kind === 'NFT') { $q .= "AND kind='NFT' "; }
  if ($kind === 'BTC') { $q .= "AND kind='BTC' "; }
  $q .= "ORDER BY created_at DESC";
  $st = $pdo->prepare($q); $st->execute($p);
  echo json_encode($st->fetchAll()); exit;
}

if ($_SERVER['REQUEST_METHOD']==='POST') {
  $d = json_decode(file_get_contents('php://input'), true);
  $kind = $d['kind'] ?? '';
  $qty  = floatval($d['qty'] ?? 0);
  $price = floatval($d['price_brl'] ?? 0);
  $asset_instance_id = isset($d['asset_instance_id']) ? intval($d['asset_instance_id']) : null;

  if (!in_array($kind, ['NFT','BTC']) || $qty<=0 || $price<=0) {
    http_response_code(400); echo json_encode(['error'=>'invalid_offer']); exit;
  }
  ensure_user_accounts($uid);

  if ($kind === 'NFT') {
    if (!$asset_instance_id) { http_response_code(400); echo json_encode(['error'=>'missing_instance']); exit; }
    $assetStmt = $pdo->prepare('SELECT asset_id FROM asset_instances WHERE id = ? LIMIT 1');
    $assetStmt->execute([$asset_instance_id]);
    $assetId = (int)$assetStmt->fetchColumn();
    if ($assetId <= 0) {
      http_response_code(404);
      echo json_encode(['error' => 'asset_not_found']);
      exit;
    }

    $qtyInt = (int)round($qty);
    if (abs($qty - $qtyInt) > 1e-8 || $qtyInt <= 0) {
      http_response_code(400);
      echo json_encode(['error' => 'invalid_qty']);
      exit;
    }

    $posStmt = $pdo->prepare("SELECT qty FROM positions WHERE owner_type='user' AND owner_id=? AND asset_id=? LIMIT 1");
    $posStmt->execute([$uid, $assetId]);
    $owned = (float)$posStmt->fetchColumn();
    if ($owned < $qtyInt) {
      http_response_code(400);
      echo json_encode(['error' => 'not_owner']);
      exit;
    }

    $qty = (float)$qtyInt;
  }

  $st = $pdo->prepare("INSERT INTO offers(seller_id,kind,asset_instance_id,qty,price_brl,status) VALUES (?,?,?,?,?,'open')");
  $st->execute([$uid,$kind,$asset_instance_id,$qty,$price]);
  echo json_encode(['ok'=>true,'offer_id'=>$pdo->lastInsertId()]); exit;
}

http_response_code(405);
echo json_encode(['error'=>'method_not_allowed']);
