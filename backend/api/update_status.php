<?php
// backend/api/update_status.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

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

// For simplicity, we'll allow status updates without authentication in this version
// In a production environment, you would implement proper authentication

try {
    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get and validate input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

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

    // Validate that "Reserviert" requires a note
    if ($newStatus === 'Reserviert' && empty(trim($statusNote))) {
        sendResponse(false, null, "Bei Status 'Reserviert' ist eine Bemerkung erforderlich", 400);
    }

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

            // Prepare status note with history
            $currentTime = date('Y-m-d H:i:s');
            $username = "System"; // In a real implementation, this would come from the authenticated user
            $oldStatus = $computer['status'];
            
            $historyNote = "Von ***$oldStatus*** auf ***$newStatus*** geändert am $currentTime";
            
            if (!empty($statusNote)) {
                $finalNote = $statusNote . " (" . $historyNote . ")";
            } else {
                $finalNote = $historyNote;
            }

            // Update computer
            $updateStmt = $conn->prepare("
                UPDATE computers 
                SET status = :status, status_note = :status_note 
                WHERE id = :id
            ");
            
            $updateStmt->execute([
                ':status' => $newStatus,
                ':status_note' => $finalNote,
                ':id' => $computerId
            ]);

            $updatedComputers[] = [
                'id' => $computerId,
                'name' => $computer['name'],
                'status' => $newStatus,
                'status_note' => $finalNote
            ];
        } catch (Exception $e) {
            $errors[] = "Fehler bei Computer ID $computerId: " . $e->getMessage();
        }
    }

    // If there were any errors, rollback and report
    if (!empty($errors)) {
        $conn->rollBack();
        sendResponse(false, ['errors' => $errors], "Es sind Fehler aufgetreten", 400);
    }

    // Otherwise commit the transaction and return success
    $conn->commit();
    sendResponse(true, [
        'updated_computers' => $updatedComputers,
        'count' => count($updatedComputers)
    ], "Status erfolgreich aktualisiert");

} catch (PDOException $e) {
    // Rollback transaction on database error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("Database error: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler: " . $e->getMessage(), 500);
} catch (Exception $e) {
    // Rollback transaction on general error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("General error: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler: " . $e->getMessage(), 500);
}
?>