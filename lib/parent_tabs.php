<?php
function ensure_parent_tab_table(PDO $pdo){
  $pdo->exec("CREATE TABLE IF NOT EXISTS parent_tab_visibility (
    user_id BIGINT PRIMARY KEY,
    allowed_tabs JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

function sanitize_parent_tabs($tabs){
  if (!is_array($tabs)) return [];
  $clean = [];
  foreach ($tabs as $tab){
    if (!is_string($tab)) continue;
    $tab = trim($tab);
    if ($tab === '') continue;
    $clean[] = $tab;
  }
  return array_values(array_unique($clean));
}

function parent_tabs_for_user(PDO $pdo, $userId){
  ensure_parent_tab_table($pdo);
  $stmt = $pdo->prepare("SELECT allowed_tabs FROM parent_tab_visibility WHERE user_id = ? LIMIT 1");
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  if (!$row) return null;
  $tabs = json_decode($row['allowed_tabs'], true);
  return is_array($tabs) ? sanitize_parent_tabs($tabs) : [];
}

function upsert_parent_tabs(PDO $pdo, $userId, array $tabs){
  ensure_parent_tab_table($pdo);
  $tabs = sanitize_parent_tabs($tabs);
  if (empty($tabs)){
    $del = $pdo->prepare('DELETE FROM parent_tab_visibility WHERE user_id = ?');
    $del->execute([$userId]);
    return ['is_parent' => false, 'tabs' => []];
  }
  $payload = json_encode(array_values($tabs));
  $stmt = $pdo->prepare('INSERT INTO parent_tab_visibility (user_id, allowed_tabs) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE allowed_tabs = VALUES(allowed_tabs)');
  $stmt->execute([$userId, $payload]);
  return ['is_parent' => true, 'tabs' => $tabs];
}

function parent_tab_map(PDO $pdo){
  ensure_parent_tab_table($pdo);
  $stmt = $pdo->query('SELECT user_id, allowed_tabs FROM parent_tab_visibility');
  $map = [];
  foreach ($stmt->fetchAll() as $row){
    $tabs = json_decode($row['allowed_tabs'], true);
    $map[intval($row['user_id'])] = is_array($tabs) ? sanitize_parent_tabs($tabs) : [];
  }
  return $map;
}

function parent_tab_overview(PDO $pdo){
  ensure_parent_tab_table($pdo);
  $sql = 'SELECT pt.user_id, pt.allowed_tabs, u.name, u.email FROM parent_tab_visibility pt
          INNER JOIN users u ON u.id = pt.user_id
          ORDER BY u.name';
  $stmt = $pdo->query($sql);
  $rows = [];
  foreach ($stmt->fetchAll() as $row){
    $tabs = json_decode($row['allowed_tabs'], true);
    $rows[] = [
      'user_id' => intval($row['user_id']),
      'name' => $row['name'] ?? '',
      'email' => $row['email'] ?? '',
      'tabs' => is_array($tabs) ? sanitize_parent_tabs($tabs) : []
    ];
  }
  return $rows;
}
?>
