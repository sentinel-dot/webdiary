<?php
// backend/api/system_reboot.php
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

function executeReboot($ipAddress, $computerName) {
    // Hier würde die tatsächliche Reboot-Logik stehen
    // Zum Beispiel mit winexe oder ssh
    
    // Simulation für Demo
    $success = (rand(1, 10) > 2); // 80% success rate
    
    if ($success) {
        return ['success' => true, 'message' => "Reboot erfolgreich eingeleitet"];
    } else {
        return ['success' => false, 'message' => "Reboot fehlgeschlagen - Computer nicht erreichbar"];
    }
}

try {
    // Authenticate request
    $token = JWTHelper::getTokenFromHeaders();
    $tokenData = JWTHelper::validateToken($token);
    
    if (!$tokenData) {
        sendResponse(false, null, "Ungültiger oder abgelaufener Token", 401);
    }
    
    // Check permissions
    if (!JWTHelper::hasPermission($tokenData['role'], 'privileged-user')) {
        sendResponse(false, null, "Keine Berechtigung für diese Aktion", 403);
    }

    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['computer_ids'])) {
        sendResponse(false, null, "Ungültige Eingabedaten", 400);
    }

    $computerIds = $data['computer_ids'];

    if (!is_array($computerIds) || empty($computerIds)) {
        sendResponse(false, null, "Mindestens ein Computer muss ausgewählt werden", 400);
    }

    $rebootResults = [];
    $successCount = 0;
    $failCount = 0;

    foreach ($computerIds as $computerId) {
        try {
            // Get computer data
            $stmt = $conn->prepare("SELECT name, ip_address FROM computers WHERE id = :id");
            $stmt->execute([':id' => $computerId]);
            $computer = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$computer) {
                $rebootResults[] = [
                    'computer_id' => $computerId,
                    'success' => false,
                    'message' => "Computer nicht gefunden"
                ];
                $failCount++;
                continue;
            }

            // Log action start
            $logStmt = $conn->prepare("
                INSERT INTO system_actions 
                (computer_id, action_type, initiated_by, status, initiated_at)
                VALUES (:computer_id, 'reboot', :initiated_by, 'pending', NOW())
            ");
            
            $logStmt->execute([
                ':computer_id' => $computerId,
                ':initiated_by' => $tokenData['username']
            ]);
            
            $actionId = $conn->lastInsertId();

            // Execute reboot
            $result = executeReboot($computer['ip_address'], $computer['name']);

            // Update action log
            $updateStmt = $conn->prepare("
                UPDATE system_actions 
                SET status = :status, completed_at = NOW(), error_message = :error_message
                WHERE id = :id
            ");
            
            $updateStmt->execute([
                ':status' => $result['success'] ? 'success' : 'failed',
                ':error_message' => $result['success'] ? null : $result['message'],
                ':id' => $actionId
            ]);

            $rebootResults[] = [
                'computer_id' => $computerId,
                'computer_name' => $computer['name'],
                'ip_address' => $computer['ip_address'],
                'success' => $result['success'],
                'message' => $result['message']
            ];

            if ($result['success']) {
                $successCount++;
            } else {
                $failCount++;
            }

        } catch (Exception $e) {
            $rebootResults[] = [
                'computer_id' => $computerId,
                'success' => false,
                'message' => "Fehler: " . $e->getMessage()
            ];
            $failCount++;
        }
    }

    $totalCount = count($computerIds);
    $message = "Reboot abgeschlossen: $successCount erfolgreich, $failCount fehlgeschlagen von $totalCount gesamt";

    sendResponse(true, [
        'results' => $rebootResults,
        'summary' => [
            'total' => $totalCount,
            'success' => $successCount,
            'failed' => $failCount
        ]
    ], $message);

} catch (Exception $e) {
    error_log("Error in system_reboot: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler", 500);
}
?>