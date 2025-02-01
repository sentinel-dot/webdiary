-- Bei jedem Start des Containers ausführen: docker exec -i webdiary-db mysql -u root -proot webdiary < backend/db.sql
-- Bzw. wenn ich die Struktur verändere
CREATE TABLE computers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Testbereit', 'Reserviert', 'Ausser Betrieb', 'Wartung', 'AIS') DEFAULT 'Testbereit',
    status_note TEXT,
    installed_version VARCHAR(50)
);

-- Die DB benutzen: docker exec -it webdiary-db mysql -u root -proot
