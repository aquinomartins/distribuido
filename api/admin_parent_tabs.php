<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/parent_tabs.php';

require_login();
require_admin();

$pdo = db();
ensure_parent_tab_table($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  echo json_encode(parent_tab_overview($pdo));
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?? [];
  $userId = intval($body['user_id'] ?? 0);
  $tabs = isset($body['tabs']) ? $body['tabs'] : [];

  if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'missing_user_id']);
    exit;
  }

  $check = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
  $check->execute([$userId]);
  $userExists = $check->fetchColumn();
  if (!$userExists) {
    http_response_code(404);
    echo json_encode(['error' => 'user_not_found']);
    exit;
  }

  $result = upsert_parent_tabs($pdo, $userId, is_array($tabs) ? $tabs : []);
  echo json_encode(['ok' => true, 'is_parent' => $result['is_parent'], 'tabs' => $result['tabs']]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method_not_allowed']);
