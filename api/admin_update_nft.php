<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';

require_login();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

$work_id = isset($_POST['work_id']) ? (int)$_POST['work_id'] : 0;
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';
$dimensions = isset($_POST['dimensions']) ? trim($_POST['dimensions']) : '';
$technique = isset($_POST['technique']) ? trim($_POST['technique']) : '';
$author = isset($_POST['author']) ? trim($_POST['author']) : '';
$year = isset($_POST['year']) ? trim($_POST['year']) : '';

if ($work_id <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'invalid_work']);
    exit;
}

if ($title === '') {
    http_response_code(422);
    echo json_encode(['error' => 'missing_title']);
    exit;
}

$pdo = db();
$stmt = $pdo->prepare("SELECT w.id, w.asset_instance_id, ai.asset_id, ai.metadata_json AS instance_meta, a.metadata_json AS asset_meta
                        FROM works w
                        JOIN asset_instances ai ON ai.id = w.asset_instance_id
                        JOIN assets a ON a.id = ai.asset_id
                        WHERE w.id = ?
                        LIMIT 1");
$stmt->execute([$work_id]);
$work = $stmt->fetch();

if (!$work) {
    http_response_code(404);
    echo json_encode(['error' => 'work_not_found']);
    exit;
}

$image_relative_path = null;
$mime = null;
$temp_file = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
    $image = $_FILES['image'];
    if ($image['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'upload_failed', 'detail' => $image['error']]);
        exit;
    }
    if (!is_uploaded_file($image['tmp_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_upload']);
        exit;
    }
    $max_size = 5 * 1024 * 1024;
    if (!empty($image['size']) && $image['size'] > $max_size) {
        http_response_code(413);
        echo json_encode(['error' => 'file_too_large']);
        exit;
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($image['tmp_name']);
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    if (!$mime || !array_key_exists($mime, $allowed)) {
        http_response_code(415);
        echo json_encode(['error' => 'unsupported_media_type']);
        exit;
    }
    $upload_dir = realpath(__DIR__ . '/..') . '/uploads/nfts';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0775, true);
    }
    $filename = sprintf('nft_%s_%s.%s', date('YmdHis'), bin2hex(random_bytes(4)), $allowed[$mime]);
    $destination = $upload_dir . '/' . $filename;
    if (!move_uploaded_file($image['tmp_name'], $destination)) {
        http_response_code(500);
        echo json_encode(['error' => 'save_failed']);
        exit;
    }
    $temp_file = $destination;
    $image_relative_path = 'uploads/nfts/' . $filename;
}

$instance_meta = json_decode($work['instance_meta'], true);
if (!is_array($instance_meta)) {
    $instance_meta = [];
}
$asset_meta = json_decode($work['asset_meta'], true);
if (!is_array($asset_meta)) {
    $asset_meta = [];
}
$old_image_path = isset($instance_meta['image']) ? $instance_meta['image'] : null;

if ($image_relative_path) {
    $instance_meta['image'] = $image_relative_path;
    $asset_meta['image'] = $image_relative_path;
    if ($mime) {
        $instance_meta['mime'] = $mime;
    }
}
$instance_meta['title'] = $title;
$instance_meta['description'] = $description;
$instance_meta['dimensions'] = $dimensions;
$instance_meta['technique'] = $technique;
$instance_meta['author'] = $author;
$instance_meta['year'] = $year;
$asset_meta['title'] = $title;
$asset_meta['dimensions'] = $dimensions;
$asset_meta['technique'] = $technique;
$asset_meta['author'] = $author;
$asset_meta['year'] = $year;

$specs = json_encode([
    'description' => $description,
    'dimensions' => $dimensions,
    'technique' => $technique,
    'author' => $author,
    'year' => $year
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$instance_json = json_encode($instance_meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$asset_json = json_encode($asset_meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE works SET title = ?, specs_json = ? WHERE id = ?');
    $stmt->execute([$title, $specs, $work_id]);

    $stmt = $pdo->prepare('UPDATE asset_instances SET metadata_json = ? WHERE id = ?');
    $stmt->execute([$instance_json, $work['asset_instance_id']]);

    $stmt = $pdo->prepare('UPDATE assets SET metadata_json = ? WHERE id = ?');
    $stmt->execute([$asset_json, $work['asset_id']]);

    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($temp_file && file_exists($temp_file)) {
        unlink($temp_file);
    }
    http_response_code(500);
    echo json_encode(['error' => 'update_failed', 'detail' => $e->getMessage()]);
    exit;
}

if ($image_relative_path && $old_image_path && $old_image_path !== $image_relative_path) {
    $previous = realpath(__DIR__ . '/..') . '/' . ltrim($old_image_path, '/');
    if (is_file($previous)) {
        @unlink($previous);
    }
}

$response_image = $image_relative_path ?: $instance_meta['image'] ?? null;

echo json_encode([
    'ok' => true,
    'work_id' => $work_id,
    'title' => $title,
    'description' => $description,
    'image_url' => $response_image
]);
