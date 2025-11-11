<?php
require_once __DIR__ . '/db.php';

/**
 * Cria um lançamento de dupla entrada.
 * $legs = [['account_id'=>1,'debit'=>100], ['account_id'=>2,'credit'=>100]]
 * retorna journal_id
 */
function post_journal($ref_type, $ref_id, $memo, $legs) {
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare("INSERT INTO journals(ref_type, ref_id, memo) VALUES(?,?,?)");
    $stmt->execute([$ref_type, $ref_id, $memo]);
    $jid = $pdo->lastInsertId();

    $sumD=0; $sumC=0;
    $stmtE = $pdo->prepare("INSERT INTO entries(journal_id, account_id, debit, credit) VALUES(?,?,?,?)");
    foreach ($legs as $l) {
      $d = $l['debit'] ?? 0; $c = $l['credit'] ?? 0;
      $sumD += $d; $sumC += $c;
      $stmtE->execute([$jid, $l['account_id'], $d, $c]);
    }
    if (bccomp($sumD, $sumC, 8) !== 0) throw new Exception("Unbalanced entry");

    $pdo->commit();
    return $jid;
  } catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['error'=>$e->getMessage()]);
    exit;
  }
}

/** Move um ativo fungível ou NFT entre contas e atualiza positions via trigger */
function move_asset($journal_id, $asset_id, $asset_instance_id, $qty, $from_acc_id, $to_acc_id) {
  $pdo = db();
  $stmt = $pdo->prepare("INSERT INTO asset_moves(journal_id, asset_id, asset_instance_id, qty, from_account_id, to_account_id)
                         VALUES(?,?,?,?,?,?)");
  $stmt->execute([$journal_id, $asset_id, $asset_instance_id, $qty, $from_acc_id, $to_acc_id]);
}
