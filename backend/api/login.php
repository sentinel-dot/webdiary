<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");


try {
    // Datenbankverbindung herstellen
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    //echo json_encode(["success" => "Connected successfully"]);
} 
catch (PDOException $e) 
{
    die(json_encode(["error" => "Connection failed: " . $e->getMessage()]));
}

// JSON-Daten aus dem Request lesen
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['username']) && isset($data['password'])) 
{
    $username = $data['username'];
    $password = $data['password'];

    // Sicheres SQL-Statement mit Prepared Statements
    $stmt = $conn->prepare("SELECT password, role FROM users WHERE username = :username");
    $stmt->execute([":username" => $username]);
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    //if ($user && password_verify($password, $user["password"]))
    if($user && $password == $user["password"]) 
    {
        echo json_encode(["success" => true, "role" => $user["role"]]);
    } 
    else 
    {
        echo json_encode(["error" => "Invalid credentials"]);
    }
} 
else 
{
    echo json_encode(["error" => "Invalid Input"]);
}
?>
