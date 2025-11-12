<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
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
    'occurred_at' => $row['occurred_at']
  ];
}
echo json_encode(['transactions' => $history]);
