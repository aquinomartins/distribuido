<?php
require_once __DIR__ . '/db.php';

const SPECIAL_LIQUIDITY_USER_EMAIL = 'guardiao.liquidez@piscina.local';

const SPECIAL_LIQUIDITY_GUARDIAN_TABLE = 'special_liquidity_guardian';
const SPECIAL_ASSET_ACTION_REQUESTS_TABLE = 'special_asset_action_requests';

function ensure_special_asset_action_requests_table(PDO $pdo): void {
  $sql = sprintf(
    'CREATE TABLE IF NOT EXISTS %s (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      asset VARCHAR(32) NOT NULL,
      action VARCHAR(16) NOT NULL,
      amount DECIMAL(24,8) NOT NULL,
      total_brl DECIMAL(24,8) NULL,
      counterparty_id BIGINT NULL,
      payload_json JSON NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      status ENUM(\'pending\', \'confirmed\', \'executed\', \'cancelled\') NOT NULL DEFAULT \'pending\',
      last_error TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME NULL,
      executed_at DATETIME NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    SPECIAL_ASSET_ACTION_REQUESTS_TABLE
  );
  $pdo->exec($sql);
}

function build_special_asset_confirmation_link(string $token): string {
  $scheme = 'http';
  if (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') {
    $scheme = 'https';
  }
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  return sprintf('%s://%s/api/confirm_special_asset_action.php?token=%s', $scheme, $host, urlencode($token));
}

function create_special_asset_action_request(PDO $pdo, int $userId, array $payload): array {
  ensure_special_asset_action_requests_table($pdo);

  $asset = strtolower((string)($payload['asset'] ?? ''));
  $action = strtolower((string)($payload['action'] ?? ''));
  $amount = $payload['amount'] ?? null;
  $totalBrl = $payload['total_brl'] ?? null;
  $counterpartyId = $payload['counterparty_id'] ?? null;

  $allowedAssets = ['bitcoin', 'nft', 'brl', 'quotas'];
  if (!in_array($asset, $allowedAssets, true)) {
    throw new InvalidArgumentException('Ativo inválido.');
  }

  $allowedActions = ['buy', 'sell', 'deposit'];
  if (!in_array($action, $allowedActions, true)) {
    throw new InvalidArgumentException('Ação inválida.');
  }

  if (!is_numeric($amount)) {
    throw new InvalidArgumentException('Informe uma quantidade válida.');
  }

  $amountValue = (float)$amount;
  if ($amountValue <= 0) {
    throw new InvalidArgumentException('A quantidade deve ser maior que zero.');
  }

  $totalBrlValue = null;
  if ($totalBrl !== null && $totalBrl !== '') {
    if (!is_numeric($totalBrl)) {
      throw new InvalidArgumentException('Valor em reais inválido.');
    }
    $totalBrlValue = (float)$totalBrl;
    if ($totalBrlValue < 0) {
      throw new InvalidArgumentException('O valor em reais deve ser positivo.');
    }
  }

  $counterpartyIdValue = null;
  if ($counterpartyId !== null && $counterpartyId !== '') {
    if (!is_numeric($counterpartyId)) {
      throw new InvalidArgumentException('Usuário selecionado inválido.');
    }
    $counterpartyIdValue = (int)$counterpartyId;
    if ($counterpartyIdValue <= 0) {
      $counterpartyIdValue = null;
    }
  }

  $stmt = $pdo->prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1');
  $stmt->execute([$userId]);
  $userRow = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$userRow || empty($userRow['email'])) {
    throw new RuntimeException('Usuário sem e-mail cadastrado.');
  }

  $token = bin2hex(random_bytes(16));
  $payloadForStorage = [
    'asset' => $asset,
    'action' => $action,
    'amount' => $amountValue,
    'total_brl' => $totalBrlValue,
    'counterparty_id' => $counterpartyIdValue
  ];

  $payloadJson = json_encode($payloadForStorage, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($payloadJson === false) {
    throw new RuntimeException('Falha ao codificar a solicitação.');
  }

  $amountFormatted = number_format($amountValue, 8, '.', '');
  $totalBrlFormatted = $totalBrlValue !== null ? number_format($totalBrlValue, 8, '.', '') : null;

  $insert = $pdo->prepare(sprintf(
    'INSERT INTO %s (user_id, asset, action, amount, total_brl, counterparty_id, payload_json, token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    SPECIAL_ASSET_ACTION_REQUESTS_TABLE
  ));
  $insert->execute([
    $userId,
    $asset,
    $action,
    $amountFormatted,
    $totalBrlFormatted,
    $counterpartyIdValue,
    $payloadJson,
    $token
  ]);

  $requestId = (int)$pdo->lastInsertId();

  $name = $userRow['name'] ?? '';
  $email = $userRow['email'];
  $link = build_special_asset_confirmation_link($token);
  $subject = 'Confirme sua operação de ativos especiais';

  $amountText = number_format($amountValue, 8, ',', '.');
  $lines = [
    'Olá ' . ($name ? $name : 'usuário') . ',',
    '',
    'Recebemos uma solicitação para realizar a seguinte operação com ativos especiais:',
    sprintf('- Ativo: %s', strtoupper($asset)),
    sprintf('- Ação: %s', strtoupper($action)),
    sprintf('- Quantidade: %s', $amountText)
  ];

  if ($totalBrlValue !== null) {
    $lines[] = sprintf('- Total em R$: %s', number_format($totalBrlValue, 2, ',', '.'));
  }
  if ($counterpartyIdValue !== null) {
    $lines[] = sprintf('- Usuário envolvido (ID): %d', $counterpartyIdValue);
  }

  $lines[] = '';
  $lines[] = 'Para confirmar a transação, clique no link abaixo:';
  $lines[] = $link;
  $lines[] = '';
  $lines[] = 'Caso não tenha solicitado, ignore este e-mail.';

  $message = implode("\n", $lines);
  $headers = "Content-Type: text/plain; charset=UTF-8\r\n" .
             "From: no-reply@distribuido.local\r\n";

  $sent = @mail($email, $subject, $message, $headers);
  if (!$sent) {
    update_special_asset_action_request_status($pdo, $requestId, 'cancelled', 'Falha no envio do e-mail de confirmação.');
    throw new RuntimeException('Não foi possível enviar o e-mail de confirmação.');
  }

  return [
    'id' => $requestId,
    'token' => $token,
    'email' => $email
  ];
}

function get_special_asset_action_request(PDO $pdo, string $token): ?array {
  ensure_special_asset_action_requests_table($pdo);
  $stmt = $pdo->prepare(sprintf('SELECT * FROM %s WHERE token = ? LIMIT 1', SPECIAL_ASSET_ACTION_REQUESTS_TABLE));
  $stmt->execute([$token]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row) {
    return null;
  }
  return $row;
}

function update_special_asset_action_request_status(PDO $pdo, int $requestId, string $status, ?string $error = null, bool $touchConfirmedAt = false, bool $setExecutedAt = false, bool $clearConfirmedAt = false): void {
  ensure_special_asset_action_requests_table($pdo);
  $fields = ['status = ?'];
  $params = [$status];
  if ($error !== null) {
    $fields[] = 'last_error = ?';
    $params[] = $error;
  } else {
    $fields[] = 'last_error = NULL';
  }
  if ($touchConfirmedAt) {
    $fields[] = 'confirmed_at = NOW()';
  } elseif ($clearConfirmedAt) {
    $fields[] = 'confirmed_at = NULL';
  }
  if ($setExecutedAt) {
    $fields[] = 'executed_at = NOW()';
  }
  $params[] = $requestId;
  $sql = sprintf('UPDATE %s SET %s WHERE id = ?', SPECIAL_ASSET_ACTION_REQUESTS_TABLE, implode(', ', $fields));
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
}

function ensure_special_liquidity_guardian_table(PDO $pdo): void {
  $sql = sprintf(
    'CREATE TABLE IF NOT EXISTS %s (
      id TINYINT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_special_liquidity_guardian_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
    SPECIAL_LIQUIDITY_GUARDIAN_TABLE
  );
  $pdo->exec($sql);
}

function ensure_special_liquidity_guardian_row(PDO $pdo): ?int {
  ensure_special_liquidity_guardian_table($pdo);
  $stmt = $pdo->prepare(sprintf('SELECT user_id FROM %s WHERE id = 1 LIMIT 1', SPECIAL_LIQUIDITY_GUARDIAN_TABLE));
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row && isset($row['user_id'])) {
    return (int)$row['user_id'];
  }

  // Fallback para o email legado, caso exista.
  $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
  $stmt->execute([SPECIAL_LIQUIDITY_USER_EMAIL]);
  $id = $stmt->fetchColumn();
  if ($id !== false) {
    $userId = (int)$id;
    $up = $pdo->prepare(sprintf('REPLACE INTO %s (id, user_id) VALUES (1, ?)', SPECIAL_LIQUIDITY_GUARDIAN_TABLE));
    $up->execute([$userId]);
    return $userId;
  }

  return null;
}

