<?php
header('Content-Type: application/json');
session_start();
echo json_encode(['logged'=>isset($_SESSION['uid']), 'user_id'=>isset($_SESSION['uid'])?intval($_SESSION['uid']):null]);