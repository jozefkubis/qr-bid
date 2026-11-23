# Feature 17 – Mobilné rozhranie QRBid

Umiestnenie v repozitári po prenesení: `context/feature-specs/17-mobile-ui-qrbid.md`

**Stav:** Schválený rozsah. Začať opravou rýchlych ponúk na aktuálnej lokálnej verzii Feature 16.

## 1. Rýchle ponuky na mobile

**Pozorovaný problém.** Pri výbere prostrednej ponuky sa tlačidlo sfarbí nazeleno, pridá sa fajka a ľavý okraj sumy **85,50 €** sa oreže. Používateľ hlási aj horizontálny presah.

- Najprv zopakuj scenár na lokálnom kóde Feature 16 a identifikuj prvok, ktorý presahuje alebo orezáva obsah.
- Ponechaj zelené zvýraznenie aj fajku. Pre fajku vyhraď rovnaké miesto v každom stave tlačidla, napríklad v pravom hornom rohu. Výber nemení rozmery tlačidla, polohu textu ani počet stĺpcov.
- Celková suma je hlavný údaj. Navýšenie sa zobrazuje menšie, pod ňou. Celá suma vrátane meny sa má zmestiť aj v SK a EN pri cenách okolo **20 000 €**. Rozloženie sa môže zalomiť do ďalšieho riadku, keď sa tlačidlá vedľa seba nezmestia.
- Over, že sa dá zobraziť celý obsah a že stránka ani panel nemajú vodorovný posuv. Oprav príčinu v rozložení tlačidiel. Zachovaj existujúci modál Feature 16, prístupnosť výberu, dotykovú plochu a odosielanie ponuky.

### Prvý manuálny test pre Jožka

1. Otvor **skúšobnú** aukciu s tromi rýchlymi ponukami a v DevTools nastav šírku **320 px**.
2. Vyber každé tlačidlo postupne. Keď sa otvorí modál, použi **Späť**, aby si mohol skúsiť ďalšiu sumu.
3. Pri každom výbere skontroluj, že je viditeľná celá suma aj navýšenie, fajka neposúva text a stránka sa vodorovne neposúva.
4. Zopakuj na skúšobnej aukcii so sumami okolo **20 000 €**, napríklad **20 500,00 €**. Ak treba, tlačidlá sa presunú do ďalšieho riadku. Potvrď jednu skúšobnú ponuku a over, že modál, odoslanie a stav úspechu fungujú.

## 2. Mobilná typografia

- Pod existujúcim mobilným breakpointom uprav spoločné typografické štýly a potom skontroluj, ako sa prejavili na domovskej stránke, detaile aukcie, formulároch, kartách a v menu. Orientačne **14–15 px** pre bežný text, **12–13 px** pri pomocnom texte a primerane kompaktnejšie medzery. Zachovaj čitateľnosť a hierarchiu. Aktuálna cena aukcie a suma v modále zostávajú výrazné.
- Zachovaj pohodlnú dotykovú plochu ovládacích prvkov, približne **44 × 44 px**, aj keď sa zmenší text alebo ikona. Pole na zadanie sumy a dlhšie popisy over aj pri zväčšenom texte.

## 3. Mobilná hlavička a navigácia

- V jednom riadku zobraz menšie logo vľavo a vpravo v poradí **jazyk, profil, menu**. Prepínač zobrazuje aktívne **SK** alebo **EN** a po otvorení ponúkne oba jazyky. Pri zmene jazyka použi existujúce smerovanie a zachovaj aktuálnu stránku, ak to smerovanie umožňuje.
- Prihlásený používateľ má avatar hore. Meno je viditeľné v otvorenom ovládaní profilu. Pre odhláseného zostáva dostupné prihlásenie. Pri otvorení navigácie zostáva rovnaký horný riadok a navigačné odkazy sa zobrazia pod ním. Zachovaj existujúce položky a prístupné názvy ovládacích prvkov.
- Over otvorený aj zatvorený stav, oba jazyky a prihláseného aj odhláseného používateľa pri šírke **320 px** a na bežnom mobile.

## 4. Mobilná pätička

- Použi menšie logo alebo názov QRBid, stručný copyright a kompaktné funkčné odkazy. Podmienky a súkromie zobraz, keď majú funkčné ciele. Jazyk sa na mobile prepína hore v hlavičke.
- Stav, Dokumentáciu a text „Pripravujeme“ na mobile zobrazuj iba tam, kde má daná položka funkčný cieľ a text používateľovi niečo vysvetľuje.

## Odovzdanie pre Codex

> Pracuj v aktuálnej pracovnej kópii QRBid v `C:\Users\kubis\Desktop\qr-bid`. Prečítaj AGENTS.md, projektový kontext, tracker, Feature 16 a túto špecifikáciu. Skontroluj git status a zachovaj rozpracované úpravy. Použi lokálnu verziu rýchlych ponúk s fajkou a modálom z Feature 16. Začni výhradne krokom 1. Rozsah úprav je responzívne zobrazenie QRBid na mobile. Po úprave skontroluj aj desktop, spusti lint a kontrolu TypeScriptu alebo build, git diff --check a zapíš skutočný stav do trackera. Jožkovi daj jeden manuálny testovací blok v slovenčine. K mobilnej typografii, hlavičke a pätičke prejdi jednotlivo po overení predchádzajúceho kroku. Commit a push podliehajú výslovnému pokynu.
