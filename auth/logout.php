<?php
header('Content-Type: application/json');
session_start();
$_SESSION = [];
session_destroy();
echo json_encode(['ok'=>true]);