function special_liquidity_user_id(PDO $pdo): ?int {
  return ensure_special_liquidity_guardian_row($pdo);
}

function special_liquidity_user_email(PDO $pdo): ?string {
  $userId = special_liquidity_user_id($pdo);
  if ($userId === null) {
    return null;
  }
  $stmt = $pdo->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
  $stmt->execute([$userId]);
  $email = $stmt->fetchColumn();
  if ($email === false) {
    return null;
  }
  return (string)$email;
}

function set_special_liquidity_user(PDO $pdo, int $userId): void {
  ensure_special_liquidity_guardian_table($pdo);
  $stmt = $pdo->prepare(sprintf('REPLACE INTO %s (id, user_id) VALUES (1, ?)', SPECIAL_LIQUIDITY_GUARDIAN_TABLE));
  $stmt->execute([$userId]);
  ensure_special_liquidity_row($pdo, $userId);
}

function is_special_liquidity_user(PDO $pdo, $userId): bool {
  $specialId = special_liquidity_user_id($pdo);
  if ($specialId === null) {
    return false;
  }
  return (int)$userId === $specialId;
}

function ensure_special_liquidity_row(PDO $pdo, int $userId): void {
  $stmt = $pdo->prepare('INSERT INTO special_liquidity_assets (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)');
  $stmt->execute([$userId]);
}

