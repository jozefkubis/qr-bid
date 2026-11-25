# Feature 17 – Mobilné rozhranie QRBid

Umiestnenie v repozitári po prenesení: `context/feature-specs/17-mobile-ui-qrbid.md`

**Stav:** Sekcie 1–4 sú implementované a manuálne prijaté. Feature 17 je dokončená.

## 1. Rýchle ponuky na mobile

**Pozorovaný problém.** Pri výbere prostrednej ponuky sa tlačidlo sfarbí nazeleno, pridá sa fajka a ľavý okraj sumy **85,50 €** sa oreže. Používateľ hlási aj horizontálny presah.

- Najprv zopakuj scenár na lokálnom kóde Feature 16 a identifikuj prvok, ktorý presahuje alebo orezáva obsah.
- Ponechaj zelené zvýraznenie aj fajku. Pre fajku vyhraď rovnaké miesto v každom stave tlačidla, napríklad v pravom hornom rohu. Výber nemení rozmery tlačidla, polohu textu ani počet stĺpcov.
- Celková suma je hlavný údaj. Navýšenie sa zobrazuje menšie, pod ňou. Celá suma vrátane meny sa má zmestiť aj v SK a EN pri cenách okolo **20 000 €**. Rozloženie sa môže zalomiť do ďalšieho riadku, keď sa tlačidlá vedľa seba nezmestia.
- Over, že sa dá zobraziť celý obsah a že stránka ani panel nemajú vodorovný posuv. Oprav príčinu v rozložení tlačidiel. Zachovaj existujúci modál Feature 16, prístupnosť výberu, dotykovú plochu a odosielanie ponuky.

### Stav implementácie – 24. november 2026

- Problém bol reprodukovaný v lokálnom Edge pri šírke 320 px: tri tlačidlá sa stlačili do jedného riadku a podmienene pridaná fajka prekrývala sumu vybratej ponuky. Príčinou bola kombinácia chýbajúcej minimálnej šírky a rozdielnej vnútornej geometrie vybratého a nevybratého stavu.
- Každé tlačidlo má teraz minimálnu šírku a rovnaký flexibilný základ, takže sa pri nedostatku miesta zalomí. Hlavná suma je výraznejšia a navýšenie zostáva menšie pod ňou. Fajka je absolútne umiestnená v stále vyhradenom priestore a v nevybratom stave je iba priehľadná; výber preto nemení rozmery ani polohu textu.
- Dočasná lokálna náhľadová stránka s reálnym `LiveBiddingPanel` overila 320 px rozloženie v SK aj EN vrátane súm 20 550,00 € / €20,550.00. Obsah nebol orezaný a nebol pozorovaný vodorovný presah. Náhľadová stránka bola po kontrole odstránená.
- Cielený ESLint, samostatná kontrola TypeScriptu, `git diff --check` a produkčný Next.js 16.4.5 Turbopack build prešli. Server Action, modál, `aria-pressed` ani odosielanie ponuky sa nemenili.
- Vlastník produktu úspešne dokončil manuálny test na skutočnej skúšobnej aukcii vrátane vybratých stavov, návratu z modálu, responzívneho rozloženia a úspešne odoslanej ponuky. Sekcia 1 je prijatá; v čase jej prijatia sa Sekcie 2–4 ešte nezačali.

### Prvý manuálny test pre Jožka

1. Otvor **skúšobnú** aukciu s tromi rýchlymi ponukami a v DevTools nastav šírku **320 px**.
2. Vyber každé tlačidlo postupne. Keď sa otvorí modál, použi **Späť**, aby si mohol skúsiť ďalšiu sumu.
3. Pri každom výbere skontroluj, že je viditeľná celá suma aj navýšenie, fajka neposúva text a stránka sa vodorovne neposúva.
4. Zopakuj na skúšobnej aukcii so sumami okolo **20 000 €**, napríklad **20 500,00 €**. Ak treba, tlačidlá sa presunú do ďalšieho riadku. Potvrď jednu skúšobnú ponuku a over, že modál, odoslanie a stav úspechu fungujú.

## 2. Mobilná typografia

- Pod existujúcim mobilným breakpointom uprav spoločné typografické štýly a potom skontroluj, ako sa prejavili na domovskej stránke, detaile aukcie, formulároch, kartách a v menu. Orientačne **14–15 px** pre bežný text, **12–13 px** pri pomocnom texte a primerane kompaktnejšie medzery. Zachovaj čitateľnosť a hierarchiu. Aktuálna cena aukcie a suma v modále zostávajú výrazné.
- Zachovaj pohodlnú dotykovú plochu ovládacích prvkov, približne **44 × 44 px**, aj keď sa zmenší text alebo ikona. Pole na zadanie sumy a dlhšie popisy over aj pri zväčšenom texte.

### Stav implementácie – 24. november 2026

