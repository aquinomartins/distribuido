<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();
$pdo = db();
$asset_id = isset($_GET['asset_id']) ? intval($_GET['asset_id']) : null;
$inst_id = isset($_GET['asset_instance_id']) ? intval($_GET['asset_instance_id']) : null;

$sql = "SELECT t.*, o1.asset_id, o1.asset_instance_id
        FROM trades t
        LEFT JOIN orders o1 ON o1.id = t.buy_order_id
        ORDER BY t.created_at DESC LIMIT 100";
$rows = $pdo->query($sql)->fetchAll();

// basic filter by asset if requested (quick/inefficient but fine for MVP)
if ($asset_id || $inst_id) {
  $rows = array_values(array_filter($rows, function($r) use($asset_id,$inst_id){
    if ($asset_id && intval($r['asset_id']) !== $asset_id) return false;
    if ($inst_id && intval($r['asset_instance_id']) !== $inst_id) return false;
    return true;
  }));
}
echo json_encode($rows);
