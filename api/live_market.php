<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';
require_login();
$pdo = db();
$sql = "SELECT
          t.id AS trade_id,
          t.qty,
          t.price,
          t.created_at,
          t.journal_id,
          j.occurred_at,
          j.ref_type,
          COALESCE(o_buy.asset_id, o_sell.asset_id) AS asset_id,
          COALESCE(o_buy.asset_instance_id, o_sell.asset_instance_id) AS asset_instance_id,
          a.type AS asset_type,
          a.symbol AS asset_symbol,
          ai.chain AS asset_chain,
          ai.contract_addr AS asset_contract,
          ai.token_id AS asset_token_id,
          ai.serial AS asset_serial,
          o_buy.user_id AS buyer_id,
          o_sell.user_id AS seller_id,
          ub.name AS buyer_name,
          us.name AS seller_name,
          ub.email AS buyer_email,
          us.email AS seller_email
        FROM trades t
        LEFT JOIN orders o_buy ON o_buy.id = t.buy_order_id
        LEFT JOIN orders o_sell ON o_sell.id = t.sell_order_id
        LEFT JOIN users ub ON ub.id = o_buy.user_id
        LEFT JOIN users us ON us.id = o_sell.user_id
        LEFT JOIN asset_instances ai ON ai.id = COALESCE(o_buy.asset_instance_id, o_sell.asset_instance_id)
        LEFT JOIN assets a ON a.id = COALESCE(o_buy.asset_id, o_sell.asset_id, ai.asset_id)
        LEFT JOIN journals j ON j.id = t.journal_id
        ORDER BY t.created_at DESC
        LIMIT 200";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$history = [];
foreach ($rows as $row) {
  $created = $row['occurred_at'] ?? $row['created_at'];
  try {
    $dt = new DateTime($created ?? 'now');
  } catch (Exception $e) {
    $dt = new DateTime();
  }
  $qty = isset($row['qty']) ? (float)$row['qty'] : 0.0;
  $price = isset($row['price']) ? (float)$row['price'] : 0.0;
  $total = round($qty * $price, 8);
  $assetType = $row['asset_type'] ?? null;
  $assetSymbol = $row['asset_symbol'] ?? '';
  if (!$assetSymbol && $assetType === 'bitcoin') {
    $assetSymbol = 'BTC';
  }
  if (!$assetSymbol && $assetType === 'nft') {
    $assetSymbol = 'NFT';
  }
  $refType = $row['ref_type'] ?? 'trade';
  $typeLabel = 'Trade';
  if ($refType === 'trade') {
    $typeLabel = $assetType === 'bitcoin' ? 'Trade BTC' : ($assetType === 'nft' ? 'Trade NFT' : 'Trade');
  } else {
    $typeLabel = ucfirst(str_replace('_', ' ', $refType));
  }
  $participants = trim(($row['buyer_name'] ?? '???') . ' → ' . ($row['seller_name'] ?? '???'));
  $hashSource = ($row['journal_id'] ? 'journal:' . $row['journal_id'] : 'trade:' . $row['trade_id']) . '|' . ($row['created_at'] ?? '');
  $hash = hash('sha256', $hashSource);
  $history[] = [
    'source' => 'exchange_trade',
    'id' => (int)$row['trade_id'],
    'date' => $dt->format('Y-m-d'),
    'time' => $dt->format('H:i:s'),
    'type' => $refType,
    'type_label' => $typeLabel,
    'asset_type' => $assetType,
    'asset_label' => $assetSymbol,
    'asset_token_id' => $row['asset_token_id'] ?? null,
    'asset_serial' => $row['asset_serial'] ?? null,
    'asset_chain' => $row['asset_chain'] ?? null,
    'asset_contract' => $row['asset_contract'] ?? null,
    'qty' => $qty,
    'price' => $price,
    'total' => $total,
    'buyer_name' => $row['buyer_name'] ?? null,
    'seller_name' => $row['seller_name'] ?? null,
    'buyer_email' => $row['buyer_email'] ?? null,
    'seller_email' => $row['seller_email'] ?? null,
    'participants' => $participants,
    'hash' => $hash,
    'created_at' => $row['created_at'],
    'occurred_at' => $row['occurred_at'],
    'timestamp' => $dt->getTimestamp()
  ];
}
$specialSql = "SELECT
                 r.id,
                 r.asset,
                 r.action,
                 r.amount,
                 r.total_brl,
                 r.user_id,
                 r.counterparty_id,
                 r.created_at,
                 r.confirmed_at,
                 r.executed_at,
                 initiator.name AS initiator_name,
                 initiator.email AS initiator_email,
                 counterparty.name AS counterparty_name,
                 counterparty.email AS counterparty_email
               FROM " . SPECIAL_ASSET_ACTION_REQUESTS_TABLE . " r
               LEFT JOIN users initiator ON initiator.id = r.user_id
               LEFT JOIN users counterparty ON counterparty.id = r.counterparty_id
               WHERE r.status = 'executed'
               ORDER BY COALESCE(r.executed_at, r.confirmed_at, r.created_at) DESC
               LIMIT 200";

