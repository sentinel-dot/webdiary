<?php
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
    if (!isset($data['username']) || !isset($data['password'])) {
        sendResponse(false, null, "Benutzername und Passwort sind erforderlich", 400);
    }
    
    if (strlen($data['username']) < 3) {
        sendResponse(false, null, "Benutzername muss mindestens 3 Zeichen lang sein", 400);
    }
    
    if (strlen($data['password']) < 4) {
        sendResponse(false, null, "Passwort muss mindestens 4 Zeichen lang sein", 400);
    }
    
    return true;
}

try {
    // Datenbankverbindung
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // JSON-Daten lesen
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, null, "Ungültige JSON-Daten", 400);
    }
    
    validateInput($data);
    
    $username = trim($data['username']);
    $password = $data['password'];
    
    // Rate limiting (einfach)
    session_start();
    $attemptKey = 'login_attempts_' . $_SERVER['REMOTE_ADDR'];
    $attempts = $_SESSION[$attemptKey] ?? 0;
    
    if ($attempts >= 5) {
        sendResponse(false, null, "Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.", 429);
    }
    
    // Benutzer aus Datenbank laden
    $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = :username");
    $stmt->execute([":username" => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        $_SESSION[$attemptKey] = $attempts + 1;
        sendResponse(false, null, "Ungültige Anmeldedaten", 401);
    }
    
    // Passwort überprüfen (sowohl gehashed als auch plain text für Migration)
    $passwordValid = false;
    if (password_verify($password, $user["password"])) {
        $passwordValid = true;
    } elseif ($password === $user["password"]) {
        // Legacy: Plain text Passwort - hash es für die Zukunft
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt = $conn->prepare("UPDATE users SET password = :password WHERE id = :id");
        $updateStmt->execute([":password" => $hashedPassword, ":id" => $user['id']]);
        $passwordValid = true;
    }
    
    if (!$passwordValid) {
        $_SESSION[$attemptKey] = $attempts + 1;
        sendResponse(false, null, "Ungültige Anmeldedaten", 401);
    }
    
    // Erfolgreiche Anmeldung - Reset attempts
    unset($_SESSION[$attemptKey]);
    
    // JWT Token generieren (vereinfacht aber korrekt base64 enkodiert)
    $tokenPayload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60), // 24 Stunden
        'iat' => time()
    ];
    
    // Korrekte Base64-Kodierung des JSON-Strings
    $token = base64_encode(json_encode($tokenPayload));
    
    sendResponse(true, [
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ],
        'token' => $token
    ], "Erfolgreich angemeldet");
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler", 500);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}
?>