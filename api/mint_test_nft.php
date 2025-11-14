<?php
// api/mint_test_nft.php — cria rapidamente um NFT de teste no inventário do usuário logado
// Resposta: { ok:true, instance_id: <int>, title: "Obra Demo ..." }

header('Content-Type: application/json');

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/ledger.php';
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/special_liquidity_user.php';

require_login();

$pdo = db();
$uid = current_user_id();

// garante que o usuário tenha as contas padrão (cash BRL, wallet BTC, inventário NFT, etc.)
ensure_user_accounts($uid);

$title = "Obra Demo " . date('YmdHis');

try {
    // === Proteção anti-transação aninhada ===
    $started_tx = !$pdo->inTransaction();   // só inicia se NÃO houver transação ativa
    if ($started_tx) $pdo->beginTransaction();

    // 1) cria o asset "nft"
    $stmt = $pdo->prepare("INSERT INTO assets(type, symbol, metadata_json)
                           VALUES ('nft', NULL, JSON_OBJECT('category','art'))");
    $stmt->execute();
    $asset_id = (int)$pdo->lastInsertId();

    // 2) cria a instância (token) desse asset
    $token_id = 'demo-' . bin2hex(random_bytes(6));
    $stmt = $pdo->prepare("INSERT INTO asset_instances(asset_id, chain, token_id, metadata_json)
                           VALUES (?, ?, ?, JSON_OBJECT('title', ?))");
    $stmt->execute([$asset_id, 'internal', $token_id, $title]);
    $inst_id = (int)$pdo->lastInsertId();

    // 3) registra em 'works' (seu catálogo de obras)
    $stmt = $pdo->prepare("INSERT INTO works(asset_instance_id, title, artist_id, specs_json)
                           VALUES (?, ?, ?, JSON_OBJECT())");
    $stmt->execute([$inst_id, $title, $uid]);

    // 4) move a instância para o inventário NFT do usuário
    $acc = $pdo->prepare("SELECT id FROM accounts
                          WHERE owner_type='user' AND owner_id=? AND purpose='nft_inventory'
                          LIMIT 1");
    $acc->execute([$uid]);
    $inv_id = $acc->fetchColumn();
    if (!$inv_id) {
        throw new Exception('inventory_account_missing');
    }

    // cria um journal "mint" e move a instância (qty=1) para o inventário
    $jid = post_journal('mint', NULL, 'Mint de NFT demo', []);
    $stmt = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                           VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$jid, NULL, $inst_id, 1, NULL, $inv_id]);

    increment_special_liquidity_nft($pdo, $uid, 1);

    if ($started_tx) $pdo->commit();

    echo json_encode([
        'ok' => true,
        'instance_id' => $inst_id,
        'asset_id' => $asset_id,
        'title' => $title,
        'token_id' => $token_id
    ]);
} catch (Exception $e) {
    if (isset($started_tx) && $started_tx && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'error' => 'mint_failed',
        'detail' => $e->getMessage()
    ]);
}
