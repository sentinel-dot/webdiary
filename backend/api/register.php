<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

try 
{
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    //echo json_encode(["success" => "Connected successfully"]);
} 
catch(PDOException $e) 
{
    die(json_encode(["error" => "Connection failed: " . $e->getMessage()]));
}

$data = json_decode(file_get_contents("php://input"), true);

if(isset($data['username']) && isset($data['password']))
{
    $username = $data['username'];
    $password = $data['password'];
    //$password = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (:username, :password, 'viewer-user')");
    //$stmt->execute([":username" => $username], [":password" => $password]);

    if ($stmt->execute([":username" => $username, ":password" => $password]))
    {
        echo json_encode(["success" => true]);
    }
    else
    {
        echo json_encode(["error" => "Error: " . $stmt->error]);
    }
}
else
{
    echo json_encode(["error" => "Invalid Input"]);
}
?>