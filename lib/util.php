<?php
require_once __DIR__ . '/db.php';

/** Garante contas padrão para o usuário. */
function ensure_user_accounts($user_id){
  $pdo = db();
  $defs = [
    ['BRL','cash'], ['BRL','escrow'], ['BTC','bitcoin_wallet'], ['BRL','nft_inventory']
  ];
  $sel = $pdo->prepare("SELECT id FROM accounts WHERE owner_type='user' AND owner_id=? AND currency=? AND purpose=? LIMIT 1");
  $ins = $pdo->prepare("INSERT INTO accounts(owner_type,owner_id,currency,purpose) VALUES('user',?,?,?)");
  foreach($defs as $d){
    [$cur,$pur] = $d;
    $sel->execute([$user_id,$cur,$pur]);
    if(!$sel->fetchColumn()){
      $ins->execute([$user_id,$cur,$pur]);
    }
  }
}

/**
 * Cria um usuário com senha criptografada e garante as contas padrão.
 */
function create_user_with_accounts($name, $email, $password, $phone = null){
  $pdo = db();
  $stmt = $pdo->prepare("INSERT INTO users(name,email,phone,password_hash) VALUES (?,?,?,?)");
  $hash = password_hash($password, PASSWORD_BCRYPT);
  $stmt->execute([$name, $email, $phone, $hash]);
  $uid = intval($pdo->lastInsertId());
  ensure_user_accounts($uid);
  return $uid;
}