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

if (!$name || !$email || !$password) {
  http_response_code(400);
  echo json_encode(['error' => 'missing_fields']);
  exit;
}

try {
  $pdo = db();
  $uid = create_user_with_accounts($name, $email, $password);

  $token = md5(uniqid(rand(), true));
  $pdo->prepare("INSERT INTO user_confirmations (user_id, token) VALUES (?, ?)")->execute([$uid, $token]);

  $domain = $_SERVER['HTTP_HOST'] ?? 'aquino.bsb.br';
  $link = "https://{$domain}/api/confirm.php?token=" . $token;
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
