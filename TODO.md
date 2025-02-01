##TODO

- user login(sys-admin user muss halt direkt schon angelegt sein initial in webdiary.user Tabelle)
- 3 user roles
- mit excel liste webdiary anlegen nur admin user aber
- README anpassen wie man was startet und stoppt und auf welche seiten bzw urls man gehen muss


##Gedanken

- aktuell habe ich ja 5 dummy einträge in der datenbank, können wir das ändern

##Ablauf der Seite
- Man muss sich einloggen
- Man hat verschiedene Rolle:
    ->admin-user: neues FE anlegen einzeln oder komplett neu mit Rechnertab.xslx, Status ändern (Button wird gar nicht erst angezeigt, wenn man die entspr. Rolle nicht besitzt), View-Only
    ->privileged-user: Status ändern, View-Only
    ->readonly-user: View-Only
- Direkt Statusseite anzeigen, und je nach dem welche Rolle man hat, werden noch die Buttons angezeigt