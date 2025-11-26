<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';

require_login();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$userId = isset($body['user_id']) ? intval($body['user_id']) : 0;
$categoryInput = strtolower(trim($body['category'] ?? ''));
$category = $categoryInput === 'pais' ? 'Pais' : null;

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'missing_user']);
  exit;
}

try {
  $pdo = db();
  $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
  $stmt->execute([$userId]);
  if (!$stmt->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['error' => 'user_not_found']);
    exit;
  }

  $upd = $pdo->prepare('UPDATE users SET category = :category WHERE id = :id');
  $upd->execute([
    ':category' => $category,
    ':id' => $userId,
  ]);

  echo json_encode(['ok' => true, 'category' => $category]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'cannot_update_category', 'detail' => $e->getMessage()]);
}
