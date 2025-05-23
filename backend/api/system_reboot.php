<?php
// backend/api/system_reboot.php
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

// For simplicity, we'll allow reboot operations without authentication in this version
// In a production environment, you would implement proper authentication

try {
    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get and validate input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data || !isset($data['computer_ids'])) {
        sendResponse(false, null, "Ungültige Eingabedaten", 400);
    }

    $computerIds = $data['computer_ids'];

    // Validate computer IDs
    if (!is_array($computerIds) || empty($computerIds)) {
        sendResponse(false, null, "Mindestens ein Computer muss ausgewählt werden", 400);
    }

    // Begin transaction
    $conn->beginTransaction();

    $rebootedComputers = [];
    $errors = [];

    foreach ($computerIds as $computerId) {
        try {
            // Get current computer data
            $stmt = $conn->prepare("SELECT name, ip_address, status_note FROM computers WHERE id = :id");
            $stmt->execute([':id' => $computerId]);
            $computer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$computer) {
                $errors[] = "Computer mit ID $computerId nicht gefunden";
                continue;
            }

            // In a real implementation, here you would actually send a reboot command to the computer
            // using something like SSH, WinRM, or another remote management protocol
            // For this demo, we'll just log it in the status_note
            
            $currentTime = date('Y-m-d H:i:s');
            $username = "System"; // In a real implementation, this would come from the authenticated user
            
            $rebootNote = "Systemreboot eingeleitet am $currentTime";
            
            // Append to existing status note
            $statusNote = $computer['status_note'] ? $computer['status_note'] . " | " . $rebootNote : $rebootNote;

            // Update computer status note to reflect the reboot command
            $updateStmt = $conn->prepare("
                UPDATE computers 
                SET status_note = :status_note 
                WHERE id = :id
            ");
            
            $updateStmt->execute([
                ':status_note' => $statusNote,
                ':id' => $computerId
            ]);

            // Log a mock reboot command that would be executed in a real system
            $ipAddress = $computer['ip_address'];
            $rebootCommand = "ssh admin@$ipAddress 'sudo reboot'"; // Example command
            error_log("Would execute: $rebootCommand");

            $rebootedComputers[] = [
                'id' => $computerId,
                'name' => $computer['name'],
                'ip_address' => $ipAddress,
                'status_note' => $statusNote
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
        'rebooted_computers' => $rebootedComputers,
        'count' => count($rebootedComputers)
    ], "Systemreboot erfolgreich eingeleitet");

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