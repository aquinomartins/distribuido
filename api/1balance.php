<?php
require_once __DIR__ . '/../lib/db.php';
header('Content-Type: application/json');

$user_id = intval($_GET['user_id'] ?? 1);              // <— substitua por auth real
$pdo = db();

/* Saldo por conta (debits - credits) */
$sql = "
SELECT a.id, a.currency, a.purpose,
       ROUND(SUM(e.debit - e.credit),8) AS balance
FROM accounts a
LEFT JOIN entries e ON e.account_id = a.id
WHERE a.owner_type='user' AND a.owner_id=?
GROUP BY a.id, a.currency, a.purpose
ORDER BY a.currency, a.purpose";
$stmt = $pdo->prepare($sql); $stmt->execute([$user_id]);
$rows = $stmt->fetchAll();

/* Histórico (últimos 50 journals) */
$sql2 = "
SELECT j.id, j.occurred_at, j.ref_type, j.memo,
       SUM(e.debit) debit, SUM(e.credit) credit
FROM journals j
JOIN entries e ON e.journal_id=j.id
JOIN accounts a ON a.id=e.account_id
WHERE a.owner_type='user' AND a.owner_id=?
GROUP BY j.id
ORDER BY j.occurred_at DESC
LIMIT 50";
$stmt2 = $pdo->prepare($sql2); $stmt2->execute([$user_id]);
$journals = $stmt2->fetchAll();

echo json_encode(['accounts'=>$rows, 'journals'=>$journals]);
