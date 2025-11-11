<?php
header('Content-Type: application/json');
session_start();
require_once __DIR__ . '/../lib/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$email = trim($body['email'] ?? '');
$pass  = $body['password'] ?? '';

if ($email === '' || $pass === '') {
  http_response_code(400);
  echo json_encode(['error' => 'missing_credentials']);
  exit;
}

$pdo = db();
$stmt = $pdo->prepare("SELECT id, name, email, password_hash, COALESCE(confirmed,0) AS confirmed, COALESCE(is_admin,0) AS is_admin FROM users WHERE email=? LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) { http_response_code(401); echo json_encode(['error'=>'invalid_credentials']); exit; }

if (intval($user['confirmed']) !== 1) {
  http_response_code(403);
  echo json_encode(['error' => 'email_not_confirmed']);
  exit;
}

$hash = $user['password_hash'];
$ok = false;
if (strpos($hash, '$2y$') === 0 || strpos($hash, '$argon2') === 0) { $ok = password_verify($pass, $hash); }
else { $ok = hash('sha256', $pass) === $hash || $pass === $hash; }

if (!$ok) { http_response_code(401); echo json_encode(['error'=>'invalid_credentials']); exit; }

$_SESSION['uid'] = intval($user['id']);
$_SESSION['name'] = $user['name'] ?? null;
$_SESSION['email'] = $user['email'] ?? null;
$_SESSION['is_admin'] = intval($user['is_admin'] ?? 0) === 1;
echo json_encode([
  'ok' => true,
  'user_id' => intval($user['id']),
  'is_admin' => intval($user['is_admin'] ?? 0) === 1,
  'name' => $user['name'] ?? null
]);

