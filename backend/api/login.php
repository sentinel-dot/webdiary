<?php
// backend/api/login.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/JWTHelper.php';

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
    
    if (strlen(trim($data['username'])) < 3) {
        sendResponse(false, null, "Benutzername muss mindestens 3 Zeichen lang sein", 400);
    }
    
    if (strlen($data['password']) < 4) {
        sendResponse(false, null, "Passwort muss mindestens 4 Zeichen lang sein", 400);
    }
    
    return true;
}

function initializeRateLimit() {
    session_start();
    $attemptKey = 'login_attempts_' . $_SERVER['REMOTE_ADDR'];
    $timeKey = 'last_attempt_' . $_SERVER['REMOTE_ADDR'];
    
    $attempts = $_SESSION[$attemptKey] ?? 0;
    $lastAttempt = $_SESSION[$timeKey] ?? 0;
    
    // Reset counter after 15 minutes
    if (time() - $lastAttempt > 900) {
        $_SESSION[$attemptKey] = 0;
        $attempts = 0;
    }
    
    if ($attempts >= 5) {
        $remainingTime = 900 - (time() - $lastAttempt);
        sendResponse(false, null, "Zu viele Anmeldeversuche. Bitte warten Sie " . ceil($remainingTime / 60) . " Minuten.", 429);
    }
    
    return [$attemptKey, $timeKey];
}

function recordFailedAttempt($attemptKey, $timeKey) {
    $_SESSION[$attemptKey] = ($_SESSION[$attemptKey] ?? 0) + 1;
    $_SESSION[$timeKey] = time();
}

function clearFailedAttempts($attemptKey, $timeKey) {
    unset($_SESSION[$attemptKey]);
    unset($_SESSION[$timeKey]);
}

try {
    // Initialize rate limiting
    list($attemptKey, $timeKey) = initializeRateLimit();
    
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
    
    // Load user from database
    $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = :username");
    $stmt->execute([":username" => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        recordFailedAttempt($attemptKey, $timeKey);
        sendResponse(false, null, "Ungültige Anmeldedaten", 401);
    }
    
    // Verify password (both hashed and plain text for migration)
    $passwordValid = false;
    
    if (password_verify($password, $user["password"])) {
        // Password is already hashed
        $passwordValid = true;
    } elseif ($password === $user["password"]) {
        // Legacy plain text password - hash it for future use
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt = $conn->prepare("UPDATE users SET password = :password WHERE id = :id");
        $updateStmt->execute([":password" => $hashedPassword, ":id" => $user['id']]);
        $passwordValid = true;
    }
    
    if (!$passwordValid) {
        recordFailedAttempt($attemptKey, $timeKey);
        sendResponse(false, null, "Ungültige Anmeldedaten", 401);
    }
    
    // Successful login - clear failed attempts
    clearFailedAttempts($attemptKey, $timeKey);
    
    // Update last login timestamp
    $updateLoginStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
    $updateLoginStmt->execute([":id" => $user['id']]);
    
    // Generate JWT token
    $tokenPayload = [
        'user_id' => (int)$user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60), // 24 hours
        'iss' => 'webdiary-system',
        'aud' => 'webdiary-users'
    ];
    
    $token = JWTHelper::encode($tokenPayload);
    
    sendResponse(true, [
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ],
        'token' => $token,
        'expires_in' => 24 * 60 * 60, // seconds
        'token_type' => 'Bearer'
    ], "Erfolgreich angemeldet");
    
} catch (PDOException $e) {
    error_log("Database error in login: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler", 500);
} catch (Exception $e) {
    error_log("General error in login: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}