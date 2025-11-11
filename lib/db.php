<?php
function db() {
  static $pdo = null;
  if ($pdo) {
    return $pdo;
  }

  $host = getenv('DB_HOST') ?: 'localhost';
  $dbname = getenv('DB_NAME') ?: 'oftalmol_distribuido';
  $user = getenv('DB_USER') ?: 'oftalmol_aquino';
  $pass = getenv('DB_PASS');

  if ($pass === false) {
    throw new RuntimeException('Database password not configured. Set DB_PASS environment variable.');
  }

  $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);

  return $pdo;
}

