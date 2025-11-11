<?php
require_once __DIR__ . '/db.php';

/** Ensure a standard set of accounts exists for a user. */
function ensure_user_accounts(int $user_id){
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

/** Create a user with hashed password and default accounts. */
function create_user_with_accounts(string $name, string $email, string $password){
  $pdo = db();
  $stmt = $pdo->prepare("INSERT INTO users(name,email,password_hash) VALUES (?,?,?)");
  $stmt->execute([$name,$email,password_hash($password, PASSWORD_BCRYPT)]);
  $uid = intval($pdo->lastInsertId());
  ensure_user_accounts($uid);
  return $uid;
}
