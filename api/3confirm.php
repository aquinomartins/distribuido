<?php
require_once __DIR__ . '/../lib/db.php';
$pdo = db();

$token = $_GET['token'] ?? '';
if (!$token) { die("Token inválido."); }

$stmt = $pdo->prepare("SELECT user_id FROM user_confirmations WHERE token=? LIMIT 1");
$stmt->execute([$token]);
$row = $stmt->fetch();

if (!$row) {
    die("Token não encontrado ou já usado.");
}

$user_id = $row['user_id'];
$pdo->prepare("UPDATE users SET confirmed=1 WHERE id=?")->execute([$user_id]);
$pdo->prepare("DELETE FROM user_confirmations WHERE token=?")->execute([$token]);

echo "<h2>✅ Cadastro confirmado com sucesso!</h2><p>Você já pode fazer login normalmente.</p>";
