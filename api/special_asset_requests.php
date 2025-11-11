<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();

header('Content-Type: application/json');

$userId = current_user_id();
if (!$userId) {
  http_response_code(401);
  echo json_encode(['error' => 'not_authenticated']);
  exit;
}

try {
  $pdo = db();
  $requests = get_pending_special_asset_actions($pdo, (int)$userId);
  echo json_encode([
    'requests' => $requests,
    'pending_count' => count($requests)
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'internal_error']);
}
