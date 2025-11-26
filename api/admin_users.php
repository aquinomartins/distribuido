<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';

require_login();
require_admin();

require_once __DIR__ . '/../lib/special_liquidity_user.php';

$pdo = db();
$specialId = special_liquidity_user_id($pdo);
$stmt = $pdo->query("SELECT id, name, email, COALESCE(confirmed,0) AS confirmed, COALESCE(is_admin,0) AS is_admin, created_at FROM users ORDER BY id");
$rows = array_map(function($row) use ($specialId) {
  $row['is_special_liquidity_user'] = $specialId !== null && (int)$row['id'] === (int)$specialId ? 1 : 0;
  return $row;
}, $stmt->fetchAll());

echo json_encode($rows);
