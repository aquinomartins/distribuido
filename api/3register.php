<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/util.php';

if($_SERVER['REQUEST_METHOD']!=='POST'){ http_response_code(405); echo json_encode(['error'=>'POST only']); exit; }
$body = json_decode(file_get_contents('php://input'), true);
$name = trim($body['name'] ?? '');
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if(!$name || !$email || !$password){ http_response_code(400); echo json_encode(['error'=>'missing_fields']); exit; }

try{
  $uid = create_user_with_accounts($name,$email,$password);
  echo json_encode(['ok'=>true,'user_id'=>$uid]);
}catch(Exception $e){
  http_response_code(400);
  echo json_encode(['error'=>'cannot_create','detail'=>$e->getMessage()]);
}
