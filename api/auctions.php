<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/auctions.php';

header('Content-Type: application/json');
$pdo = db();
auctions_sync_statuses($pdo);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') {
  handle_auctions_list($pdo);
  exit;
}
if ($method === 'POST') {
  require_login();
  handle_auctions_admin($pdo);
  exit;
}
http_response_code(405);
echo json_encode(['error' => 'method_not_allowed']);
exit;

function handle_auctions_list(PDO $pdo) {
  $isAdmin = current_user_is_admin();
  $allowedStatuses = $isAdmin ? ['draft', 'running', 'ended'] : ['running', 'ended'];
  $placeholders = implode(',', array_fill(0, count($allowedStatuses), '?'));
  $sql = "SELECT a.id, a.seller_id, a.asset_instance_id, a.starts_at, a.ends_at, a.reserve_price, a.status,
                 u.name AS seller_name, u.email AS seller_email,
                 JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.image')) AS image_url,
                 JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.description')) AS nft_description,
                 JSON_UNQUOTE(JSON_EXTRACT(ai.metadata_json, '$.name')) AS nft_title,
                 w.title AS work_title, w.id AS work_id
          FROM auctions a
          LEFT JOIN users u ON u.id = a.seller_id
          LEFT JOIN asset_instances ai ON ai.id = a.asset_instance_id
          LEFT JOIN works w ON w.asset_instance_id = ai.id
          WHERE a.status IN ($placeholders)
          ORDER BY CASE a.status WHEN 'running' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, a.ends_at ASC, a.id DESC";
  $stmt = $pdo->prepare($sql);
  $stmt->execute($allowedStatuses);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
  $auctionIds = array_map(fn($row) => (int)$row['id'], $rows);

  $stats = [];
  if ($auctionIds) {
    $in = implode(',', array_fill(0, count($auctionIds), '?'));
    $bidsStmt = $pdo->prepare("SELECT b.auction_id, b.amount, b.status, u.name AS bidder_name
                               FROM bids b
                               LEFT JOIN users u ON u.id = b.bidder_id
                               WHERE b.auction_id IN ($in)
                               ORDER BY b.amount DESC, b.id DESC");
    $bidsStmt->execute($auctionIds);
    while ($bid = $bidsStmt->fetch(PDO::FETCH_ASSOC)) {
      $aid = (int)$bid['auction_id'];
      if (!isset($stats[$aid])) {
        $stats[$aid] = ['count' => 0, 'highest' => null];
      }
      $stats[$aid]['count']++;
      $isValid = in_array($bid['status'], ['valid', 'winner'], true);
      if ($isValid && $stats[$aid]['highest'] === null) {
        $stats[$aid]['highest'] = [
          'amount' => (float)$bid['amount'],
          'bidder_name' => $bid['bidder_name'] ?? null
        ];
      }
    }
  }

  $auctions = array_map(function($row) use ($stats) {
    $aid = (int)$row['id'];
    $stat = $stats[$aid] ?? ['count' => 0, 'highest' => null];
    $highestAmount = $stat['highest']['amount'] ?? 0.0;
    $status = $row['status'];
    $nextMinimum = $status === 'running'
      ? auctions_next_minimum_bid($row['reserve_price'], $highestAmount)
      : null;
    $title = $row['work_title'] ?? $row['nft_title'] ?? ('NFT #' . $aid);
    return [
      'id' => $aid,
      'seller_id' => isset($row['seller_id']) ? (int)$row['seller_id'] : null,
      'seller_name' => $row['seller_name'] ?? null,
      'seller_email' => $row['seller_email'] ?? null,
      'asset_instance_id' => isset($row['asset_instance_id']) ? (int)$row['asset_instance_id'] : null,
      'title' => $title,
      'description' => $row['nft_description'] ?? '',
      'image_url' => $row['image_url'] ?? null,
      'reserve_price' => (float)$row['reserve_price'],
      'status' => $status,
      'starts_at' => $row['starts_at'] ? date(DATE_ATOM, strtotime($row['starts_at'])) : null,
      'ends_at' => $row['ends_at'] ? date(DATE_ATOM, strtotime($row['ends_at'])) : null,
      'highest_bid' => $highestAmount,
      'highest_bidder_name' => $stat['highest']['bidder_name'] ?? null,
      'bids_count' => $stat['count'],
      'next_minimum_bid' => $nextMinimum,
      'work_id' => isset($row['work_id']) ? (int)$row['work_id'] : null
    ];
  }, $rows);

  echo json_encode([
    'auctions' => $auctions,
    'server_time' => gmdate('c'),
    'bid_increment' => auctions_min_increment(),
    'is_admin' => $isAdmin
  ]);
}

function handle_auctions_admin(PDO $pdo) {
  require_admin();
  $body = json_decode(file_get_contents('php://input'), true) ?: [];
  $action = strtolower(trim($body['action'] ?? 'create'));
  switch ($action) {
    case 'create':
      create_auction($pdo, $body);
      return;
    case 'start':
      mutate_auction_status($pdo, $body, 'start');
      return;
    case 'finalize':
      mutate_auction_status($pdo, $body, 'finalize');
      return;
    default:
      http_response_code(400);
      echo json_encode(['error' => 'invalid_action']);
      return;
  }
}

function create_auction(PDO $pdo, array $body) {
  $sellerId = isset($body['seller_id']) ? (int)$body['seller_id'] : 0;
  $assetInstanceId = isset($body['asset_instance_id']) ? (int)$body['asset_instance_id'] : 0;
  $startsAtRaw = $body['starts_at'] ?? null;
  $endsAtRaw = $body['ends_at'] ?? null;
  $reserve = isset($body['reserve_price']) ? max(0, (float)$body['reserve_price']) : 0.0;
  if (!$sellerId || !$assetInstanceId || !$startsAtRaw || !$endsAtRaw) {
    http_response_code(400);
    echo json_encode(['error' => 'missing_fields']);
    return;
  }
  try {
    $startsAt = new DateTimeImmutable($startsAtRaw);
    $endsAt = new DateTimeImmutable($endsAtRaw);
  } catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_schedule']);
    return;
  }
  if ($endsAt <= $startsAt) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_schedule']);
    return;
  }
  $now = new DateTimeImmutable('now');
  if ($endsAt <= $now) {
    http_response_code(400);
    echo json_encode(['error' => 'schedule_in_past']);
    return;
  }
  $userCheck = $pdo->prepare("SELECT id FROM users WHERE id = ? AND COALESCE(confirmed,0) = 1 LIMIT 1");
  $userCheck->execute([$sellerId]);
  if (!$userCheck->fetchColumn()) {
    http_response_code(400);
    echo json_encode(['error' => 'seller_not_found']);
    return;
  }
  $assetCheck = $pdo->prepare("SELECT id FROM asset_instances WHERE id = ? LIMIT 1");
  $assetCheck->execute([$assetInstanceId]);
  if (!$assetCheck->fetchColumn()) {
    http_response_code(400);
    echo json_encode(['error' => 'asset_not_found']);
    return;
  }

  $status = ($startsAt <= $now) ? 'running' : 'draft';
  $stmt = $pdo->prepare("INSERT INTO auctions (seller_id, asset_instance_id, starts_at, ends_at, reserve_price, status)
                         VALUES (?,?,?,?,?,?)");
  $stmt->execute([
    $sellerId,
    $assetInstanceId,
    $startsAt->format('Y-m-d H:i:s'),
    $endsAt->format('Y-m-d H:i:s'),
    $reserve,
    $status
  ]);
  echo json_encode(['ok' => true, 'auction_id' => (int)$pdo->lastInsertId(), 'status' => $status]);
}

