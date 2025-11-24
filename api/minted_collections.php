<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';

try {
    $pdo = db();
    $sql = "
        SELECT w.id AS work_id,
               w.title,
               w.created_at,
               ai.id AS instance_id,
               JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.image')) AS image_url,
               JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.description')) AS description,
               JSON_UNQUOTE(JSON_EXTRACT(w.specs_json, '$.dimensions')) AS dimensions,
               JSON_UNQUOTE(JSON_EXTRACT(w.specs_json, '$.technique')) AS technique,
               JSON_UNQUOTE(JSON_EXTRACT(w.specs_json, '$.author')) AS author,
               JSON_UNQUOTE(JSON_EXTRACT(w.specs_json, '$.year')) AS year,
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

    $grouped = [];
    $totalItems = 0;
    foreach ($rows as $row) {
        $ownerKey = $row['owner_id'] ? 'user_' . $row['owner_id'] : 'unassigned';
        if (!isset($grouped[$ownerKey])) {
            $display = $row['owner_name'] ?: ($row['owner_email'] ?: 'Sem proprietário definido');
            $grouped[$ownerKey] = [
                'owner_id' => $row['owner_id'],
                'owner_name' => $row['owner_name'],
                'owner_email' => $row['owner_email'],
                'owner_display' => $display,
                'items' => [],
                'latest_created_at' => $row['created_at']
            ];
        }
        $grouped[$ownerKey]['items'][] = [
            'work_id' => $row['work_id'],
            'title' => $row['title'],
            'instance_id' => $row['instance_id'],
            'image_url' => $row['image_url'],
            'description' => $row['description'],
            'dimensions' => $row['dimensions'],
            'technique' => $row['technique'],
            'author' => $row['author'],
            'year' => $row['year'],
            'created_at' => $row['created_at']
        ];
        $totalItems++;
        if ($row['created_at'] > ($grouped[$ownerKey]['latest_created_at'] ?? $row['created_at'])) {
            $grouped[$ownerKey]['latest_created_at'] = $row['created_at'];
        }
    }

    $collections = array_values($grouped);
    usort($collections, function ($a, $b) {
        $dateA = $a['latest_created_at'] ?? '';
        $dateB = $b['latest_created_at'] ?? '';
        if ($dateA === $dateB) {
            $nameA = strtolower($a['owner_display'] ?? $a['owner_name'] ?? $a['owner_email'] ?? '');
            $nameB = strtolower($b['owner_display'] ?? $b['owner_name'] ?? $b['owner_email'] ?? '');
            return $nameA <=> $nameB;
        }
        return $dateA < $dateB ? 1 : -1;
    });

    echo json_encode([
        'collections' => $collections,
        'total_items' => $totalItems,
        'total_collections' => count($collections)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'minted_collections_fetch_failed',
        'detail' => 'Não foi possível carregar as NFTs mintadas no momento.'
    ]);
}
