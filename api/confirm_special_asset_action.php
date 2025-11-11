<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

$token = $_GET['token'] ?? '';
if (!$token) {
  http_response_code(400);
  echo '<h2>Token inválido.</h2>';
  exit;
}

$pdo = db();
ensure_special_asset_action_requests_table($pdo);

try {
  $pdo->beginTransaction();
  $stmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE token = ? LIMIT 1 FOR UPDATE', SPECIAL_ASSET_ACTION_REQUESTS_TABLE));
  $stmt->execute([$token]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    $pdo->commit();
    echo '<h2>Token não encontrado.</h2>';
    exit;
  }

  $status = $row['status'] ?? 'pending';
  if ($status !== 'pending') {
    $pdo->commit();
    if ($status === 'executed') {
      echo '<h2>Esta operação já foi confirmada.</h2>';
    } elseif ($status === 'cancelled') {
      echo '<h2>Esta solicitação foi cancelada.</h2>';
    } else {
      echo '<h2>Esta solicitação já foi processada.</h2>';
    }
    exit;
  }

  update_special_asset_action_request_status($pdo, (int)$row['id'], 'confirmed', null, true, false);
  $pdo->commit();
} catch (Exception $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  http_response_code(500);
  echo '<h2>Erro ao confirmar a solicitação.</h2>';
  exit;
}

$payload = json_decode($row['payload_json'] ?? 'null', true);
if (!is_array($payload)) {
  update_special_asset_action_request_status($pdo, (int)$row['id'], 'cancelled', 'Payload inválido.', false, false, true);
  echo '<h2>Não foi possível processar esta solicitação.</h2>';
  exit;
}

try {
  $result = apply_special_asset_action(
    $pdo,
    (int)$row['user_id'],
    (string)($payload['asset'] ?? ''),
    (string)($payload['action'] ?? ''),
    $payload['amount'] ?? null,
    $payload['total_brl'] ?? null,
    $payload['counterparty_id'] ?? null
  );
  update_special_asset_action_request_status($pdo, (int)$row['id'], 'executed', null, false, true);
  send_special_asset_transaction_notifications($pdo, $row, $payload, $result);

  $balances = sprintf(
    '<ul><li>Bitcoin: %s</li><li>NFTs: %s</li><li>Reais (R$): %s</li><li>Cotas: %s</li></ul>',
    htmlspecialchars(number_format($result['bitcoin'] ?? 0, 8, ',', '.'), ENT_QUOTES, 'UTF-8'),
    htmlspecialchars((string)($result['nft'] ?? 0), ENT_QUOTES, 'UTF-8'),
    htmlspecialchars(number_format($result['brl'] ?? 0, 2, ',', '.'), ENT_QUOTES, 'UTF-8'),
    htmlspecialchars(number_format($result['quotas'] ?? 0, 8, ',', '.'), ENT_QUOTES, 'UTF-8')
  );

  echo '<h2>✅ Operação confirmada com sucesso!</h2>';
  echo '<p>A transação foi executada e os saldos foram atualizados.</p>';
  echo $balances;
} catch (Exception $e) {
  update_special_asset_action_request_status($pdo, (int)$row['id'], 'pending', $e->getMessage(), false, false, true);
  echo '<h2>Não foi possível concluir a operação.</h2>';
  echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
}