function mutate_auction_status(PDO $pdo, array $body, string $mode) {
  $auctionId = isset($body['auction_id']) ? (int)$body['auction_id'] : 0;
  if (!$auctionId) {
    http_response_code(400);
    echo json_encode(['error' => 'auction_required']);
    return;
  }
  $stmt = $pdo->prepare("SELECT id, status, ends_at FROM auctions WHERE id = ? LIMIT 1");
  $stmt->execute([$auctionId]);
  $auction = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$auction) {
    http_response_code(404);
    echo json_encode(['error' => 'auction_not_found']);
    return;
  }
  $now = new DateTimeImmutable('now');
  if ($mode === 'start') {
    if ($auction['status'] !== 'draft') {
      http_response_code(400);
      echo json_encode(['error' => 'invalid_status']);
      return;
    }
    $endsAt = $auction['ends_at'] ? new DateTimeImmutable($auction['ends_at']) : $now->add(new DateInterval('PT30M'));
    if ($endsAt <= $now) {
      $endsAt = $now->add(new DateInterval('PT30M'));
    }
    $update = $pdo->prepare("UPDATE auctions SET status='running', starts_at=?, ends_at=? WHERE id=?");
    $update->execute([$now->format('Y-m-d H:i:s'), $endsAt->format('Y-m-d H:i:s'), $auctionId]);
    echo json_encode(['ok' => true, 'status' => 'running']);
    return;
  }
  if ($mode === 'finalize') {
    if ($auction['status'] === 'ended') {
      echo json_encode(['ok' => true, 'status' => 'ended']);
      return;
    }
    $update = $pdo->prepare("UPDATE auctions SET status='ended', ends_at=? WHERE id=?");
    $update->execute([$now->format('Y-m-d H:i:s'), $auctionId]);
    echo json_encode(['ok' => true, 'status' => 'ended']);
    return;
  }
}
