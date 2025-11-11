<?php
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_login();
header('Content-Type: application/json');
$user_id = current_user_id();
$pdo = db();
$sql = "
SELECT w.id as work_id, w.title, ai.id as instance_id, a.id as asset_id
FROM works w
JOIN asset_instances ai ON ai.id=w.asset_instance_id
JOIN assets a ON a.id=ai.asset_id
JOIN positions p ON p.asset_id=a.id AND p.owner_type='user' AND p.owner_id=? AND p.qty>0";
$stmt = $pdo->prepare($sql); $stmt->execute([$user_id]);
$obras = $stmt->fetchAll();
$sql2 = "
SELECT c.id, c.size, c.material, c.status
FROM chassis c
JOIN asset_instances ai ON ai.id=c.asset_instance_id
JOIN assets a ON a.id=ai.asset_id
JOIN positions p ON p.asset_id=a.id AND p.owner_type='user' AND p.owner_id=? AND p.qty>0
WHERE c.status='blank'";
$stmt2 = $pdo->prepare($sql2); $stmt2->execute([$user_id]);
$chassis = $stmt2->fetchAll();
echo json_encode(['obras'=>$obras, 'chassis'=>$chassis]);