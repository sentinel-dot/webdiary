<?php
// backend/api/change_password.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include JWT Helper for authentication
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
    $errors = [];
    
    if (!isset($data['current_password']) || empty($data['current_password'])) {
        $errors[] = "Aktuelles Passwort ist erforderlich";
    }
    
    if (!isset($data['new_password']) || empty($data['new_password'])) {
        $errors[] = "Neues Passwort ist erforderlich";
    } elseif (strlen($data['new_password']) < 4) {
        $errors[] = "Neues Passwort muss mindestens 4 Zeichen lang sein";
    } elseif (strlen($data['new_password']) > 255) {
        $errors[] = "Neues Passwort darf maximal 255 Zeichen lang sein";
    }
    
    if (isset($data['current_password']) && isset($data['new_password']) 
        && $data['current_password'] === $data['new_password']) {
        $errors[] = "Neues Passwort muss sich vom aktuellen unterscheiden";
    }
    
    if (!empty($errors)) {
        sendResponse(false, null, implode(". ", $errors), 400);
    }
    
    return true;
}

try {
    // Get and validate JWT token
    $token = JWTHelper::getTokenFromHeaders();
    if (!$token) {
        sendResponse(false, null, "Kein Authentifizierungstoken gefunden", 401);
    }

    $decodedToken = JWTHelper::decode($token);
    if (!$decodedToken) {
        sendResponse(false, null, "Ungültiger oder abgelaufener Token", 401);
    }

    $userId = $decodedToken['user_id'];
    $username = $decodedToken['username'];

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
    
    $currentPassword = $data['current_password'];
    $newPassword = $data['new_password'];

    // Get current user data
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE id = :id");
    $stmt->execute([":id" => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        sendResponse(false, null, "Benutzer nicht gefunden", 404);
    }

    // Verify current password
    $passwordValid = false;
    if (password_verify($currentPassword, $user["password"])) {
        $passwordValid = true;
    } elseif ($currentPassword === $user["password"]) {
        // Legacy: Plain text password support
        $passwordValid = true;
    }
    
    if (!$passwordValid) {
        // Log failed password change attempt
        error_log("Failed password change attempt for user: $username (ID: $userId)");
        sendResponse(false, null, "Aktuelles Passwort ist falsch", 401);
    }

    // Hash new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    if (!$hashedPassword) {
        sendResponse(false, null, "Fehler beim Verarbeiten des neuen Passworts", 500);
    }

    // Update password in database
    $updateStmt = $conn->prepare("
        UPDATE users 
        SET password = :password, updated_at = NOW() 
        WHERE id = :id
    ");
    
    $result = $updateStmt->execute([
        ":password" => $hashedPassword,
        ":id" => $userId
    ]);
    
    if ($result) {
        // Log successful password change
        error_log("Password changed successfully for user: $username (ID: $userId)");
        
        sendResponse(true, [
            'user_id' => (int)$userId,
            'username' => $username,
            'changed_at' => date('Y-m-d H:i:s')
        ], "Passwort erfolgreich geändert");
    } else {
        sendResponse(false, null, "Fehler beim Aktualisieren des Passworts", 500);
    }
    
} catch (PDOException $e) {
    error_log("Database error in password change: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler", 500);
} catch (Exception $e) {
    error_log("General error in password change: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}
?>