$specialStmt = $pdo->query($specialSql);
$specialRows = $specialStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($specialRows as $row) {
  $moment = $row['executed_at'] ?? $row['confirmed_at'] ?? $row['created_at'];
  try {
    $dt = new DateTime($moment ?? 'now');
  } catch (Exception $e) {
    $dt = new DateTime();
  }

  $assetType = strtolower((string)($row['asset'] ?? ''));
  $action = strtolower((string)($row['action'] ?? ''));
  $amount = isset($row['amount']) ? (float)$row['amount'] : 0.0;
  $totalBrl = isset($row['total_brl']) && $row['total_brl'] !== null ? (float)$row['total_brl'] : null;

  $assetLabel = '';
  switch ($assetType) {
    case 'bitcoin':
      $assetLabel = 'BTC';
      break;
    case 'nft':
      $assetLabel = 'NFT';
      break;
    case 'brl':
      $assetLabel = 'BRL';
      break;
    case 'quotas':
      $assetLabel = 'Cotas';
      break;
    default:
      $assetLabel = strtoupper($assetType);
  }

  $participants = '';
  $initiator = build_user_display_data((int)($row['user_id'] ?? 0), $row['initiator_name'] ?? null, $row['initiator_email'] ?? null);
  $counterparty = null;
  if (!empty($row['counterparty_id'])) {
    $counterparty = build_user_display_data((int)$row['counterparty_id'], $row['counterparty_name'] ?? null, $row['counterparty_email'] ?? null);
  }

  if ($counterparty && !empty($counterparty['display_name'])) {
    $participants = trim(($initiator['display_name'] ?? 'Usuário') . ' → ' . $counterparty['display_name']);
  } else {
    $participants = $initiator['display_name'] ?? 'Usuário';
  }

  $unitPrice = null;
  if ($totalBrl !== null && $amount > 0 && $assetType !== 'brl') {
    $unitPrice = $totalBrl / $amount;
  }

  if ($assetType === 'brl' && $totalBrl === null) {
    $totalBrl = $amount;
  }

  $hashSource = 'special:' . ($row['id'] ?? '0') . '|' . $dt->format(DateTime::ATOM);
  $hash = hash('sha256', $hashSource);

  $history[] = [
    'source' => 'special_asset',
    'id' => (int)($row['id'] ?? 0),
    'date' => $dt->format('Y-m-d'),
    'time' => $dt->format('H:i:s'),
    'type' => 'special_asset_' . $action,
    'type_label' => 'Ativos especiais - ' . format_special_asset_action_label($action),
    'asset_type' => $assetType,
    'asset_label' => $assetLabel,
    'qty' => $amount,
    'price' => $unitPrice,
    'total' => $totalBrl,
    'buyer_name' => $initiator['display_name'] ?? null,
    'seller_name' => $counterparty['display_name'] ?? null,
    'participants' => $participants,
    'hash' => $hash,
    'created_at' => $row['created_at'] ?? null,
    'occurred_at' => $moment,
    'timestamp' => $dt->getTimestamp()
  ];
}

usort($history, static function ($a, $b) {
  $ta = $a['timestamp'] ?? 0;
  $tb = $b['timestamp'] ?? 0;
  if ($ta === $tb) {
    return 0;
  }
  return $ta < $tb ? 1 : -1;
});

// Limit final payload to avoid excessively large responses
if (count($history) > 400) {
  $history = array_slice($history, 0, 400);
}

// Remove helper timestamp before returning
foreach ($history as &$entry) {
  unset($entry['timestamp']);
}
unset($entry);

echo json_encode(['transactions' => $history]);
