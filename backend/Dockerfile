# filepath: /Users/x/coding/webdiary/webdiary/backend/Dockerfile
FROM php:8.2-apache

# Installiere die notwendigen PHP-Erweiterungen
RUN docker-php-ext-install pdo pdo_mysql

# Kopiere den Inhalt des Verzeichnisses in das Arbeitsverzeichnis des Containers
COPY . /var/www/html/

# Setze die Umgebungsvariablen für Apache
ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data