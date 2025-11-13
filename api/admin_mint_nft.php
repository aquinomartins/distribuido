<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/util.php';

require_login();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

if ($title === '') {
    http_response_code(422);
    echo json_encode(['error' => 'missing_title']);
    exit;
}

if ($user_id <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'invalid_user']);
    exit;
}

if (!isset($_FILES['image'])) {
    http_response_code(422);
    echo json_encode(['error' => 'image_required']);
    exit;
}

$image = $_FILES['image'];
if (!is_uploaded_file($image['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_upload']);
    exit;
}

if ($image['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'upload_failed', 'detail' => $image['error']]);
    exit;
}

$max_size = 5 * 1024 * 1024; // 5MB
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

$pdo = db();
$stmtUser = $pdo->prepare('SELECT id, name FROM users WHERE id=? LIMIT 1');
$stmtUser->execute([$user_id]);
$user = $stmtUser->fetch();
if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'user_not_found']);
    exit;
}

ensure_user_accounts($user_id);

$upload_dir = realpath(__DIR__ . '/..') . '/uploads/nfts';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0775, true);
}
$filename = sprintf('nft_%s_%s.%s', date('YmdHis'), bin2hex(random_bytes(4)), $allowed[$mime]);
$destination = $upload_dir . '/' . $filename;
$image_relative_path = 'uploads/nfts/' . $filename;

if (!move_uploaded_file($image['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['error' => 'save_failed']);
    exit;
}

try {
    $pdo->beginTransaction();

    $asset_meta = json_encode([
        'title' => $title,
        'image' => $image_relative_path
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("INSERT INTO assets(type, symbol, metadata_json) VALUES('nft', NULL, ?)");
    $stmt->execute([$asset_meta]);
    $asset_id = (int)$pdo->lastInsertId();

    $token_id = 'nft-' . bin2hex(random_bytes(8));
    $instance_meta = json_encode([
        'title' => $title,
        'description' => $description,
        'image' => $image_relative_path,
        'mime' => $mime
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("INSERT INTO asset_instances(asset_id, chain, token_id, metadata_json) VALUES(?, 'internal', ?, ?)");
    $stmt->execute([$asset_id, $token_id, $instance_meta]);
    $instance_id = (int)$pdo->lastInsertId();

    $work_specs = json_encode(['description' => $description], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare("INSERT INTO works(asset_instance_id, title, artist_id, specs_json) VALUES(?,?,?,?)");
    $stmt->execute([$instance_id, $title, $user_id, $work_specs]);
    $work_id = (int)$pdo->lastInsertId();

    $stmtAcc = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='nft_inventory' LIMIT 1");
    $stmtAcc->execute([$user_id]);
    $inventory_id = $stmtAcc->fetchColumn();
    if (!$inventory_id) {
        throw new Exception('inventory_not_found');
    }

    $stmtJournal = $pdo->prepare("INSERT INTO journals(ref_type, ref_id, memo) VALUES('mint', NULL, ?)");
    $stmtJournal->execute(['Mint NFT: ' . $title]);
    $journal_id = (int)$pdo->lastInsertId();

    $stmtMove = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id) VALUES(?,?,?,?,?,?)");
    $stmtMove->execute([$journal_id, NULL, $instance_id, 1, NULL, $inventory_id]);

    $pdo->commit();

    echo json_encode([
        'ok' => true,
        'work_id' => $work_id,
        'asset_id' => $asset_id,
        'instance_id' => $instance_id,
        'token_id' => $token_id,
        'owner_id' => $user_id,
        'image_url' => $image_relative_path,
        'title' => $title
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (file_exists($destination)) {
        unlink($destination);
    }
    http_response_code(500);
    echo json_encode(['error' => 'mint_failed', 'detail' => $e->getMessage()]);
}
