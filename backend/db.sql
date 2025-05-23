-- backend/db.sql
-- Einfaches Script zum kompletten Neuaufbau der Datenbank
-- Einfach ausführen mit: docker exec -i webdiary-db mysql -u root -proot webdiary < backend/db.sql

-- Lösche alle bestehenden Tabellen
DROP TABLE IF EXISTS status_changes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS computers;

-- Erstelle computers Tabelle
CREATE TABLE computers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Testbereit', 'Reserviert', 'Ausser Betrieb', 'Installation/Wartung', 'AIS') DEFAULT 'Testbereit',
    status_note TEXT,
    installed_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Erstelle users Tabelle
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin-user', 'privileged-user', 'viewer-user') NOT NULL DEFAULT 'viewer-user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Erstelle status_changes Tabelle für einfaches Logging
CREATE TABLE status_changes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by VARCHAR(50),
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Füge Dummy-Computer hinzu
INSERT INTO computers (name, ip_address, status, status_note, installed_version) 
VALUES
('X90010000226', '10.176.48.18', 'Installation/Wartung', 'Installiert und konfiguriert', 'X979-1.0878910'),
('X90010000224', '10.176.18.135', 'Reserviert', 'Reserviert für neue Hardware', 'X980-1.1976215'),
('X90010000225', '10.176.18.210', 'Ausser Betrieb', 'Defekt', 'X979-1.0878910'),
('X90010000223', '10.176.18.223', 'Testbereit', 'Von ***Reserviert*** auf ***Testbereit***', 'X978-1.0677980'),
('X90010000227', '10.176.48.17', 'AIS', 'Die NHW AIS Beta wird getestet', 'X981-1.7301961');

-- Füge Test-Benutzer hinzu
INSERT INTO users (username, password, role) 
VALUES
('admin', 'admin', 'admin-user'),
('testuser', 'test123', 'privileged-user'),
('viewer', 'view123', 'viewer-user');