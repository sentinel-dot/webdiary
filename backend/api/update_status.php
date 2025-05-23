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

function validateToken($token) {
    if (!$token) return false;
    
    try {
        $tokenData = json_decode(base64_decode($token), true);
        if (!$tokenData || $tokenData['exp'] < time()) {
            return false;
        }
        return $tokenData;
    } catch (Exception $e) {
        return false;
    }
}

function hasPermission($userRole, $requiredRole) {
    $roleHierarchy = [
        'viewer-user' => 1,
        'privileged-user' => 2,
        'admin-user' => 3
    ];
    
    $userLevel = $roleHierarchy[$userRole] ?? 0;
    $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
    
    return $userLevel >= $requiredLevel;
}

try {
    // Token validation
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = str_replace('Bearer ', '', $authHeader);
    
    $tokenData = validateToken($token);
    if (!$tokenData) {
        sendResponse(false, null, "Ungültiger oder abgelaufener Token", 401);
    }
    
    // Check permissions
    if (!hasPermission($tokenData['role'], 'privileged-user')) {
        sendResponse(false, null, "Keine Berechtigung für diese Aktion", 403);
    }

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
            $username = $tokenData['username'];
            $oldStatus = $computer['status'];
            
            $historyNote = "Von ***$oldStatus*** auf ***$newStatus*** geändert am $currentTime von $username";
            
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