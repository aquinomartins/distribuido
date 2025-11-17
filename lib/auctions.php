<?php
require_once __DIR__ . '/db.php';

function auctions_sync_statuses(PDO $pdo) {
  $pdo->exec("UPDATE auctions SET status='running' WHERE status='draft' AND starts_at <= NOW()");
  $pdo->exec("UPDATE auctions SET status='ended' WHERE status='running' AND ends_at <= NOW()");
}

function auctions_min_increment() {
  return 0.01;
}

function auctions_next_minimum_bid($reservePrice, $currentBid) {
  $reserve = max(0, (float)$reservePrice);
  $current = max(0, (float)$currentBid);
  $base = max($reserve, $current);
  $increment = auctions_min_increment();
  if ($base <= 0) {
    return round($increment, 2);
  }
  return round($base + $increment, 2);
}
