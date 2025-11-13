<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';

require_login();
require_admin();

$pdo = db();
$sql = "
SELECT w.id AS work_id,
       w.title,
       w.created_at,
       ai.id AS instance_id,
       JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.image')) AS image_url,
       JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.description')) AS description,
       u.id AS owner_id,
       u.name AS owner_name,
       u.email AS owner_email
FROM works w
JOIN asset_instances ai ON ai.id = w.asset_instance_id
JOIN assets a ON a.id = ai.asset_id AND a.type = 'nft'
LEFT JOIN positions p ON p.asset_id = a.id AND p.owner_type = 'user' AND p.qty > 0
LEFT JOIN users u ON u.id = p.owner_id
ORDER BY w.created_at DESC, w.id DESC";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

echo json_encode($rows);
