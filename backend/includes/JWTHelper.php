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
        if (!$jwt) return false;
        
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        // Verify signature
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secretKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if ($base64Signature !== $base64UrlSignature) {
            return false;
        }

        // Decode payload
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        if (!$payload) return false;

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
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
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
}