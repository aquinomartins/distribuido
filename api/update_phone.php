<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';

require_login();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$phone = trim((string)($body['phone'] ?? ''));
if ($phone === '') {
  http_response_code(400);
  echo json_encode(['error' => 'phone_required']);
  exit;
}

$digits = preg_replace('/\D+/', '', $phone);
if (strlen($digits) < 10 || strlen($digits) > 13) {
  http_response_code(400);
  echo json_encode(['error' => 'phone_invalid']);
  exit;
}

$sanitizedPhone = preg_replace('/[^0-9+()\-\s]/', '', $phone);

try {
  $pdo = db();
  $stmt = $pdo->prepare('UPDATE users SET phone = ? WHERE id = ?');
  $stmt->execute([$sanitizedPhone, current_user_id()]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'cannot_update_phone']);
  exit;
}

echo json_encode(['ok' => true, 'phone' => $sanitizedPhone]);
