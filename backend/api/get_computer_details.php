<?php
// backend/api/get_computer_details.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

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

try {
    // Database connection
    $conn = new PDO("mysql:host=webdiary-db;dbname=webdiary", "root", "root");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get computer ID from query parameter
    $computerId = $_GET['id'] ?? null;

    if (!$computerId || !is_numeric($computerId)) {
        sendResponse(false, null, "Ungültige Computer-ID", 400);
    }

    // Get computer basic info
    $stmt = $conn->prepare("
        SELECT id, name, ip_address, status, status_note, installed_version, 
               created_at, updated_at 
        FROM computers 
        WHERE id = :id
    ");
    $stmt->execute([':id' => $computerId]);
    $computer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$computer) {
        sendResponse(false, null, "Computer nicht gefunden", 404);
    }

    // Get status history
    $historyStmt = $conn->prepare("
        SELECT old_status, new_status, changed_by, change_note, changed_at
        FROM status_changes 
        WHERE computer_id = :id 
        ORDER BY changed_at DESC 
        LIMIT 20
    ");
    $historyStmt->execute([':id' => $computerId]);
    $statusHistory = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

    // Mock system information (in a real system, this would come from system monitoring)
    $systemInfo = [
        'os' => 'Windows 10 Enterprise',
        'cpu' => 'Intel Core i7-10700K @ 3.80GHz',
        'ram' => '16 GB DDR4-3200',
        'storage' => '512 GB NVMe SSD',
        'uptime' => '7 Tage, 14 Stunden',
        'last_seen' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 60) . ' minutes')),
        'network_status' => rand(0, 1) ? 'online' : 'offline'
    ];

    // Compile response
    $response = [
        'computer' => $computer,
        'status_history' => $statusHistory,
        'system_info' => $systemInfo,
        'ping_status' => $systemInfo['network_status']
    ];

    sendResponse(true, $response, "Computer-Details erfolgreich geladen");

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    sendResponse(false, null, "Datenbankfehler: " . $e->getMessage(), 500);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    sendResponse(false, null, "Serverfehler: " . $e->getMessage(), 500);
}
?>