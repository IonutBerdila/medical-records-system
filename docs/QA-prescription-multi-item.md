# QA: Prescripții multi-item

După implementare, verificați:

1. **Doctor poate crea o prescripție cu 3 medicamente**
   - Pacient → Doctor cu acces → tab Prescripții → Creează prescripție.
   - Completați Diagnostic (opțional), Valabil până la, Status (Draft/Activ), Note generale.
   - Adăugați 3 medicamente (buton „+ Adaugă medicament”), completați cel puțin „Medicament” pentru fiecare.
   - Salvează ca draft sau Emite prescripția. Verificați că apare în listă cu cele 3 linii.

2. **Token farmacie afișează această prescripție**
   - Pacient generează token (Acces și partajare → Token pentru farmacie).
   - Farmacie → introduce tokenul → Verifică token.
   - Titlu: „Prescripții active pentru eliberare”. Trebuie să apară prescripția cu cele 3 itemuri, fiecare cu checkbox (În așteptare).

3. **Farmacie eliberează 2 itemuri; la reîmprospătare rămâne doar unul în așteptare**
   - Bifați 2 medicamente → Confirmă eliberarea.
   - Toast: „Medicamentele selectate au fost eliberate cu succes.”
   - Lista se actualizează: 2 itemuri arată „Eliberat” (cu data și farmacia), 1 rămâne cu checkbox.

4. **Altă farmacie cu token nou poate elibera ultimul item**
   - Pacient generează un nou token (primul e consumat).
   - A doua farmacie introduce noul token → vede aceeași prescripție cu 2 itemuri deja eliberate (read-only) și 1 în așteptare.
   - Bifează ultimul → Confirmă eliberarea. Prescripția dispare din listă (toate itemurile eliberate → Completed).

5. **Prescripții completate nu apar la token**
   - După pasul 4, un al treilea token nu mai arată această prescripție (sau mesaj „Nu există prescripții cu medicamente în așteptare”).

6. **Itemuri deja eliberate sunt vizibile dar blocate, cu audit**
   - În lista farmaciei, itemurile cu status „Eliberat” au checkbox dezactivat și text: „Eliberat la data de … de farmacia …”.
