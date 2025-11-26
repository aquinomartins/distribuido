<?php
header('Content-Type: application/json');
session_start();
$logged = isset($_SESSION['uid']);
$response = [
  'logged' => $logged,
  'user_id' => $logged ? intval($_SESSION['uid']) : null,
  'name' => $logged ? ($_SESSION['name'] ?? null) : null,
  'email' => $logged ? ($_SESSION['email'] ?? null) : null,
  'is_admin' => !empty($_SESSION['is_admin']),
  'category' => $logged ? ($_SESSION['category'] ?? null) : null
];

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';
$pdo = db();

if ($logged) {
  $sessionRefresh = $pdo->prepare("SELECT COALESCE(is_admin,0) AS is_admin, COALESCE(category,'') AS category FROM users WHERE id = ? LIMIT 1");
  if ($sessionRefresh->execute([$_SESSION['uid']])) {
    $row = $sessionRefresh->fetch(PDO::FETCH_ASSOC) ?: [];
    $response['is_admin'] = intval($row['is_admin'] ?? 0) === 1;
    $_SESSION['is_admin'] = $response['is_admin'];
    $response['category'] = $row['category'] ?? null;
    $_SESSION['category'] = $response['category'];
  }

  $response['is_special_liquidity_user'] = is_special_liquidity_user($pdo, $_SESSION['uid']);
} else {
  $response['is_special_liquidity_user'] = false;
}

$response['special_liquidity_email'] = special_liquidity_user_email($pdo);

echo json_encode($response);