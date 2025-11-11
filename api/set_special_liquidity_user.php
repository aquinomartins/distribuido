<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();
require_admin();

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload) || !isset($payload['user_id'])) {
  http_response_code(400);
  echo json_encode(['error' => 'missing_user_id']);
  exit;
}

$userId = filter_var($payload['user_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$userId) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_user_id']);
  exit;
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id, name, email, confirmed FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) {
  http_response_code(404);
  echo json_encode(['error' => 'user_not_found']);
  exit;
}

try {
  $pdo->beginTransaction();
  set_special_liquidity_user($pdo, (int)$user['id']);
  $pdo->commit();
} catch (Throwable $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['error' => 'failed_to_set_special_user', 'detail' => $e->getMessage()]);
  exit;
}

$email = special_liquidity_user_email($pdo);

echo json_encode([
  'user_id' => (int)$user['id'],
  'email' => $email,
  'name' => $user['name'],
  'confirmed' => (int)($user['confirmed'] ?? 0)
]);
