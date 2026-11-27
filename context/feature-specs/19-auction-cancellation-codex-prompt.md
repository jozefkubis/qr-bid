# Feature 19 – Auction Cancellation

Ahoj, pokračujeme vo vývoji projektu QRBid.

Feature 18 – Bidder Labels je dokončená, manuálne otestovaná a funkčná. Teraz pripravíme Feature 19 – predčasné zrušenie aukcie s povinným dôvodom.

## 1. Príprava

Komunikuj so mnou po slovensky a riaď sa AGENTS.md.

Najskôr si prečítaj:

1. AGENTS.md
2. context/project-overview.md
3. context/architecture-context.md
4. context/ui-context.md
5. context/code-standards.md
6. context/ai-workflow-rules.md
7. context/progress-tracker.md
8. context/feature-specs/15-auction-finalization-qrbid.md
9. context/feature-specs/18-bidder-labels-qrbid.md

Skontroluj git status a posledné commity. Zachovaj všetky existujúce rozpracované zmeny.

Venuj osobitnú pozornosť schváleným pravidlám END-001, END-002, END-003 a EDIT-001.

## 2. Cieľ Feature 19

Majiteľ aukcie musí mať možnosť predčasne zrušiť aktívnu aukciu aj v prípade, že už obsahuje prijaté ponuky.

Zrušenie aukcie:

- Je nevratná operácia.
- Nevyberá víťaza.
- Nespúšťa proces ponúk jednotlivým kandidátom.
- Zachováva existujúce ponuky a ich históriu.
- Zachováva funkčný verejný odkaz a QR kód.
- Znemožňuje ďalšie prihadzovanie.
- Vyžaduje povinný verejne dostupný dôvod.
- Nemení pôvodný plánovaný čas ukončenia aukcie.
- Nie je totožné s vymazaním aukcie.

## 3. Stage A – Database & Security

Preskúmaj existujúce databázové migrácie, RPC funkcie, RLS politiky a mechanizmy automatickej finalizácie.

Navrhni najjednoduchšie bezpečné rozšírenie existujúceho dátového modelu, ktoré umožní evidovať:

- Stav zrušenia aukcie.
- Čas zrušenia.
- Dôvod zrušenia.

Navrhni transakčnú databázovú funkciu, ktorá:

- Odvodí identitu používateľa z overeného Clerk JWT.
- Overí vlastníctvo aukcie.
- Uzamkne príslušný riadok aukcie.
- Overí aktuálny stav aukcie.
- Overí, že plánovaný čas ukončenia ešte nenastal.
- Overí neprázdny dôvod po odstránení okrajových medzier.
- Atomicky uloží dôvod a zruší aukciu.
- Bezpečne odmietne opakované zrušenie bez zmeny uložených údajov.

Navrhni primeraný maximálny počet znakov dôvodu. Limit zatiaľ považuj za návrh na schválenie.

Preskúmaj a navrhni potrebné úpravy:

- Transakčného prijímania ponúk.
- Automatickej finalizácie aukcie.
- Supabase Cron.
- Verejných a vlastníckych RPC funkcií.
- Oprávnení a RLS politík.
- Existujúcich pravidiel úprav a vymazania aukcie.
- Realtime aktualizácií.

Zrušenie, prihodenie a začiatok automatickej finalizácie musia byť bezpečné aj pri súbežnom vykonaní.

Databázový čas a stav aukcie overuj po získaní príslušného zámku.

Zrušená aukcia nesmie vytvoriť kandidátov, výsledkové ponuky ani existujúce výsledkové e-mailové notifikácie.

Nezavádzaj nové externé služby ani zbytočné abstrakcie.

## 4. Stage B – Auction Management

Na stránke správy vlastnej aktívnej aukcie navrhni tlačidlo:

- SK: Zrušiť aukciu
- EN: Cancel auction

Použi existujúci dizajnový systém Terra a existujúce komponenty.

Tlačidlo otvorí potvrdzovací modal obsahujúci:

- Jasné upozornenie na nevratnosť operácie.
- Informáciu, že nebude vybraný víťaz.
- Informáciu, že existujúce ponuky zostanú zachované.
- Povinné textové pole na dôvod zrušenia.
- Potvrdenie zrušenia.
- Možnosť zatvoriť modal bez vykonania operácie.

Pri textovom poli zobraz upozornenie:

SK: Dôvod bude verejný. Neuvádzajte osobné údaje.

EN: The reason will be public. Do not include personal information.

Ošetri pending stav, opakované odoslanie, chyby servera a mobilné zobrazenie.