function get_special_liquidity_assets(PDO $pdo, int $userId): array {
  ensure_special_liquidity_row($pdo, $userId);
  $stmt = $pdo->prepare('SELECT bitcoin, nft, brl, quotas FROM special_liquidity_assets WHERE user_id = ?');
  $stmt->execute([$userId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$row) {
    return [
      'bitcoin' => 0,
      'nft' => 0,
      'brl' => 0,
      'quotas' => 0
    ];
  }
  return [
    'bitcoin' => isset($row['bitcoin']) ? (float)$row['bitcoin'] : 0,
    'nft' => isset($row['nft']) ? (int)$row['nft'] : 0,
    'brl' => isset($row['brl']) ? (float)$row['brl'] : 0,
    'quotas' => isset($row['quotas']) ? (float)$row['quotas'] : 0
  ];
}

function normalize_special_liquidity_payload($data): array {
  $defaults = [
    'bitcoin' => 0.0,
    'nft' => 0,
    'brl' => 0.0,
    'quotas' => 0.0
  ];
  if (!is_array($data)) {
    return $defaults;
  }
  $normalized = $defaults;
  foreach ($defaults as $key => $defaultValue) {
    if (!array_key_exists($key, $data)) {
      continue;
    }
    $value = $data[$key];
    if ($key === 'nft') {
      $number = is_numeric($value) ? (int)round((float)$value) : 0;
      $normalized[$key] = $number;
      continue;
    }
    $normalized[$key] = is_numeric($value) ? (float)$value : (float)$defaultValue;
  }
  return $normalized;
}

function save_special_liquidity_assets(PDO $pdo, int $userId, array $payload): void {
  $normalized = normalize_special_liquidity_payload($payload);
  ensure_special_liquidity_row($pdo, $userId);
  $stmt = $pdo->prepare(
    'UPDATE special_liquidity_assets SET bitcoin = ?, nft = ?, brl = ?, quotas = ?, updated_at = NOW() WHERE user_id = ?'
  );
  $stmt->execute([
    number_format($normalized['bitcoin'], 8, '.', ''),
    (int)$normalized['nft'],
    number_format($normalized['brl'], 2, '.', ''),
    number_format($normalized['quotas'], 8, '.', ''),
    $userId
  ]);
}

function apply_special_asset_action(PDO $pdo, int $userId, string $asset, string $action, $amount, $totalBrl = null, $counterpartyId = null): array {
  $allowedAssets = ['bitcoin', 'nft', 'brl', 'quotas'];
  if (!in_array($asset, $allowedAssets, true)) {
    throw new InvalidArgumentException('Ativo inválido.');
  }

  $allowedActions = ['buy', 'sell', 'deposit'];
  if (!in_array($action, $allowedActions, true)) {
    throw new InvalidArgumentException('Ação inválida.');
  }

  if (!is_numeric($amount)) {
    throw new InvalidArgumentException('Informe uma quantidade numérica.');
  }

  $qty = (float)$amount;
  if ($asset === 'nft') {
    $qty = (float)round($qty);
  }

  if ($qty <= 0) {
    throw new InvalidArgumentException('A quantidade deve ser maior que zero.');
  }

  $isTrade = $action !== 'deposit';
  if ($isTrade) {
    if (!is_numeric($counterpartyId)) {
      throw new InvalidArgumentException('Selecione um usuário válido para a operação.');
    }
    $counterpartyId = (int)$counterpartyId;
    if ($counterpartyId <= 0) {
      throw new InvalidArgumentException('Selecione um usuário válido para a operação.');
    }
    if ($counterpartyId === $userId) {
      throw new InvalidArgumentException('Não é possível realizar esta operação consigo mesmo.');
    }
  } else {
    $counterpartyId = null;
  }

  $totalValue = null;
  if ($asset !== 'brl' && $action !== 'deposit') {
    if (!is_numeric($totalBrl)) {
      throw new InvalidArgumentException('Informe o valor total em reais para comprar ou vender.');
    }
    $totalValue = (float)$totalBrl;
    if ($totalValue <= 0) {
      throw new InvalidArgumentException('O valor em reais deve ser maior que zero.');
    }
  } elseif (is_numeric($totalBrl)) {
    $totalValue = (float)$totalBrl;
  }

  ensure_special_liquidity_row($pdo, $userId);
  if ($counterpartyId !== null) {
    ensure_special_liquidity_row($pdo, $counterpartyId);
    $userStmt = $pdo->prepare('SELECT id, COALESCE(confirmed, 0) AS confirmed FROM users WHERE id = ? LIMIT 1');
    $userStmt->execute([$counterpartyId]);
    $counterpartyRow = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$counterpartyRow) {
      throw new InvalidArgumentException('Usuário selecionado não foi encontrado.');
    }
    if ((int)$counterpartyRow['confirmed'] !== 1) {
      throw new RuntimeException('O usuário selecionado não está confirmado para operar.');
    }
  }

  $pdo->beginTransaction();
  try {
    $idsToLock = [$userId];
    if ($counterpartyId !== null) {
      $idsToLock[] = $counterpartyId;
    }
    $idsToLock = array_values(array_unique($idsToLock));
    sort($idsToLock);

    $stmt = $pdo->prepare('SELECT bitcoin, nft, brl, quotas FROM special_liquidity_assets WHERE user_id = ? FOR UPDATE');
    $lockedAssets = [];
    foreach ($idsToLock as $id) {
      $stmt->execute([$id]);
      $row = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$row) {
        throw new RuntimeException('Não foi possível carregar os saldos atuais.');
      }
      $lockedAssets[$id] = [
        'bitcoin' => isset($row['bitcoin']) ? (float)$row['bitcoin'] : 0.0,
        'nft' => isset($row['nft']) ? (int)$row['nft'] : 0,
        'brl' => isset($row['brl']) ? (float)$row['brl'] : 0.0,
        'quotas' => isset($row['quotas']) ? (float)$row['quotas'] : 0.0,
      ];
    }

    $userAssets = $lockedAssets[$userId];
    $counterpartyAssets = $counterpartyId !== null ? $lockedAssets[$counterpartyId] : null;

    $userBitcoin = $userAssets['bitcoin'];
    $userNft = (int)$userAssets['nft'];
    $userBrl = $userAssets['brl'];
    $userQuotas = $userAssets['quotas'];

    $counterpartyBitcoin = $counterpartyAssets['bitcoin'] ?? 0.0;
    $counterpartyNft = isset($counterpartyAssets['nft']) ? (int)$counterpartyAssets['nft'] : 0;
    $counterpartyBrl = $counterpartyAssets['brl'] ?? 0.0;
    $counterpartyQuotas = $counterpartyAssets['quotas'] ?? 0.0;

    if ($isTrade && $counterpartyAssets === null) {
      throw new InvalidArgumentException('Usuário selecionado não foi encontrado.');
    }

    if ($isTrade && $asset !== 'brl' && $totalValue !== null) {
      if ($action === 'buy' && $userBrl < $totalValue) {
        throw new RuntimeException('Saldo em reais insuficiente para comprar este ativo.');
      }
      if ($action === 'sell' && $counterpartyBrl < $totalValue) {
        throw new RuntimeException('O usuário selecionado não possui saldo em reais suficiente para esta compra.');
      }
    }

    switch ($asset) {
      case 'bitcoin':
        if ($action === 'sell') {
          if ($userBitcoin < $qty) {
            throw new RuntimeException('Saldo de Bitcoin insuficiente para vender.');
          }
          $userBitcoin -= $qty;
          if ($isTrade) {
            $counterpartyBitcoin += $qty;
            if ($totalValue !== null) {
              $counterpartyBrl -= $totalValue;
            }
          }
          if ($totalValue !== null) {
            $userBrl += $totalValue;
          }
        } elseif ($action === 'buy') {
          if ($counterpartyBitcoin < $qty) {
            throw new RuntimeException('O usuário selecionado não possui quantidade suficiente deste ativo.');
          }
          $counterpartyBitcoin -= $qty;
          $userBitcoin += $qty;
          if ($totalValue !== null) {
            $userBrl -= $totalValue;
            $counterpartyBrl += $totalValue;
          }
        } else {
          $userBitcoin += $qty;
        }
        break;

      case 'nft':
        $qtyInt = (int)round($qty);
        $currentUserNft = max(0, $userNft);
        if ($action === 'sell') {
          if ($currentUserNft < $qtyInt) {
            throw new RuntimeException('Quantidade de NFTs insuficiente para vender.');
          }
          $userNft = $currentUserNft - $qtyInt;
          if ($isTrade) {
            $counterpartyNft += $qtyInt;
            if ($totalValue !== null) {
              $counterpartyBrl -= $totalValue;
            }
          }
          if ($totalValue !== null) {
            $userBrl += $totalValue;
          }
        } elseif ($action === 'buy') {
          if ($counterpartyNft < $qtyInt) {
            throw new RuntimeException('O usuário selecionado não possui quantidade suficiente deste ativo.');
          }
          $counterpartyNft -= $qtyInt;
          $userNft = $currentUserNft + $qtyInt;
          if ($totalValue !== null) {
            $userBrl -= $totalValue;
            $counterpartyBrl += $totalValue;
          }
        } else {
          $userNft = $currentUserNft + $qtyInt;
        }
        break;

      case 'brl':
        if ($action === 'sell') {
          if ($userBrl < $qty) {
            throw new RuntimeException('Saldo em reais insuficiente.');
          }
          $userBrl -= $qty;
          if ($isTrade) {
            $counterpartyBrl += $qty;
          }
        } elseif ($action === 'buy') {
          if ($counterpartyBrl < $qty) {
            throw new RuntimeException('O usuário selecionado não possui saldo em reais suficiente.');
          }
          $userBrl += $qty;
          $counterpartyBrl -= $qty;
        } else {
          $userBrl += $qty;
        }
        break;

      case 'quotas':
        if ($action === 'sell') {
          if ($userQuotas < $qty) {
            throw new RuntimeException('Quantidade de cotas insuficiente para vender.');
          }
          $userQuotas -= $qty;
          if ($isTrade) {
            $counterpartyQuotas += $qty;
            if ($totalValue !== null) {
              $counterpartyBrl -= $totalValue;
            }
          }
          if ($totalValue !== null) {
            $userBrl += $totalValue;
          }
        } elseif ($action === 'buy') {
          if ($counterpartyQuotas < $qty) {
            throw new RuntimeException('O usuário selecionado não possui quantidade suficiente deste ativo.');
          }
          $counterpartyQuotas -= $qty;
          $userQuotas += $qty;
          if ($totalValue !== null) {
            $userBrl -= $totalValue;
            $counterpartyBrl += $totalValue;
          }
        } else {
          $userQuotas += $qty;
        }
        break;
    }

    if ($userBitcoin < 0 || $userNft < 0 || $userBrl < 0 || $userQuotas < 0) {
      throw new RuntimeException('Operação resultou em saldo negativo.');
    }
    if ($counterpartyId !== null) {
      if ($counterpartyBitcoin < 0 || $counterpartyNft < 0 || $counterpartyBrl < 0 || $counterpartyQuotas < 0) {
        throw new RuntimeException('Operação resultou em saldo negativo para o usuário selecionado.');
      }
    }

    $update = $pdo->prepare(
      'UPDATE special_liquidity_assets SET bitcoin = ?, nft = ?, brl = ?, quotas = ?, updated_at = NOW() WHERE user_id = ?'
    );
    $update->execute([
      number_format($userBitcoin, 8, '.', ''),
      (int)$userNft,
      number_format($userBrl, 2, '.', ''),
      number_format($userQuotas, 8, '.', ''),
      $userId
    ]);

    if ($counterpartyId !== null) {
      $update->execute([
        number_format($counterpartyBitcoin, 8, '.', ''),
        (int)$counterpartyNft,
        number_format($counterpartyBrl, 2, '.', ''),
        number_format($counterpartyQuotas, 8, '.', ''),
        $counterpartyId
      ]);
    }

    $pdo->commit();

    return [
      'bitcoin' => $userBitcoin,
      'nft' => $userNft,
      'brl' => $userBrl,
      'quotas' => $userQuotas
    ];
  } catch (Exception $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    throw $e;
  }
}

function sync_special_liquidity_assets_from_game_state(PDO $pdo, array $state): void {
  if (!isset($state['teams']) || !is_array($state['teams'])) {
    return;
  }

  $assetsByUser = [];

  foreach ($state['teams'] as $team) {
    if (!is_array($team)) {
      continue;
    }

    $userId = null;
    if (array_key_exists('userId', $team)) {
      $userId = $team['userId'];
    } elseif (array_key_exists('user_id', $team)) {
      $userId = $team['user_id'];
    }

    $userId = filter_var($userId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null;
    if ($userId === null) {
      continue;
    }

    $assetsByUser[$userId] = [
      'bitcoin' => $team['btc'] ?? ($team['bitcoin'] ?? 0),
      'nft' => $team['nftHand'] ?? ($team['nft'] ?? 0),
      'brl' => $team['cash'] ?? ($team['brl'] ?? 0),
      'quotas' => $team['poolShares'] ?? ($team['quotas'] ?? 0)
    ];
  }

  if (!$assetsByUser) {
    return;
  }

  foreach ($assetsByUser as $userId => $payload) {
    save_special_liquidity_assets($pdo, (int)$userId, $payload);
  }
}