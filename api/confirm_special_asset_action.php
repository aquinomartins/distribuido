<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'method_not_allowed']);
  exit;
}

header('Content-Type: application/json');

$body = json_decode(file_get_contents('php://input'), true);
$requestId = $body['request_id'] ?? null;

if (!is_numeric($requestId)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_request', 'detail' => 'Informe uma solicitação válida para confirmação.']);
  exit;
}

$userId = current_user_id();
if (!$userId) {
  http_response_code(401);
  echo json_encode(['error' => 'not_authenticated']);
  exit;
}

try {
  $pdo = db();
  $result = confirm_special_asset_action_request($pdo, (int)$requestId, (int)$userId);
  $pending = get_pending_special_asset_actions($pdo, (int)$userId);

  $response = [
    'status' => $result['status'] ?? 'pending',
    'pending_requests' => $pending,
  ];

  if (!empty($result['already_confirmed'])) {
    $response['already_confirmed'] = true;
  }
  if (!empty($result['already_executed'])) {
    $response['already_executed'] = true;
  }
  if (isset($result['result'])) {
    $response['result'] = $result['result'];
  }

  echo json_encode($response);
} catch (RuntimeException $e) {
  http_response_code(400);
  echo json_encode(['error' => 'cannot_confirm', 'detail' => $e->getMessage()]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'internal_error']);
}
