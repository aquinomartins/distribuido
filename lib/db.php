<?php
function db() {
  static $pdo = null;
  if ($pdo) return $pdo;

  $host = "localhost";
  $dbname = "oftalmol_distribuido";     // nome exato do banco
  $user = "oftalmol_aquino";       // nome exato do usuário MySQL
  $pass = "#Fend721fine170";    // mesma senha do banco

  $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);
  return $pdo;
}

