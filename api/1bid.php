<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/ledger.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); exit; }
$d = json_decode(file_get_contents('php://input'), true);
$pdo = db();

/* (1) Lança uma retenção (escrow) BRL/BTC do licitante */
$acc_cash = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='cash' LIMIT 1");
$acc_cash->execute([$d['bidder_id']]);
$cash_id = $acc_cash->fetchColumn();

$acc_escrow = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND purpose='escrow' LIMIT 1");
$acc_escrow->execute([$d['bidder_id']]);
$escrow_id = $acc_escrow->fetchColumn();

$jid = post_journal('bid','0','Escrow de lance',[
  ['account_id'=>$escrow_id, 'debit'=>$d['amount']],
  ['account_id'=>$cash_id,   'credit'=>$d['amount']]
]);

/* (2) Registra o lance */
$stmt = $pdo->prepare("INSERT INTO bids(auction_id, bidder_id, amount, status, journal_id) VALUES (?,?,?,?,?)");
$stmt->execute([$d['auction_id'], $d['bidder_id'], $d['amount'], 'valid', $jid]);

echo json_encode(['ok'=>true, 'bid_id'=>db()->lastInsertId()]);
