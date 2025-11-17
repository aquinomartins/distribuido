<?php
require_once __DIR__ . '/db.php';

function auctions_timezone(): DateTimeZone {
  static $tz = null;
  if ($tz === null) {
    $tz = new DateTimeZone('UTC');
  }
  return $tz;
}

function auctions_now(): DateTimeImmutable {
  return new DateTimeImmutable('now', auctions_timezone());
}

function auctions_parse_datetime($value): ?DateTimeImmutable {
  if ($value instanceof DateTimeImmutable) {
    return $value->setTimezone(auctions_timezone());
  }
  if (!is_string($value)) {
    return null;
  }
  $raw = trim($value);
  if ($raw === '') {
    return null;
  }
  try {
    $dt = new DateTimeImmutable($raw, auctions_timezone());
    return $dt->setTimezone(auctions_timezone());
  } catch (Exception $e) {
    return null;
  }
}

function auctions_store_datetime(DateTimeImmutable $dt): string {
  return $dt->setTimezone(auctions_timezone())->format('Y-m-d H:i:s');
}

function auctions_format_datetime_for_api($value): ?string {
  $dt = $value instanceof DateTimeImmutable ? $value : auctions_parse_datetime($value);
  if (!$dt) {
    return null;
  }
  return $dt->format(DATE_ATOM);
}

function auctions_sync_statuses(PDO $pdo) {
  $pdo->exec("UPDATE auctions SET status='running' WHERE status='draft' AND starts_at <= UTC_TIMESTAMP()");
  $pdo->exec("UPDATE auctions SET status='ended' WHERE status='running' AND ends_at <= UTC_TIMESTAMP()");
}

function auctions_min_increment() {
  return 0.01;
}

function auctions_next_minimum_bid($reservePrice, $currentBid) {
  $reserve = max(0, (float)$reservePrice);
  $current = max(0, (float)$currentBid);
  $increment = auctions_min_increment();

  if ($current > 0) {
    return round($current + $increment, 2);
  }

  $minimum = max($reserve, $increment);
  return round($minimum, 2);
}
