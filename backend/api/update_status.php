<?php
// backend/api/update_status.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

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

function authenticateRequest() {
    $token = JWTHelper::getTokenFromHeaders();
    
    if (!$token) {
        sendResponse(false, null, "Token fehlt", 401);
    }
    
    $tokenData = JWTHelper::validateToken($token);
    if (!$tokenData) {
        sendResponse(false, null, "Ungültiger oder abgelaufener Token", 401);
    }
    
    return $tokenData;
}

function validateInput($data) {
    if (!$data || !isset($data['computer_ids']) || !isset($data['status'])) {
        sendResponse(false, null, "Ungültige Eingabedaten", 400);
    }

    $computerIds = $data['computer_ids'];
    $newStatus = $data['status'];
    $statusNote = $data['status_note'] ?? '';

    // Validate status
    $validStatuses = ['Testbereit', 'Reserviert', 'Ausser Betrieb', 'Installation/Wartung', 'AIS'];
    if (!in_array($newStatus, $validStatuses)) {
        sendResponse(false, null, "Ungültiger Status", 400);
    }

    // Validate computer IDs
    if (!is_array($computerIds) || empty($computerIds)) {
        sendResponse(false, null, "Mindestens ein Computer muss ausgewählt werden", 400);
    }

    foreach ($computerIds as $id) {
        if (!is_numeric($id) || $id <= 0) {
            sendResponse(false, null, "Ungültige Computer-ID", 400);
        }
    }

    // Validate that "Reserviert" requires a note
    if ($newStatus === 'Reserviert' && empty(trim($statusNote))) {
        sendResponse(false, null, "Bei Status 'Reserviert' ist eine Bemerkung erforderlich", 400);
    }

    return [$computerIds, $newStatus, $statusNote];
}

function logStatusChange($conn, $computerId, $oldStatus, $newStatus, $username, $note) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO status_changes 
            (computer_id, old_status, new_status, changed_by, change_note, changed_at) 
            VALUES (:computer_id, :old_status, :new_status, :changed_by, :change_note, NOW())
        ");
        
        $stmt->execute([
            ':computer_id' => $computerId,
            ':old_status' => $oldStatus,
            ':new_status' => $newStatus,
            ':changed_by' => $username,
            ':change_note' => $note
        ]);
    } catch (PDOException $e) {
        // Log the error but don't fail the main operation
        error_log("Failed to log status change: " . $e->getMessage());
    }
}

try {
    // Authenticate request
    $tokenData = authenticateRequest();
    
    // Check permissions
    if (!JWTHelper::hasPermission($tokenData['role'], 'privileged-user')) {
        sendResponse(false, null, "Keine Berechtigung für diese Aktion", 403);
    }

    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get and validate input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, null, "Ungültige JSON-Daten", 400);
    }

    list($computerIds, $newStatus, $statusNote) = validateInput($data);

    // Begin transaction
    $conn->beginTransaction();

    $updatedComputers = [];
    $errors = [];

    foreach ($computerIds as $computerId) {
        try {
            // Get current computer data
            $stmt = $conn->prepare("SELECT name, status, status_note FROM computers WHERE id = :id");
            $stmt->execute([':id' => $computerId]);
            $computer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$computer) {
                $errors[] = "Computer mit ID $computerId nicht gefunden";
                continue;
            }

            $oldStatus = $computer['status'];
            
            // Skip if status is already the same
            if ($oldStatus === $newStatus) {
                $errors[] = "Computer {$computer['name']} hat bereits den Status '$newStatus'";
                continue;
            }

            // Prepare status note with history
            $currentTime = date('Y-m-d H:i:s');
            $username = $tokenData['username'];
            
            $historyNote = "Von ***$oldStatus*** auf ***$newStatus*** geändert am $currentTime von $username";
            
            if (!empty($statusNote)) {
                $finalNote = $statusNote . " (" . $historyNote . ")";
            } else {
                $finalNote = $historyNote;
            }

            // Update computer
            $updateStmt = $conn->prepare("
                UPDATE computers 
                SET status = :status, status_note = :status_note, updated_at = NOW()
                WHERE id = :id
            ");
            
            $updateStmt->execute([
                ':status' => $newStatus,
                ':status_note' => $finalNote,
                ':id' => $computerId
            ]);

            // Log the change
            logStatusChange($conn, $computerId, $oldStatus, $newStatus, $username, $statusNote);

            $updatedComputers[] = [
                'id' => $computerId,
                'name' => $computer['name'],
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ];

        } catch (PDOException $e) {
            $errors[] = "Fehler bei Computer ID $computerId: " . $e->getMessage();
        }
    }

    if (empty($updatedComputers) && !empty($errors)) {
        $conn->rollBack();
        sendResponse(false, null, "Keine Computer konnten aktualisiert werden: " . implode(", ", $errors), 400);
    }

    // Commit transaction
    $conn->commit();

    $message = count($updatedComputers) . " Computer erfolgreich aktualisiert";
    if (!empty($errors)) {
        $message .= " (Warnungen: " . implode(", ", $errors) . ")";
    }

    sendResponse(true, [
        'updated_computers' => $updatedComputers,
        'total_updated' => count($updatedComputers),
        'errors' => $errors
    ], $message);

} catch (PDOException $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    error_log("Database error in update_status: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler", 500);
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    error_log("General error in update_status: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}