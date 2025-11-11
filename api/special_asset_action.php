<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();

header('Content-Type: application/json');

http_response_code(403);
echo json_encode([
  'error' => 'confirmation_required',
  'detail' => 'As operações de ativos especiais precisam ser confirmadas no aplicativo. Solicite a transação e finalize-a na aba "Transações pendentes".'
]);