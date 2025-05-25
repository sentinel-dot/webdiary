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
    Status_Datum DATETIME,
    installed_version VARCHAR(50),
    Inst_Zielversion VARCHAR(50),
    OZ VARCHAR(50),
    Monitor_LoggedOn_User VARCHAR(50),
    Monitor_Datum DATETIME,
    Monitor_ZORA_Checkpoint BOOLEAN DEFAULT FALSE,
    Build_Key VARCHAR(100),
    ZORA_Version VARCHAR(50),
    FE_ZORA_Version VARCHAR(50),
    Z_Umgebung_Soll VARCHAR(50),
    Z_Umgebung_Inventar VARCHAR(50),
    Chipkarten_Nr VARCHAR(50),
    Chipkarten_PIN VARCHAR(50),
    PLZ_Ort VARCHAR(100),
    Raum_Cube VARCHAR(50),
    Bemerkung_FE TEXT,
    Filialschluessel VARCHAR(50),
    Kassenschluessel VARCHAR(50),
    Masterkasse VARCHAR(50),
    FE_Kennung VARCHAR(50),
    Riposte_GroupID VARCHAR(50),
    Riposte_NodeID VARCHAR(50),
    Aussenstellennummer VARCHAR(50),
    Weitere_Chipkarten TEXT,
    MGS_Paket_ZORA_R VARCHAR(100),
    FE_LoggedOn_User VARCHAR(100),
    Cryptostore_Status VARCHAR(50),
    Hardwareausstattung TEXT,
    DBEPOS_Version VARCHAR(50),
    
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
INSERT INTO computers (
    name, ip_address, status, status_note, Status_Datum, installed_version, Inst_Zielversion, OZ, Monitor_LoggedOn_User, Monitor_Datum, Monitor_ZORA_Checkpoint, Build_Key, ZORA_Version, FE_ZORA_Version, Z_Umgebung_Soll, Z_Umgebung_Inventar, Chipkarten_Nr, Chipkarten_PIN, PLZ_Ort, Raum_Cube, Bemerkung_FE, Filialschluessel, Kassenschluessel, Masterkasse, FE_Kennung, Riposte_GroupID, Riposte_NodeID, Aussenstellennummer, Weitere_Chipkarten, MGS_Paket_ZORA_R, FE_LoggedOn_User, Cryptostore_Status, Hardwareausstattung, DBEPOS_Version
) VALUES
('X90010000226', '10.176.48.18', 'Installation/Wartung', 'Installiert und konfiguriert', '2024-05-10 14:30:00', 'X979-1.0878910', 'X979-1.0878910', 1045, 'adm_schmidt', '2024-05-12 08:15:22', true, 'BUILD-X979-R20240510-01', '2.14.5', '2.14.5', 'Produktion', 'Prod_Env1', 'C4556781', '1234', '70565 Stuttgart', 'R245-B', 'NHW Testgerät für HW-Team', 'FS12345', 'K001', 'Ja', 'FE-ST-001', 'GROUP_TEST1', 'NODE_001', 'AST-001', 'C4556782, C4556783', 'MGS-Z-1.0.45', 'user_meier', 'Active', 'Intel Core i7-10700K, 16GB RAM, 512GB SSD, Windows 10 Enterprise', '3.14.159'),

('X90010000224', '10.176.18.135', 'Reserviert', 'Reserviert für neue Hardware-Tests', '2024-05-15 09:45:00', 'X980-1.1976215', 'X980-1.2045891', 1046, 'adm_mueller', '2024-05-16 10:22:33', false, 'BUILD-X980-R20240514-02', '2.15.1', '2.15.0', 'Entwicklung', 'Dev_Env2', 'C9876543', '4321', '70565 Stuttgart', 'R101-A', 'DEV Testgerät für Software-Team', 'FS54321', 'K002', 'Nein', 'FE-ST-002', 'GROUP_DEV1', 'NODE_002', 'AST-002', 'C9876544', 'MGS-Z-1.1.23', 'user_schulz', 'Pending', 'Intel Core i9-11900K, 32GB RAM, 1TB NVMe SSD, Windows 11 Enterprise', '3.15.265'),

('X90010000225', '10.176.18.210', 'Ausser Betrieb', 'Hardware defekt - Mainboard-Austausch nötig', '2024-05-05 11:30:00', 'X979-1.0878910', 'X979-1.0878910', 1047, 'adm_wagner', '2024-05-01 15:45:10', true, 'BUILD-X979-R20240425-03', '2.14.5', '2.14.5', 'Test', 'Test_Env3', 'C5678901', '5678', '70565 Stuttgart', 'R302-C', 'Fehler bei POST, kein Boot möglich', 'FS67890', 'K003', 'Nein', 'FE-ST-003', 'GROUP_TEST2', 'NODE_003', 'AST-003', 'C5678902', 'MGS-Z-1.0.45', 'user_becker', 'Inactive', 'Intel Core i5-9400, 8GB RAM, 256GB SSD, Windows 10 Enterprise', '3.14.159'),

('X90010000223', '10.176.18.223', 'Testbereit', 'Von ***Reserviert*** auf ***Testbereit*** geändert am 2024-05-18', '2024-05-18 16:20:00', 'X978-1.0677980', 'X978-1.0677980', 1048, 'adm_fischer', '2024-05-18 16:25:45', true, 'BUILD-X978-R20240501-01', '2.13.9', '2.13.9', 'Produktion', 'Prod_Env1', 'C1234567', '9876', '70565 Stuttgart', 'R150-D', 'Standard Testgerät für reguläre Tests', 'FS13579', 'K004', 'Ja', 'FE-ST-004', 'GROUP_TEST3', 'NODE_004', 'AST-004', 'C1234568, C1234569', 'MGS-Z-1.0.50', 'user_hoffmann', 'Active', 'Intel Core i7-10700, 16GB RAM, 512GB SSD, Windows 10 Enterprise', '3.14.200'),

