<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$pdo = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");

$stmt = $pdo->query("SELECT * FROM computers");
$computers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($computers);
?>
