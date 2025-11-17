<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/ledger.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/auctions.php';
require_once __DIR__ . '/../lib/util.php';

require_login();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$auctionId = isset($data['auction_id']) ? (int)$data['auction_id'] : 0;
$amount = isset($data['amount']) ? round((float)$data['amount'], 2) : 0.0;

if ($auctionId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'auction_required']);
  exit;
}
if ($amount <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'amount_invalid']);
  exit;
}

$pdo = db();
auctions_sync_statuses($pdo);
$uid = current_user_id();

$cashStmt = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='cash' LIMIT 1");
$cashStmt->execute([$uid]);
$cashId = $cashStmt->fetchColumn();
$escrowStmt = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='escrow' LIMIT 1");
$escrowStmt->execute([$uid]);
$escrowId = $escrowStmt->fetchColumn();
if (!$cashId || !$escrowId) {
  ensure_user_accounts($uid);
  $cashStmt->execute([$uid]);
  $cashId = $cashStmt->fetchColumn();
  $escrowStmt->execute([$uid]);
  $escrowId = $escrowStmt->fetchColumn();
  if (!$cashId || !$escrowId) {
    http_response_code(400);
    echo json_encode(['error' => 'missing_accounts']);
    exit;
  }
}

$pdo->beginTransaction();
try {
  $auctionStmt = $pdo->prepare("SELECT id, status, reserve_price, starts_at, ends_at FROM auctions WHERE id = ? FOR UPDATE");
  $auctionStmt->execute([$auctionId]);
  $auction = $auctionStmt->fetch(PDO::FETCH_ASSOC);
  if (!$auction) {
    throw new RuntimeException('auction_not_found');
  }

  $status = $auction['status'];
  if ($status !== 'running') {
    throw new RuntimeException('auction_not_running');
  }

  $startsAt = $auction['starts_at'] ? new DateTimeImmutable($auction['starts_at']) : null;
  $endsAt = $auction['ends_at'] ? new DateTimeImmutable($auction['ends_at']) : null;
  $now = new DateTimeImmutable('now');
  if ($startsAt && $startsAt > $now) {
    throw new RuntimeException('auction_not_started');
  }
  if ($endsAt && $endsAt <= $now) {
    auctions_sync_statuses($pdo);
    throw new RuntimeException('auction_closed');
  }

  $highestStmt = $pdo->prepare("SELECT amount FROM bids WHERE auction_id = ? AND status IN ('valid','winner') ORDER BY amount DESC, id DESC LIMIT 1 FOR UPDATE");
  $highestStmt->execute([$auctionId]);
  $highestAmount = $highestStmt->fetchColumn();
  $currentBid = $highestAmount !== false ? (float)$highestAmount : 0.0;
  $nextMinimum = auctions_next_minimum_bid($auction['reserve_price'], $currentBid);
  if ($amount < $nextMinimum) {
    throw new RuntimeException('amount_too_low');
  }

  $pdo->prepare("UPDATE bids SET status='outbid' WHERE auction_id = ? AND status='valid'")->execute([$auctionId]);

  $journalId = post_journal('bid', (string)$auctionId, 'Escrow de lance', [
    ['account_id' => $escrowId, 'debit' => $amount],
    ['account_id' => $cashId,   'credit' => $amount]
  ]);

  $insert = $pdo->prepare("INSERT INTO bids(auction_id, bidder_id, amount, status, journal_id) VALUES (?,?,?,?,?)");
  $insert->execute([$auctionId, $uid, $amount, 'valid', $journalId]);
  $bidId = (int)$pdo->lastInsertId();

  $pdo->commit();
  $newMin = auctions_next_minimum_bid($auction['reserve_price'], $amount);
  echo json_encode([
    'ok' => true,
    'bid_id' => $bidId,
    'journal_id' => $journalId,
    'next_minimum_bid' => $newMin
  ]);
} catch (RuntimeException $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  $code = $e->getMessage();
  $statusCode = $code === 'auction_not_found' ? 404 : 400;
  http_response_code($statusCode);
  echo json_encode(['error' => $code]);
} catch (Exception $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  http_response_code(400);
  echo json_encode(['error' => 'cannot_register_bid', 'detail' => $e->getMessage()]);
}
