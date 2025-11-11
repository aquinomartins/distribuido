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

try {
  $userId = current_user_id();
  if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'not_authenticated']);
    exit;
  }

  $pdo = db();
  $request = create_special_asset_action_request($pdo, (int)$userId, $payload);

  echo json_encode([
    'status' => 'pending_confirmation',
    'request_id' => $request['id'],
    'detail' => 'Solicitação registrada. Confirme na aba "Transações pendentes" quando estiver pronto.',
  ]);
} catch (InvalidArgumentException $e) {
  http_response_code(422);
  echo json_encode(['error' => 'invalid_action', 'detail' => $e->getMessage()]);
} catch (RuntimeException $e) {
  http_response_code(400);
  echo json_encode(['error' => 'request_failed', 'detail' => $e->getMessage()]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'internal_error']);
}
