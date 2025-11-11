<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$userId = current_user_id();
if (!$userId) {
  http_response_code(401);
  echo json_encode(['error' => 'not_authenticated']);
  exit;
}

$pdo = db();
$isSpecialUser = is_special_liquidity_user($pdo, $userId);

if ($method === 'GET') {
  try {
    $stmt = $pdo->prepare('SELECT state_json FROM liquidity_game_states WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $state = null;
    if ($row && isset($row['state_json'])) {
      $decoded = json_decode($row['state_json'], true);
      if (json_last_error() === JSON_ERROR_NONE) {
        $state = $decoded;
      }
    }
    $response = ['state' => $state];
    if ($isSpecialUser) {
      $response['special_assets'] = get_special_liquidity_assets($pdo, $userId);
    }
    echo json_encode($response);
  } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'cannot_load_state']);
  }
  exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $payload = json_decode($raw, true);
  if ($raw !== '' && $payload === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_json']);
    exit;
  }
  $state = null;
  if (is_array($payload) && array_key_exists('state', $payload)) {
    $state = $payload['state'];
  } elseif ($payload === null && $raw === '') {
    $state = null;
  }

  $specialAssetsPayload = null;
  if (is_array($payload) && array_key_exists('special_assets', $payload)) {
    if (!$isSpecialUser) {
      http_response_code(403);
      echo json_encode(['error' => 'forbidden_special_assets']);
      exit;
    }
    $specialAssetsPayload = normalize_special_liquidity_payload($payload['special_assets']);
  }

  if ($state === null) {
    try {
      $pdo->beginTransaction();
      $stmt = $pdo->prepare('DELETE FROM liquidity_game_states WHERE user_id = ?');
      $stmt->execute([$userId]);
      if ($isSpecialUser && $specialAssetsPayload !== null) {
        save_special_liquidity_assets($pdo, $userId, $specialAssetsPayload);
      }
      $pdo->commit();
    } catch (Exception $e) {
      if ($pdo->inTransaction()) {
        $pdo->rollBack();
      }
      http_response_code(500);
      echo json_encode(['error' => 'cannot_save_state']);
      exit;
    }

    if ($isSpecialUser) {
      echo json_encode(['state' => null, 'special_assets' => get_special_liquidity_assets($pdo, $userId)]);
    } else {
      echo json_encode(['state' => null]);
    }
    exit;
  }

  if (!is_array($state)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_state']);
    exit;
  }

  $jsonState = json_encode($state, JSON_UNESCAPED_UNICODE);
  if ($jsonState === false) {
    http_response_code(400);
    echo json_encode(['error' => 'state_encoding_failed']);
    exit;
  }

  try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO liquidity_game_states (user_id, state_json, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = NOW()');
    $stmt->execute([$userId, $jsonState]);

    sync_special_liquidity_assets_from_game_state($pdo, $state);

    $response = ['state' => $state];
    if ($isSpecialUser) {
      if ($specialAssetsPayload !== null) {
        save_special_liquidity_assets($pdo, $userId, $specialAssetsPayload);
      }
      $response['special_assets'] = get_special_liquidity_assets($pdo, $userId);
    }

    $pdo->commit();

    echo json_encode($response);
  } catch (Exception $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'cannot_save_state']);
  }
  exit;
}

http_response_code(405);
header('Allow: GET, POST');
echo json_encode(['error' => 'method_not_allowed']);