- Mobilný základný text pod breakpointom `sm` používa spoločných 15 px. Existujúce pomocné `text-sm` a `text-xs` štýly zostávajú na 14 px a 12 px; výrazné nadpisy, aktuálne ceny a suma v potvrdzovacom modále si ponechali vlastné väčšie triedy.
- Zdieľané tlačidlá, vstupy a textové polia nemenili rozmery. Ich existujúce `min-h-11` / `min-w-11` zachováva približne 44 × 44 px dotykové plochy.
- Po kontrole vlastníkom produktu boli dve preplnené mobilné oblasti upravené cielene bez zmeny desktopu: štatistiky na karte My Auctions používajú pri 320 px dve položky v prvom riadku a vyvolávaciu cenu v celom druhom riadku; história prihodení zobrazuje sumu a čas pod sebou s kompaktnejším textom. Textový stav „Zatiaľ bez ponúk“ sa môže zalomiť vo svojom stĺpci, zatiaľ čo skutočné peňažné sumy zostávajú nezalomené. Od `sm` zostávajú obe oblasti v pôvodnom horizontálnom rozložení.
- Edge pri 320 px vizuálne overil EN domovskú stránku, reálny detail aukcie, formulár vytvorenia, My Bids karty a otvorené mobilné menu, plus dlhšie slovenské texty na My Bids. Nebol pozorovaný vodorovný presah ani strata hierarchie. Desktop zostal na pôvodných 16 px.
- ESLint, samostatná kontrola TypeScriptu, `git diff --check` a produkčný Next.js 16.4.5 Turbopack build prešli. Jožko 25. novembra 2026 potvrdil čitateľnosť, ovládanie a rozloženie bez vodorovného posuvu pri 320 px vrátane dlhšej ceny, histórie prihodení a karty bez ponúk.

### Druhý manuálny test pre Jožka

1. V DevTools nastav šírku **320 px** a prejdi domovskú stránku, detail aukcie, vytvorenie aukcie a My Bids.
2. Otvor mobilné menu a skontroluj EN aj SK. Bežný text má byť kompaktnejší, ale stále pohodlne čitateľný; pomocné texty nesmú splývať ani sa orezávať.
3. Skontroluj dlhší popis aukcie, polia formulára, filtre a karty. Stránka sa nesmie vodorovne posúvať a tlačidlá/polia musia zostať pohodlne stlačiteľné.
4. Vráť šírku na desktop a over, že typografia vyzerá rovnako ako pred úpravou. Sekciu 2 prijmi až po tejto kontrole.

## 3. Mobilná hlavička a navigácia

- V jednom riadku zobraz menšie logo vľavo a vpravo v poradí **jazyk, profil, menu**. Prepínač zobrazuje aktívne **SK** alebo **EN** a po otvorení ponúkne oba jazyky. Pri zmene jazyka použi existujúce smerovanie a zachovaj aktuálnu stránku, ak to smerovanie umožňuje.
- Prihlásený používateľ má avatar hore. Meno je viditeľné v otvorenom ovládaní profilu. Pre odhláseného zostáva dostupné prihlásenie. Pri otvorení navigácie zostáva rovnaký horný riadok a navigačné odkazy sa zobrazia pod ním. Zachovaj existujúce položky a prístupné názvy ovládacích prvkov.
- Over otvorený aj zatvorený stav, oba jazyky a prihláseného aj odhláseného používateľa pri šírke **320 px** a na bežnom mobile.

### Stav implementácie – 24. november 2026

- Mobilná hlavička používa jeden stabilný riadok v poradí menšie logo QRBid, kompaktný prepínač aktívneho jazyka, Clerk profil alebo prihlásenie a tlačidlo menu. Rozbalená navigácia ponecháva tento riadok na mieste a existujúce odkazy zobrazuje pod ním.
- Kompaktný jazykový ovládač zobrazuje aktívne `SK` alebo `EN`, po otvorení ponúka oba jazyky a používa existujúce zachovanie cesty, query, hash a upozornenie na neuložený formulár.
- Prihlásený stav používa existujúci Clerk `UserButton`; odhlásený stav má samostatné 44 × 44 px tlačidlo prihlásenia s prístupným názvom. Autentifikačná ani smerovacia logika sa nemenila.
- Edge pri 320 px overil prihlásený SK zatvorený stav, otvorený výber jazyka a otvorenú navigáciu bez vodorovného presahu. Jožko 25. novembra 2026 pri 320 px potvrdil poradie ovládacích prvkov, stabilitu horného riadka, prepínanie SK/EN na tej istej aukcii, meno v profile aj dostupnosť prihlásenia po odhlásení.

## 4. Mobilná pätička

- Použi menšie logo alebo názov QRBid, stručný copyright a kompaktné funkčné odkazy. Podmienky a súkromie zobraz, keď majú funkčné ciele. Jazyk sa na mobile prepína hore v hlavičke.
- Stav, Dokumentáciu a text „Pripravujeme“ na mobile zobrazuj iba tam, kde má daná položka funkčný cieľ a text používateľovi niečo vysvetľuje.

### Stav implementácie – 24. november 2026

- Mobilná pätička je zjednodušená na menší názov QRBid a stručný copyright. Nefunkčné položky Podmienky, Súkromie, Stav, Dokumentácia, text „Pripravujeme“ a duplicitný jazykový prepínač sú pod `lg` skryté.
- Existujúca desktopová pätička zostáva nezmenená. Edge pri 320 px vizuálne overil kompaktnú mobilnú pätu; Jožko 25. novembra 2026 potvrdil kompaktnú pätičku pri 320 a 390 px a desktopovú kontrolu typografie, navigácie a pätičky.

## Odovzdanie pre Codex

> Pracuj v aktuálnej pracovnej kópii QRBid v `C:\Users\kubis\Desktop\qr-bid`. Prečítaj AGENTS.md, projektový kontext, tracker, Feature 16 a túto špecifikáciu. Skontroluj git status a zachovaj rozpracované úpravy. Použi lokálnu verziu rýchlych ponúk s fajkou a modálom z Feature 16. Začni výhradne krokom 1. Rozsah úprav je responzívne zobrazenie QRBid na mobile. Po úprave skontroluj aj desktop, spusti lint a kontrolu TypeScriptu alebo build, git diff --check a zapíš skutočný stav do trackera. Jožkovi daj jeden manuálny testovací blok v slovenčine. K mobilnej typografii, hlavičke a pätičke prejdi jednotlivo po overení predchádzajúceho kroku. Commit a push podliehajú výslovnému pokynu.
