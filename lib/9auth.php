<?php
session_start();
require_once __DIR__ . '/db.php';
function current_user_id(){ return isset($_SESSION['uid']) ? intval($_SESSION['uid']) : null; }
function require_login(){
  if(!current_user_id()){
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error'=>'not_authenticated']);
    exit;
  }
}