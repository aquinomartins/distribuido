<?php
require_once __DIR__ . '/../lib/db.php';
header('Content-Type: application/json');

$user_id = intval($_GET['user_id'] ?? 1);
$pdo = db();

/* Total BTC do usuário (somatório das contas BTC) */
$sql = "
SELECT ROUND(SUM(e.debit - e.credit),8) AS btc_total
FROM accounts a
LEFT JOIN entries e ON e.account_id=a.id
WHERE a.owner_type='user' AND a.owner_id=? AND a.currency='BTC'";
$stmt = $pdo->prepare($sql); $stmt->execute([$user_id]);
$total = $stmt->fetchColumn();

/* Recebidos (depósitos/prêmios) e pagos (withdraw/fees) */
$sqlR = "
SELECT j.occurred_at, j.ref_type, j.memo, SUM(e.debit) as amount
FROM journals j
JOIN entries e ON e.journal_id=j.id
JOIN accounts a ON a.id=e.account_id
WHERE a.owner_type='user' AND a.owner_id=? AND a.currency='BTC' AND e.debit>0
GROUP BY j.id ORDER BY j.occurred_at DESC LIMIT 50";
$stmtR = $pdo->prepare($sqlR); $stmtR->execute([$user_id]);
$recv = $stmtR->fetchAll();

$sqlP = "
SELECT j.occurred_at, j.ref_type, j.memo, SUM(e.credit) as amount
FROM journals j
JOIN entries e ON e.journal_id=j.id
JOIN accounts a ON a.id=e.account_id
WHERE a.owner_type='user' AND a.owner_id=? AND a.currency='BTC' AND e.credit>0
GROUP BY j.id ORDER BY j.occurred_at DESC LIMIT 50";
$stmtP = $pdo->prepare($sqlP); $stmtP->execute([$user_id]);
$paid = $stmtP->fetchAll();

echo json_encode(['btc_total'=>$total, 'recebidos'=>$recv, 'pagos'=>$paid]);
