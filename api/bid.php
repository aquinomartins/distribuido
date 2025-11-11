<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/ledger.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); echo json_encode(['error'=>'POST only']); exit; }
$d = json_decode(file_get_contents('php://input'), true);
$pdo = db();
$uid = current_user_id();
$acc_cash = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='cash' LIMIT 1");
$acc_cash->execute([$uid]);
$cash_id = $acc_cash->fetchColumn();
$acc_escrow = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='escrow' LIMIT 1");
$acc_escrow->execute([$uid]);
$escrow_id = $acc_escrow->fetchColumn();
if (!$cash_id or !$escrow_id) { http_response_code(400); echo json_encode(['error'=>'Contas cash/escrow ausentes.']); exit; }
$amount = floatval($d['amount'] ?? 0);
if ($amount <= 0) { http_response_code(400); echo json_encode(['error'=>'amount_invalid']); exit; }
$jid = post_journal('bid','0','Escrow de lance', [
  ['account_id'=>$escrow_id, 'debit'=>$amount],
  ['account_id'=>$cash_id,   'credit'=>$amount]
]);
$stmt = $pdo->prepare("INSERT INTO bids(auction_id, bidder_id, amount, status, journal_id) VALUES (?,?,?,?,?)");
$stmt->execute([$d['auction_id'], $uid, $amount, 'valid', $jid]);
echo json_encode(['ok'=>true, 'bid_id'=>$pdo->lastInsertId(), 'journal_id'=>$jid]);