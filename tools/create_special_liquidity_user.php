<?php
require_once __DIR__ . '/../lib/special_liquidity_user.php';

$pdo = db();
$message = '';
$current = null;

$stmt = $pdo->prepare('SELECT id, name, phone FROM users WHERE email = ? LIMIT 1');
$stmt->execute([SPECIAL_LIQUIDITY_USER_EMAIL]);
$current = $stmt->fetch(PDO::FETCH_ASSOC);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $password = $_POST['password'] ?? '';
    $phone = trim($_POST['phone'] ?? '');
    $bitcoin = $_POST['bitcoin'] ?? 0;
    $nft = $_POST['nft'] ?? 0;
    $brl = $_POST['brl'] ?? 0;
    $quotas = $_POST['quotas'] ?? 0;

    if ($name && $password && $phone) {
        $pdo->beginTransaction();
        try {
            if ($current) {
                $stmt = $pdo->prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?');
                $stmt->execute([$name, $phone, $current['id']]);
                $userId = (int)$current['id'];
                if (!empty($password)) {
                    $hash = password_hash($password, PASSWORD_BCRYPT);
                    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $userId]);
                }
            } else {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash, confirmed, is_admin) VALUES (?, ?, ?, ?, 1, 0)');
                $stmt->execute([$name, SPECIAL_LIQUIDITY_USER_EMAIL, $phone, $hash]);
                $userId = (int)$pdo->lastInsertId();
            }
            save_special_liquidity_assets($pdo, $userId, [
                'bitcoin' => $bitcoin,
                'nft' => $nft,
                'brl' => $brl,
                'quotas' => $quotas
            ]);
            set_special_liquidity_user($pdo, $userId);
            $pdo->commit();
            $message = '✅ Usuário especial configurado com sucesso!';
            $stmt = $pdo->prepare('SELECT id, name, phone FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([SPECIAL_LIQUIDITY_USER_EMAIL]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $pdo->rollBack();
            $message = '❌ Erro ao salvar dados: ' . $e->getMessage();
        }
    } else {
        $message = '❌ Informe nome, telefone e senha.';
    }
}

$assets = null;
if ($current) {
    $assets = get_special_liquidity_assets($pdo, (int)$current['id']);
}
?>
<!doctype html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <title>Usuário especial da piscina de liquidez</title>
    <style>
        body { font-family: Arial, sans-serif; background:#0f172a; color:#f8fafc; padding:24px; }
        form { background:#1f2937; padding:20px; border-radius:10px; max-width:420px; }
        label { display:block; margin-bottom:12px; }
        input { width:100%; padding:8px; border-radius:6px; border:1px solid #334155; margin-top:4px; }
        button { padding:10px 14px; border:0; border-radius:8px; background:#10b981; color:#041f15; font-weight:600; cursor:pointer; }
        .message { margin-bottom:16px; font-weight:600; }
        .hint { font-size:0.9rem; color:#94a3b8; }
    </style>
</head>
<body>
    <h1>Configurar usuário especial</h1>
    <p>Conta protegida utilizada para autorizar ações nos ativos da piscina de liquidez.</p>
    <p><strong>Email fixo:</strong> <?php echo htmlspecialchars(SPECIAL_LIQUIDITY_USER_EMAIL, ENT_QUOTES, 'UTF-8'); ?></p>
    <?php if ($message): ?><div class="message"><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></div><?php endif; ?>
    <form method="post">
        <label>Nome completo
            <input type="text" name="name" value="<?php echo htmlspecialchars($current['name'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" required>
        </label>
        <label>Telefone de contato
            <input type="tel" name="phone" value="<?php echo htmlspecialchars($current['phone'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" required>
        </label>
        <label>Senha de acesso
            <input type="password" name="password" placeholder="Defina ou atualize a senha" required>
        </label>
        <fieldset style="border:1px solid #334155; padding:12px; border-radius:8px; margin-bottom:16px;">
            <legend>Ativos iniciais</legend>
            <label>Bitcoin (BTC)
                <input type="number" step="0.00000001" name="bitcoin" value="<?php echo htmlspecialchars($assets['bitcoin'] ?? 0, ENT_QUOTES, 'UTF-8'); ?>">
            </label>
            <label>NFTs
                <input type="number" step="1" min="0" name="nft" value="<?php echo htmlspecialchars($assets['nft'] ?? 0, ENT_QUOTES, 'UTF-8'); ?>">
            </label>
            <label>Saldo em R$
                <input type="number" step="0.01" name="brl" value="<?php echo htmlspecialchars($assets['brl'] ?? 0, ENT_QUOTES, 'UTF-8'); ?>">
            </label>
            <label>Cotas
                <input type="number" step="0.00000001" name="quotas" value="<?php echo htmlspecialchars($assets['quotas'] ?? 0, ENT_QUOTES, 'UTF-8'); ?>">
            </label>
        </fieldset>
        <button type="submit">Salvar usuário especial</button>
    </form>
    <p class="hint">Após a configuração, guarde esta URL em local seguro e remova o arquivo se não for mais necessário.</p>
</body>
</html>