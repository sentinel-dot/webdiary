<?php
// backend/api/register.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function sendResponse($success, $data = null, $message = "", $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => $success,
        "data" => $data,
        "message" => $message,
        "timestamp" => date('c')
    ]);
    exit;
}

function validateInput($data) {
    $errors = [];
    
    if (!isset($data['username']) || empty(trim($data['username']))) {
        $errors[] = "Benutzername ist erforderlich";
    } elseif (strlen(trim($data['username'])) < 3) {
        $errors[] = "Benutzername muss mindestens 3 Zeichen lang sein";
    } elseif (strlen(trim($data['username'])) > 50) {
        $errors[] = "Benutzername darf maximal 50 Zeichen lang sein";
    } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', trim($data['username']))) {
        $errors[] = "Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten";
    }
    
    if (!isset($data['password']) || empty($data['password'])) {
        $errors[] = "Passwort ist erforderlich";
    } elseif (strlen($data['password']) < 4) {
        $errors[] = "Passwort muss mindestens 4 Zeichen lang sein";
    } elseif (strlen($data['password']) > 255) {
        $errors[] = "Passwort darf maximal 255 Zeichen lang sein";
    }
    
    // Optional: Password strength validation
    if (isset($data['password']) && strlen($data['password']) >= 4) {
        $password = $data['password'];
        $strength = 0;
        
        if (preg_match('/[a-z]/', $password)) $strength++;
        if (preg_match('/[A-Z]/', $password)) $strength++;
        if (preg_match('/[0-9]/', $password)) $strength++;
        if (preg_match('/[^A-Za-z0-9]/', $password)) $strength++;
        
        if (strlen($password) >= 8) $strength++;
        
        // We won't enforce strong passwords for internal system, just log warning
        if ($strength < 2) {
            error_log("Weak password registered for user: " . trim($data['username']));
        }
    }
    
    if (!empty($errors)) {
        sendResponse(false, null, implode(". ", $errors), 400);
    }
    
    return true;
}

function checkUsernameExists($conn, $username) {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = :username");
    $stmt->execute([":username" => $username]);
    return $stmt->fetchColumn() > 0;
}

try {
    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Read and validate JSON input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, null, "Ungültige JSON-Daten", 400);
    }
    
    validateInput($data);
    
    $username = trim($data['username']);
    $password = $data['password'];
    
    // Check if username already exists
    if (checkUsernameExists($conn, $username)) {
        sendResponse(false, null, "Benutzername bereits vergeben", 409);
    }
    
    // Hash password securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    if (!$hashedPassword) {
        sendResponse(false, null, "Fehler beim Verarbeiten des Passworts", 500);
    }
    
    // Insert new user
    $stmt = $conn->prepare("
        INSERT INTO users (username, password, role, created_at) 
        VALUES (:username, :password, 'viewer-user', NOW())
    ");
    
    $result = $stmt->execute([
        ":username" => $username,
        ":password" => $hashedPassword
    ]);
    
    if ($result) {
        $userId = $conn->lastInsertId();
        
        // Log successful registration
        error_log("New user registered: $username (ID: $userId)");
        
        sendResponse(true, [
            'user_id' => (int)$userId,
            'username' => $username,
            'role' => 'viewer-user'
        ], "Benutzer erfolgreich registriert");
    } else {
        sendResponse(false, null, "Fehler beim Erstellen des Benutzers", 500);
    }
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Duplicate entry
        sendResponse(false, null, "Benutzername bereits vergeben", 409);
    } else {
        error_log("Database error in registration: " . $e->getMessage());
        sendResponse(false, null, "Datenbankfehler", 500);
    }
} catch (Exception $e) {
    error_log("General error in registration: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}