('X90010000227', '10.176.48.17', 'AIS', 'Die NHW AIS Beta wird getestet', '2024-05-20 08:10:00', 'X981-1.7301961', 'X981-1.7301961', 1049, 'adm_weber', '2024-05-20 08:15:30', true, 'BUILD-X981-R20240518-01', '2.16.0', '2.16.0', 'Beta', 'Beta_Env1', 'C2468101', '2468', '70565 Stuttgart', 'R401-E', 'AIS Beta-Testgerät für neue Funktionen', 'FS24680', 'K005', 'Nein', 'FE-ST-005', 'GROUP_BETA1', 'NODE_005', 'AST-005', 'C2468102, C2468103', 'MGS-Z-1.2.10', 'user_schmitt', 'Active', 'Intel Core i9-12900K, 64GB RAM, 2TB NVMe SSD, Windows 11 Enterprise', '3.16.012'),

('X90010000228', '10.176.48.20', 'Testbereit', 'Neu aufgesetzt und konfiguriert', '2024-05-19 14:15:00', 'X980-1.1976215', 'X980-1.1976215', 1050, 'adm_koch', '2024-05-19 14:30:22', true, 'BUILD-X980-R20240514-02', '2.15.1', '2.15.1', 'Produktion', 'Prod_Env2', 'C1357924', '1357', '70565 Stuttgart', 'R220-F', 'High-Performance Testgerät', 'FS13579', 'K006', 'Nein', 'FE-ST-006', 'GROUP_TEST4', 'NODE_006', 'AST-006', 'C1357925', 'MGS-Z-1.1.30', 'user_neumann', 'Active', 'AMD Ryzen 9 5950X, 32GB RAM, 1TB NVMe SSD, Windows 10 Enterprise', '3.15.265'),

('X90010000229', '10.176.48.25', 'Installation/Wartung', 'OS-Update wird eingespielt', '2024-05-21 09:30:00', 'X981-1.7301961', 'X982-1.0123456', 1051, 'adm_krause', '2024-05-21 09:45:15', false, 'BUILD-X982-R20240520-01', '2.16.1', '2.16.0', 'Test', 'Test_Env4', 'C3691472', '3691', '70565 Stuttgart', 'R180-G', 'Update auf neue OS-Version für Kompatibilitätstests', 'FS36914', 'K007', 'Nein', 'FE-ST-007', 'GROUP_UPDATE1', 'NODE_007', 'AST-007', 'C3691473', 'MGS-Z-1.2.15', 'user_schwarz', 'Pending', 'Intel Core i7-11700, 16GB RAM, 1TB SSD, Windows 11 Enterprise', '3.16.100'),

('X90010000230', '10.176.49.30', 'Reserviert', 'Reserviert für Penetration Testing durch Security Team', '2024-05-17 13:20:00', 'X979-1.0878910', 'X979-1.0878910', 1052, 'adm_schneider', '2024-05-17 13:35:40', true, 'BUILD-X979-R20240510-01', '2.14.5', '2.14.5', 'Security', 'Sec_Env1', 'C8024671', '8024', '70565 Stuttgart', 'R255-H', 'Dediziertes Gerät für Security Tests', 'FS80246', 'K008', 'Nein', 'FE-ST-008', 'GROUP_SEC1', 'NODE_008', 'AST-008', 'C8024672', 'MGS-Z-1.0.45', 'user_wolf', 'Active', 'Intel Core i7-10850H, 32GB RAM, 512GB SSD, Windows 10 Enterprise LTSC', '3.14.159'),

('X90010000231', '10.176.49.35', 'Testbereit', 'Bereit für Performance-Tests', '2024-05-16 10:40:00', 'X980-1.1976215', 'X980-1.1976215', 1053, 'adm_zimmermann', '2024-05-16 11:05:18', true, 'BUILD-X980-R20240514-02', '2.15.1', '2.15.1', 'Performance', 'Perf_Env1', 'C9513578', '9513', '70565 Stuttgart', 'R290-I', 'Gerät mit spezieller Monitoring-Software für Performance-Tests', 'FS95135', 'K009', 'Nein', 'FE-ST-009', 'GROUP_PERF1', 'NODE_009', 'AST-009', 'C9513579', 'MGS-Z-1.1.23', 'user_schroeder', 'Active', 'Intel Core i9-12900K, 64GB RAM, 2TB NVMe SSD, Windows 11 Enterprise', '3.15.265'),

('X90010000232', '10.176.49.40', 'AIS', 'AIS Integration mit neuer Hardware', '2024-05-22 11:50:00', 'X981-1.7301961', 'X981-1.7301961', 1054, 'adm_braun', '2024-05-22 12:10:25', true, 'BUILD-X981-R20240518-01', '2.16.0', '2.16.0', 'Integration', 'Int_Env1', 'C7531246', '7531', '70565 Stuttgart', 'R330-J', 'Spezialaufbau für AIS-Hardware-Integration', 'FS75312', 'K010', 'Ja', 'FE-ST-010', 'GROUP_AIS1', 'NODE_010', 'AST-010', 'C7531247, C7531248', 'MGS-Z-1.2.10', 'user_hofmann', 'Active', 'AMD Ryzen 7 5800X, 32GB RAM, 1TB NVMe SSD, Windows 10 Enterprise', '3.16.012');

-- Füge Test-Benutzer hinzu
INSERT INTO users (username, password, role) 
VALUES
('admin', 'admin', 'admin-user'),
('testuser', 'test123', 'privileged-user'),
('viewer', 'view123', 'viewer-user');