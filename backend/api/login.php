<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); # Unsicher, jeder darf auf die Daten zugreifen

$pdo = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'];
$password = $data-['password'];

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if($user && password_verify($password, $user['password'])) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}
?>