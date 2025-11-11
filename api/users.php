<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();
header('Content-Type: application/json');

try {
  $pdo = db();
  $userId = current_user_id();

  if (current_user_is_admin()) {
    $stmt = $pdo->query(
      "SELECT u.id, u.name, a.bitcoin, a.nft, a.brl, a.quotas\n"
      . "FROM users u\n"
      . "LEFT JOIN special_liquidity_assets a ON a.user_id = u.id\n"
      . "WHERE COALESCE(u.confirmed,0)=1\n"
      . "ORDER BY u.name"
    );
  } else {
    if (!$userId) {
      http_response_code(401);
      echo json_encode(['error' => 'not_authenticated']);
      exit;
    }
    ensure_special_liquidity_row($pdo, $userId);
    $stmt = $pdo->prepare(
      "SELECT u.id, u.name, a.bitcoin, a.nft, a.brl, a.quotas\n"
      . "FROM users u\n"
      . "LEFT JOIN special_liquidity_assets a ON a.user_id = u.id\n"
      . "WHERE COALESCE(u.confirmed,0)=1 AND u.id = ?\n"
      . "ORDER BY u.name"
    );
    $stmt->execute([$userId]);
  }

  $rows = $stmt->fetchAll();

  $othersSummary = [
    'count' => 0,
    'assets' => [
      'bitcoin' => 0.0,
      'nft' => 0,
      'brl' => 0.0,
      'quotas' => 0.0
    ]
  ];
  $otherUsers = [];

  if ($userId) {
    $summaryStmt = $pdo->prepare(
      "SELECT COUNT(*) AS total_users,\n"
      . "       COALESCE(SUM(a.bitcoin),0) AS bitcoin,\n"
      . "       COALESCE(SUM(a.nft),0) AS nft,\n"
      . "       COALESCE(SUM(a.brl),0) AS brl,\n"
      . "       COALESCE(SUM(a.quotas),0) AS quotas\n"
      . "FROM special_liquidity_assets a\n"
      . "INNER JOIN users u ON u.id = a.user_id\n"
      . "WHERE a.user_id <> ? AND COALESCE(u.confirmed,0) = 1"
    );
    $summaryStmt->execute([$userId]);
    $summaryRow = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $othersSummary['count'] = isset($summaryRow['total_users']) ? (int)$summaryRow['total_users'] : 0;
    $othersSummary['assets']['bitcoin'] = isset($summaryRow['bitcoin']) ? (float)$summaryRow['bitcoin'] : 0.0;
    $othersSummary['assets']['nft'] = isset($summaryRow['nft']) ? (int)$summaryRow['nft'] : 0;
    $othersSummary['assets']['brl'] = isset($summaryRow['brl']) ? (float)$summaryRow['brl'] : 0.0;
    $othersSummary['assets']['quotas'] = isset($summaryRow['quotas']) ? (float)$summaryRow['quotas'] : 0.0;
    $otherUsersStmt = $pdo->prepare(
      "SELECT u.id, u.name, a.bitcoin, a.nft, a.brl, a.quotas\n"
      . "FROM users u\n"
      . "LEFT JOIN special_liquidity_assets a ON a.user_id = u.id\n"
      . "WHERE COALESCE(u.confirmed,0)=1 AND u.id <> ?\n"
      . "ORDER BY u.name"
    );
    $otherUsersStmt->execute([$userId]);
    $otherUsersRows = $otherUsersStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $otherUsers = array_map(function($row){
      $bitcoin = isset($row['bitcoin']) ? (float)$row['bitcoin'] : 0.0;
      $nft = isset($row['nft']) ? (int)$row['nft'] : 0;
      $brl = isset($row['brl']) ? (float)$row['brl'] : 0.0;
      $quotas = isset($row['quotas']) ? (float)$row['quotas'] : 0.0;
      return [
        'id' => intval($row['id'] ?? 0),
        'name' => $row['name'] ?? '',
        'assets' => [
          'bitcoin' => $bitcoin,
          'nft' => $nft,
          'brl' => $brl,
          'quotas' => $quotas
        ]
      ];
    }, $otherUsersRows);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'cannot_list_users']);
  exit;
}

$users = array_map(function($row){
  $bitcoin = isset($row['bitcoin']) ? (float)$row['bitcoin'] : 0.0;
  $nft = isset($row['nft']) ? (int)$row['nft'] : 0;
  $brl = isset($row['brl']) ? (float)$row['brl'] : 0.0;
  $quotas = isset($row['quotas']) ? (float)$row['quotas'] : 0.0;
  return [
    'id' => intval($row['id'] ?? 0),
    'name' => $row['name'] ?? '',
    'assets' => [
      'bitcoin' => $bitcoin,
      'nft' => $nft,
      'brl' => $brl,
      'quotas' => $quotas
    ]
  ];
}, $rows ?: []);

echo json_encode([
  'users' => $users,
  'others_summary' => $othersSummary,
  'other_users' => $otherUsers
]);