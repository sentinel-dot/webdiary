-- Bei jedem Start des Containers ausführen:
-- docker exec -i webdiary-db mysql -u root -proot webdiary < backend/db.sql
-- Bzw. wenn ich die Struktur verändere
-- Die DB benutzen: docker exec -it webdiary-db mysql -u root -proot
CREATE TABLE IF NOT EXISTS computers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Testbereit', 'Reserviert', 'Ausser Betrieb', 'Wartung', 'AIS') DEFAULT 'Testbereit',
    status_note TEXT,
    installed_version VARCHAR(50)
);

-- Füge Dummy-Daten hinzu, wenn die Tabelle gerade erstellt wurde

INSERT INTO computers (name, ip_address, status, status_note, installed_version) 
VALUES

('X90010000226', '10.176.48.18', 'Wartung', 'Installiert und konfiguriert', 'X979-1.0878910'),
('X90010000224', '10.176.18.135', 'Reserviert', 'Reserviert für neue Hardware', 'X980-1.1976215'),
('X90010000225', '10.176.18.210', 'Ausser Betrieb', 'Defekt', 'X979-1.0878910'),
('X90010000223', '10.176.18.223', 'Testbereit', 'Von ***Reserviert*** auf ***Testbereit***', 'X978-1.0677980'),
('X90010000227', '10.176.48.17', 'AIS', 'Die NHW AIS Beta wird getestet', 'X981-1.7301961');

-- Erstelle eine Tabelle für Benutzer
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin-user', 'privileged-user', 'viewer-user') NOT NULL
);

-- Füge den sys-admin Benutzer hinzu
INSERT INTO users (username, password, role) 
VALUES
('admin', 'admin', 'admin-user');
