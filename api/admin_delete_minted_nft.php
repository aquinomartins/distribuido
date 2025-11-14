<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$work_id = isset($input['work_id']) ? (int)$input['work_id'] : 0;
if ($work_id <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'invalid_work']);
    exit;
}

$pdo = db();
$stmt = $pdo->prepare("SELECT w.id, w.asset_instance_id, ai.asset_id,
                              JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.image')) AS image_path
                       FROM works w
                       JOIN asset_instances ai ON ai.id = w.asset_instance_id
                       WHERE w.id = ?
                       LIMIT 1");
$stmt->execute([$work_id]);
$work = $stmt->fetch();

if (!$work) {
    http_response_code(404);
    echo json_encode(['error' => 'work_not_found']);
    exit;
}

$assetInstanceId = (int)$work['asset_instance_id'];
$assetId = (int)$work['asset_id'];
$imagePath = $work['image_path'];

$stmt = $pdo->prepare("SELECT owner_id\n                       FROM positions\n                       WHERE asset_id = ? AND owner_type = 'user' AND qty > 0\n                       LIMIT 1");
$stmt->execute([$assetId]);
$ownerId = $stmt->fetchColumn();
$ownerId = $ownerId !== false ? (int)$ownerId : null;

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT DISTINCT journal_id FROM asset_moves WHERE asset_instance_id = ?');
    $stmt->execute([$assetInstanceId]);
    $journalIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if ($journalIds) {
        $placeholders = implode(',', array_fill(0, count($journalIds), '?'));
        $delJournals = $pdo->prepare("DELETE FROM journals WHERE id IN ($placeholders)");
        $delJournals->execute($journalIds);
    }

    $stmt = $pdo->prepare('DELETE FROM positions WHERE asset_id = ?');
    $stmt->execute([$assetId]);

    $stmt = $pdo->prepare('DELETE FROM works WHERE id = ?');
    $stmt->execute([$work_id]);

    $stmt = $pdo->prepare('DELETE FROM asset_instances WHERE id = ?');
    $stmt->execute([$assetInstanceId]);

    $stmt = $pdo->prepare('DELETE FROM assets WHERE id = ?');
    $stmt->execute([$assetId]);

    if ($ownerId) {
        increment_special_liquidity_nft($pdo, $ownerId, -1);
    }

    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'delete_failed', 'detail' => $e->getMessage()]);
    exit;
}

if ($imagePath) {
    $basePath = realpath(__DIR__ . '/..');
    if ($basePath) {
        $fullPath = $basePath . '/' . ltrim($imagePath, '/');
        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }
}

echo json_encode(['ok' => true, 'deleted_work_id' => $work_id]);
