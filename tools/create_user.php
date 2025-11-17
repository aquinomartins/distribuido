<?php
// tools/create_user.php
// Script para criar um usuário com senha criptografada (password_hash).
// Acesse em: https://seudominio.com/tools/create_user.php
// ⚠️ Após criar o usuário, APAGUE este arquivo por segurança.

require_once __DIR__ . '/../lib/db.php';
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $phone = trim($_POST['phone'] ?? '');

    if ($name && $email && $password && $phone) {
        // Gera hash seguro da senha
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $phone, $hash]);
        $id = $pdo->lastInsertId();
        echo "<h3>✅ Usuário criado com sucesso!</h3>";
        echo "<p>ID: <strong>$id</strong></p>";
        echo "<p>Agora você pode fazer login no painel.</p>";
        echo "<hr><p><strong>IMPORTANTE:</strong> apague este arquivo (<code>tools/create_user.php</code>) do servidor.</p>";
        exit;
    } else {
        echo "<p style='color:red;'>Preencha todos os campos corretamente.</p>";
    }
}
?>

<!doctype html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <title>Criar Usuário</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 2rem; background: #fafafa; }
        form { background: white; padding: 2rem; border-radius: 8px; width: 300px; }
        input { width: 100%; margin: .5rem 0; padding: .5rem; }
        button { padding: .6rem 1rem; background: #4CAF50; border: none; color: white; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h2>Criar Usuário</h2>
    <form method="post">
        <label>Nome:<br><input name="name" required></label><br>
        <label>Email:<br><input name="email" type="email" required></label><br>
        <label>Telefone (com DDD):<br><input name="phone" type="tel" required></label><br>
        <label>Senha:<br><input name="password" type="password" required></label><br>
        <button type="submit">Criar</button>
    </form>
    <p>Após criar o usuário, <strong>delete este arquivo</strong> por segurança.</p>
</body>
</html>
