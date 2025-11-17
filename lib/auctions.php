<?php
require_once __DIR__ . '/db.php';

function auctions_ensure_profiles_table(PDO $pdo): void {
  static $ensured = false;
  if ($ensured) {
    return;
  }
  $sql = "CREATE TABLE IF NOT EXISTS auction_profiles (
    auction_id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
  $pdo->exec($sql);
  $ensured = true;
}

function auctions_save_profile(PDO $pdo, int $auctionId, string $title, ?string $description, ?string $imageUrl): void {
  auctions_ensure_profiles_table($pdo);
  $stmt = $pdo->prepare(
    "INSERT INTO auction_profiles (auction_id, title, description, image_url)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), image_url = VALUES(image_url)"
  );
  $stmt->execute([
    $auctionId,
    $title,
    $description !== '' ? $description : null,
    $imageUrl !== '' ? $imageUrl : null
  ]);
}

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
