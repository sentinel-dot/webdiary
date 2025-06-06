## Project Name
Mein WebDiary

## Description
Eine Webanwendung zur Verwaltung und Steuerung von Testrechnern. Benutzer können sich einloggen und eine Übersicht aller Rechner sehen. Benutzer können den Status der Rechner ändern und Skripte auf den Rechnern ausführen. Es gibt verschiedene Benutzerrollen mit unterschiedlichen Berechtigungen.

## Technologies
- PHP 8
- TypeScript
- Next.js
- Apache
- Docker mit Linux wo der Apache läuft

## Features
- Übersicht aller Testrechner
- Steuerung der Rechner über eine Weboberfläche
- Ausführung von Skripten auf den Rechnern (lokale Skripte auf Rechnern ausführen mit winexe)
- Unterstützung verschiedener Benutzerrollen (Admin-User, Privileged-User, ReadOnly-User)
- Möglichkeit, mehrere Rechner gleichzeitig zu steuern
- Admin-Benutzer können weitere Rechner oder Benutzer anlegen (Button, der ausgegraut ist, außer für Admin-User)
- Buttons und Dropdowns oben rechts für verschiedene Aktionen
- Die Zeilen sind die einzelnen Rechner
- Die Spalten kommen dann von der Datenbank, aber Name, IP, Status, Status_Bermerkung kommen aufjedenfall
- Wenn Status 'Reserviert' sein soll, dann muss man auch Unter Status Bemerkung setzen für wen es reserviert sein soll

## User Roles
- **Admin-User**: Kann weitere Rechner oder Benutzer anlegen
- **Privileged-User**: Können den Status der Rechner ändern
- **ReadOnly-User**: Können nur lesen




## Important Commands
Im docker-compose.yaml Verzeichnis
Alles Starten:
docker-compose up -d


Alles Stoppen:
docker-compose stop


Killen, falls aufgehängt:
docker-compose kill


Entfernen (DB bleibt aber enthalten, wenn sie im Volume ist):
docker-compose down


Alles löschen ( Inkl. DB-Reset):
docker-compose down -v


## Backend API
http://localhost:8080/api/phpFunction


## Frontend API
http://localhost:3000


