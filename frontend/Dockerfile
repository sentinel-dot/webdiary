FROM node:20

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere nur die notwendigen Dateien für den npm install
COPY package.json package-lock.json ./

# Installiere die Abhängigkeiten mit npm statt yarn
RUN npm install

# Kopiere den gesamten Code ins Image
COPY . .

# Port 3000 für Next.js freigeben
EXPOSE 3000

# Starte die Anwendung mit npm
CMD ["npm", "run", "dev"]
