<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/util.php'; // create_user_with_accounts()

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$name = trim($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$phone = trim($body['phone'] ?? '');

if ($phone === '') {
  http_response_code(400);
  echo json_encode(['error' => 'phone_required']);
  exit;
}

$digits = preg_replace('/\D+/', '', $phone);
if (strlen($digits) < 10) {
  http_response_code(400);
  echo json_encode(['error' => 'phone_invalid']);
  exit;
}

$sanitizedPhone = preg_replace('/[^0-9+()\-\s]/', '', $phone);

if (!$name || !$email || !$password) {
  http_response_code(400);
  echo json_encode(['error' => 'missing_fields']);
  exit;
}

try {
  $pdo = db();
  $uid = create_user_with_accounts($name, $email, $password, $sanitizedPhone);

  $token = md5(uniqid(rand(), true));
  $pdo->prepare("INSERT INTO user_confirmations (user_id, token) VALUES (?, ?)")->execute([$uid, $token]);

  $scheme = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? 'aquino.bsb.br';
  $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/register.php'));
  if ($scriptDir === '/' || $scriptDir === '.') { $scriptDir = ''; }
  $confirmPath = '/' . ltrim($scriptDir . '/confirm.php', '/');
  $link = sprintf('%s://%s%s?token=%s', $scheme, $host, $confirmPath, urlencode($token));
  $subject = "Confirme seu cadastro - AquinoNFT";
  $message = "Olá, {$name}!\n\nConfirme seu cadastro clicando no link abaixo:\n{$link}\n\nSe você não solicitou, ignore este e-mail.\n";
  $headers = "From: noreply@aquino.bsb.br\r\nContent-Type: text/plain; charset=UTF-8\r\n";

  @mail($email, $subject, $message, $headers);

  echo json_encode(['ok' => true, 'user_id' => $uid, 'msg' => 'Verifique seu e-mail para confirmar o cadastro.']);
} catch (Exception $e) {
  http_response_code(400);
  $msg = $e->getMessage();
  if (strpos($msg, 'Duplicate') !== false || strpos($msg, 'UNIQUE') !== false) {
    echo json_encode(['error' => 'email_in_use']);
  } else {
    echo json_encode(['error' => 'cannot_create', 'detail' => $msg]);
  }
}
