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
INSERT INTO computers (name, ip_address, status, status_note, installed_version) VALUES
('PC-101', '192.168.1.101', 'Testbereit', 'Alles in Ordnung', '1.0.0'),
('PC-102', '192.168.1.102', 'Reserviert', 'Wartung nötig', '1.1.0'),
('PC-103', '192.168.1.103', 'Ausser Betrieb', 'Defekt', '1.0.0'),
('PC-104', '192.168.1.104', 'Wartung', 'Installiert und konfiguriert', '1.2.0'),
('PC-105', '192.168.1.105', 'AIS', 'Für interne Zwecke', '1.0.0');

