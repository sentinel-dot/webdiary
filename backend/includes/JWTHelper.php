<?php
// backend/includes/JWTHelper.php
class JWTHelper {
    private static $secretKey = 'your-secret-key-change-this-in-production-2024!';
    private static $algorithm = 'HS256';

    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secretKey, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function decode($jwt) {
        try {
            if (!$jwt) {
                error_log("JWT decode failed: Token is empty");
                return false;
            }
            
            $parts = explode('.', $jwt);
            if (count($parts) !== 3) {
                error_log("JWT decode failed: Invalid token format (expected 3 parts, got " . count($parts) . ")");
                return false;
            }

            list($base64Header, $base64Payload, $base64Signature) = $parts;

            // Verify signature
            $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secretKey, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            if ($base64Signature !== $base64UrlSignature) {
                error_log("JWT decode failed: Invalid signature");
                return false;
            }

            // Decode payload
            $decodedPayload = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload));
            if (!$decodedPayload) {
                error_log("JWT decode failed: Could not base64 decode payload");
                return false;
            }
            
            $payload = json_decode($decodedPayload, true);
            if (!$payload) {
                error_log("JWT decode failed: Could not JSON decode payload");
                return false;
            }

            // Check expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                error_log("JWT decode failed: Token expired");
                return false;
            }
            
            // Verify required fields - check for both user_id and id for compatibility
            if ((!isset($payload['user_id']) && !isset($payload['id'])) || !isset($payload['username']) || !isset($payload['role'])) {
                error_log("JWT decode failed: Missing required fields in payload");
                return false;
            }

            return $payload;
        } catch (Exception $e) {
            error_log("JWT decode exception: " . $e->getMessage());
            return false;
        }
    }

    public static function validateToken($token) {
        return self::decode($token);
    }

    public static function hasPermission($userRole, $requiredRole) {
        $roleHierarchy = [
            'viewer-user' => 1,
            'privileged-user' => 2,
            'admin-user' => 3
        ];
        
        $userLevel = $roleHierarchy[$userRole] ?? 0;
        $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }

    public static function getTokenFromHeaders() {
        try {
            $headers = getallheaders();
            if (!$headers) {
                // Fallback für Nginx/andere Server
                $headers = [];
                foreach ($_SERVER as $key => $value) {
                    if (substr($key, 0, 5) === 'HTTP_') {
                        $headers[str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))))] = $value;
                    }
                }
            }
            
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            
            if (empty($authHeader)) {
                // No Authorization header found
                return null;
            }
            
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
            
            // Authorization header exists but doesn't match Bearer format
            error_log("Invalid Authorization header format: " . substr($authHeader, 0, 30) . "...");
            return null;
        } catch (Exception $e) {
            error_log("Error getting token from headers: " . $e->getMessage());
            return null;
        }
    }
}