Rozlišuj existujúcu funkciu vymazania aukcie od novej funkcie zrušenia aukcie.

## 5. Stage C – Public Auction Detail & Dashboard

Po zrušení musí verejný odkaz na aukciu zostať funkčný.

Verejný detail zobrazí:

- SK: Aukcia zrušená
- EN: Auction cancelled
- Dôvod zrušenia.
- Doterajšiu históriu ponúk.
- Existujúce fotografie a informácie o aukcii.

Odpočítavanie a možnosť prihadzovania už nesmú pôsobiť ako pri aktívnej aukcii.

Zrušená aukcia nesmie byť prezentovaná ako riadne ukončená aukcia s víťazom.

Zohľadni Feature 18 a zachovaj existujúce označenia prihadzujúcich.

Navrhni aktualizáciu verejného detailu v reálnom čase aj v prípade, že má návštevník stránku otvorenú počas zrušenia.

Zohľadni stav zrušenej aukcie aj v:

- My Auctions.
- My Bids.
- Správe konkrétnej aukcie.
- Existujúcich filtroch a súhrnoch, pokiaľ sú dotknuté.

Zrušenie musí byť správne zobrazené aj po uplynutí pôvodného plánovaného času ukončenia.

Všetky nové používateľské texty priprav v SK aj EN.

## 6. E-mailové notifikácie

Odosielanie samostatného e-mailového upozornenia prihadzujúcim pri zrušení aukcie zostáva otvoreným produktovým rozhodnutím.

V špecifikácii navrhni možnosti a stručne vysvetli ich výhody a nevýhody.

Zatiaľ túto funkcionalitu neimplementuj.

## 7. Stage D – Verification

Priprav plán automatizovaných testov zahŕňajúci minimálne:

- Zrušenie aukcie bez ponúk.
- Zrušenie aukcie s ponukami.
- Odmietnutie prázdneho dôvodu.
- Odmietnutie zrušenia cudzím používateľom.
- Odmietnutie zrušenia neprihláseným používateľom.
- Odmietnutie zrušenia po plánovanom konci.
- Odmietnutie opakovaného zrušenia.
- Zachovanie histórie ponúk.
- Odmietnutie novej ponuky po zrušení.
- Súbeh prihodenia a zrušenia.
- Súbeh zrušenia a automatickej finalizácie.
- Ignorovanie zrušenej aukcie automatickou finalizáciou aj po pôvodnom termíne ukončenia.

Zachovaj existujúce pravidlá idempotencie prijatých ponúk.

Po dokončení implementácie mi priprav iba jeden manuálny testovací blok v slovenčine.

Použijeme skúšobnú aukciu s jednou prijatou ponukou a dve otvorené okná:

- Okno A – majiteľ aukcie.
- Okno B – prihadzujúci.

Overíme prázdny dôvod, úspešné zrušenie, aktualizáciu verejného detailu, zobrazenie dôvodu, zachovanie histórie a blokovanie ďalšieho prihodenia.

## 8. Mimo rozsahu Feature 19

Zatiaľ nerieš:

- Podmienky používania.
- Ochranu osobných údajov.
- Kontaktnú stránku.
- Právne upozornenia pri vytváraní aukcie a prihadzovaní.
- Používateľskú dokumentáciu.
- Opätovnú aktiváciu zrušenej aukcie.
- Nové platobné alebo monetizačné funkcie.

Právne a informačné texty budeme riešiť samostatne po dokončení Feature 19.

## 9. Požadovaný výstup aktuálnej úlohy

Vytvor iba technickú špecifikáciu:

`context/feature-specs/19-auction-cancellation-qrbid.md`

Špecifikácia musí obsahovať:

- Zistenia z existujúcej implementácie.
- Navrhovaný dátový model.
- Pravidlá životného cyklu aukcie.
- Transakčné a bezpečnostné pravidlá.
- Zoznam dotknutých databázových funkcií a aplikačných súborov.
- UI/UX návrh.
- Rozdelenie implementácie na Stage A–D.
- Akceptačné kritériá.
- Testovacie scenáre.
- Otvorené rozhodnutia a prípadné riziká.

Aktualizuj progress tracker iba v rozsahu zaznamenania prípravy špecifikácie.

Na záver mi stručne zhrň navrhované riešenie a upozorni na prípadné konflikty s existujúcou architektúrou.

**Zatiaľ nezačínaj implementáciu.**

Nevykonávaj databázové migrácie, nemeň živú databázu, neinštaluj nové závislosti, necommituj, nepushuj ani nenasadzuj aplikáciu.

Počkaj na moje schválenie špecifikácie.
