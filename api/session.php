<?php
header('Content-Type: application/json');
session_start();
$logged = isset($_SESSION['uid']);
$response = [
  'logged' => $logged,
  'user_id' => $logged ? intval($_SESSION['uid']) : null,
  'name' => $logged ? ($_SESSION['name'] ?? null) : null,
  'email' => $logged ? ($_SESSION['email'] ?? null) : null,
  'is_admin' => !empty($_SESSION['is_admin'])
];

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';
require_once __DIR__ . '/../lib/parent_tabs.php';
$pdo = db();

$pdo->exec("SET sql_notes = 0");
ensure_parent_tab_table($pdo);
$pdo->exec("SET sql_notes = 1");

if ($logged) {
  $response['is_special_liquidity_user'] = is_special_liquidity_user($pdo, $_SESSION['uid']);
  $tabs = parent_tabs_for_user($pdo, $_SESSION['uid']);
  $response['is_parent'] = is_array($tabs) && count($tabs) > 0;
  $response['parent_tabs'] = $response['is_parent'] ? $tabs : [];
} else {
  $response['is_special_liquidity_user'] = false;
  $response['is_parent'] = false;
  $response['parent_tabs'] = [];
}

$response['special_liquidity_email'] = special_liquidity_user_email($pdo);

echo json_encode($response);
