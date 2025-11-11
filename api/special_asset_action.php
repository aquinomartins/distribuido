<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();

header('Content-Type: application/json');

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_payload']);
  exit;
}

$asset = isset($payload['asset']) ? strtolower((string)$payload['asset']) : '';
$action = isset($payload['action']) ? strtolower((string)$payload['action']) : '';
$amount = $payload['amount'] ?? null;
$totalBrl = $payload['total_brl'] ?? null;
$counterpartyId = $payload['counterparty_id'] ?? null;

try {
  $userId = current_user_id();
  if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'not_authenticated']);
    exit;
  }

  $pdo = db();
  $result = apply_special_asset_action(
    $pdo,
    (int)$userId,
    $asset,
    $action,
    $amount,
    $totalBrl,
    $counterpartyId
  );

  echo json_encode([
    'assets' => $result,
  ]);
} catch (InvalidArgumentException $e) {
  http_response_code(422);
  echo json_encode(['error' => 'invalid_action', 'detail' => $e->getMessage()]);
} catch (RuntimeException $e) {
  http_response_code(400);
  echo json_encode(['error' => 'operation_failed', 'detail' => $e->getMessage()]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'internal_error']);
}