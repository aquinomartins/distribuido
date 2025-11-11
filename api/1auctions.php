<?php
require_once __DIR__ . '/../lib/db.php';
header('Content-Type: application/json');
$pdo = db();

if ($_SERVER['REQUEST_METHOD']==='GET') {
  $sql = "SELECT * FROM auctions WHERE status IN ('running','draft') ORDER BY starts_at DESC";
  echo json_encode(db()->query($sql)->fetchAll());
  exit;
}

/* Criar leilão (simplificado) */
if ($_SERVER['REQUEST_METHOD']==='POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  $stmt = $pdo->prepare("INSERT INTO auctions (seller_id, asset_instance_id, starts_at, ends_at, reserve_price, status)
                         VALUES (?, ?, ?, ?, ?, 'running')");
  $stmt->execute([$data['seller_id'], $data['asset_instance_id'], $data['starts_at'], $data['ends_at'], $data['reserve_price']]);
  echo json_encode(['ok'=>true, 'auction_id'=>$pdo->lastInsertId()]);
}
