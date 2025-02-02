##TODO

- mit excel liste webdiary anlegen nur admin user aber button
- buttons mit versch rollen
- ganz links neue spalte mit auswählen wo man mehrere gleichzeitig auswählen, um dann mit den buttons was mit den zu machen
- auf rechnername zeile klicken und zeigt alle infos von diesem rechner
- man darf nur auf die overview seite, wenn man die viewer-only rolle hat


##Gedanken

##Ablauf der Seite
- Man muss sich einloggen
- Man hat verschiedene Rolle:
    ->admin-user: neues FE anlegen einzeln oder komplett neu mit Rechnertab.xslx, Status ändern (Button wird gar nicht erst angezeigt, wenn man die entspr. Rolle nicht besitzt), View-Only
    ->privileged-user: Status ändern, View-Only
    ->readonly-user: View-Only
- Direkt Statusseite anzeigen, und je nach dem welche Rolle man hat, werden noch die Buttons angezeigt



Oben rechts button leiste mit: Status setzen, installierte version ändern, Rechnertab importieren

wenn ich status änder, wähle ich mit dropdown schön aus von den gegebenen stati, und wenn ich einen ausgewählt habe, muss ich auch was als nächstes eingeben was in die status bemerkung dann geht

wenn ich installed version ändern button drücke, kommt ein schönes textfeld wo ich die version eingebe, und danach wird automatisch in status bemerkung geschrieben "installierte version geändert von *zuvor*'* auf *neu*"


ich will oben rechts schön  3 dropdowns namen "TEST", "INFRA", "SYSTEM"
unter "TEST" kommen Buttons "Status ändern" und später noch weitere
unter "INFRA" kommen Buttons "Installierte version ändern", "Rechnertab importieren" und später noch weitere
unter "SYSTEM" kommen Buttons "Systemreboot" und später noch weitere


Die Buttons bleiben irgendwie "nicht erreichbar" bzw sollst du es so darstellen lassen das man es nicht klicken kann wenn man die entsprechende rolle aus der "users" datenbank nicht hat.
"Status ändern" erfordert die rolle privileged-user. "installierte version ändern" erfordert die rolle admin-user. "rechnertab importieren" erfordert die admin-user rolle.
"Systemreboot" erfordert die privileged-user rolle

die genauen funktionen der buttons erweitern wir danach.

zudem müssen wir nach dem login irgendwie die role zwischenspeichern.
