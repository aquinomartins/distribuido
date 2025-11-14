<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();

try {
    $pdo = db();
    $sql = "
        SELECT
            o.id AS order_id,
            o.price,
            o.qty,
            o.created_at,
            ai.id AS instance_id,
            ai.token_id,
            a.id AS asset_id,
            w.id AS work_id,
            w.title,
            JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.image')) AS image_url,
            JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.description')) AS description,
            u.id AS seller_id,
            u.name AS seller_name,
            u.email AS seller_email
        FROM orders o
        JOIN asset_instances ai ON ai.id = o.asset_instance_id
        JOIN assets a ON a.id = ai.asset_id AND a.type = 'nft'
        LEFT JOIN works w ON w.asset_instance_id = ai.id
        JOIN users u ON u.id = o.user_id
        WHERE o.status = 'open' AND o.side = 'sell' AND o.qty > 0
        ORDER BY o.created_at DESC";
    $stmt = $pdo->query($sql);
    $listings = $stmt->fetchAll();

    echo json_encode(['listings' => $listings]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'nft_listings_fetch_failed',
        'detail' => 'Não foi possível carregar as NFTs à venda agora.'
    ]);
}
