# Feature 11 – Auction Details & Management

**Projekt** QRBid · Next.js 16 App Router, React, TypeScript, Tailwind CSS, Clerk, next-intl  
**Rozsah** Frontend First · lokálne demo · SK/EN  
**Východisko** Feature 09 a 10, commit `8bda964` na `main`

## 1. Cieľ a rozsah

Z karty v Moje aukcie otvorí prihlásený používateľ správu konkrétnej demo aukcie. Návštevník s odkazom si otvorí mobilný detail aukcie. Obe obrazovky používajú spoločné údaje a vizuálne komponenty. Rozhranie jasne označuje aukcie aj históriu ako demo.

Feature 11 zahŕňa kopírovanie odkazu a vizuálne vyhradené miesto pre QR kód. Generovanie QR, export A4/PDF, reálne prihadzovanie, Realtime, notifikácie, Supabase a trvalé ukladanie patria mimo rozsahu. Viditeľnosť skutočných aukcií, pravidlá ich zrušenia a skutočná kontrola vlastníctva ostávajú otvorené.

## 2. Trasy a navigácia

| Trasa | Prístup a správanie |
| --- | --- |
| `/{locale}/auctions/{id}` | Demo detail dostupný cez odkaz aj bez prihlásenia. Obsahuje iba údaje určené návštevníkovi. |
| `/{locale}/my-auctions/{id}` | Správa demo aukcie pre prihláseného používateľa. Nadväzuje na existujúcu stránku Moje aukcie. |

- Existujúce tlačidlo **Auction Details / Detail aukcie** nahraď funkčným lokalizovaným odkazom na správu. Zo správy pridaj návrat na Moje aukcie a odkaz **Náhľad pre návštevníka**.
- Správu chráň serverovým Clerk overením a rozšír existujúci `proxy.ts` podľa aktuálneho vzoru. Pri priamom anonymnom vstupe použi prihlásenie v rovnakom jazyku s návratom na pôvodnú internú trasu. Prihlásenie v tomto prototype otvára fiktívne demo záznamy. Autorizácia konkrétneho vlastníka patrí do backendovej fázy.
- Neznáme ID zobrazí stav nenájdenej aukcie s navigáciou primeranou danej obrazovke. Jazykové odkazy používajú existujúce `i18n/navigation.ts`. Zachovaj prístup k `/auctions/new` a pri prepnutí jazyka zachovaj ID a typ obrazovky.

## 3. Detail pre návštevníka

Na mobile zobraz v poradí hlavné foto s výberom ďalších fotiek, názov a lokalitu, stav a odpočet, aktuálnu ponuku, vyvolávaciu cenu a minimálne navýšenie. Pod nimi nasledujú opis, prípadné doplnenia vlastníka a anonymná história demo ponúk. Na desktope môže byť galéria vedľa cenového prehľadu.

- Pridaj vhodné lokálne fiktívne ukážkové fotografie aspoň k demo parkovaciemu miestu. Použi Terra zástupnú plochu pri chýbajúcich fotkách. Galéria má zmysluplný alternatívny text a ovládanie klávesnicou. Používateľské fotky vybrané v správe ostávajú v prehliadači.
- Aktívna aukcia zobrazuje zostávajúci čas. Ukončená zobrazuje dátum ukončenia. Pri nulovom počte ponúk zobraz lokalizované **Zatiaľ bez ponúk**.
### História prihodení / Bid History

- V detaile návštevníka aj v správe zobraz samostatnú sekciu **História prihodení / Bid History**. V hlavičke zobraz celkový počet demo ponúk.
- Každý riadok obsahuje sumu a lokalizovaný dátum a čas prihodenia. Zoraď od najnovšej. Najvyššiu ponuku označ textovým štítkom. Mená a kontaktné údaje sa v histórii nezobrazujú.
- Pri nulovom počte ponúk zobraz **Zatiaľ bez prihodení / No bids yet**. Pri ukončenej aukcii zostáva história dostupná spolu s konečnou najvyššou demo ponukou, ak existuje.
- Na mobile zobraz históriu ako kompaktný zoznam bez horizontálneho posúvania. Údaje vychádzajú z rovnakých demo ponúk ako najvyššia suma a počet ponúk na karte.
- Použi existujúce Terra tokeny, Card a ovládacie prvky. Zachovaj krémové pozadie, biele karty, zelený akcent, Literatu a Nunito Sans. Texty rozhrania, popisy stavov, chyby a prístupné názvy pridaj do oboch katalógov. Fiktívny názov a opis aukcie sa správajú ako používateľský obsah.

## 4. Správa a pravidlá úprav

| Stav | Povolené akcie |
| --- | --- |
| Aktívna bez ponúk | Upraviť názov, opis, lokalitu, vyvolávaciu cenu, minimálne navýšenie a čas ukončenia. Pridať, vymeniť alebo odstrániť fotky. Odstrániť aukciu po potvrdení. |
| Aktívna s ponukami | Pridať samostatnú poznámku s časom zverejnenia. Pôvodný obsah, fotky, cenové podmienky, čas a história sú uzamknuté. |
| Ukončená | Prehľad a história v režime iba na čítanie. |

- Znovu použi vhodné polia a foto picker z Create Auction, ak sa dajú zdieľať bez prepisovania existujúceho formulára. Úprava sa otvorí s predvyplnenými údajmi a má akcie **Uložiť** a **Zrušiť**. Validuj povinné polia, ceny a budúci čas ukončenia podľa pravidiel formulára. Over stav a počet ponúk aj pri uložení, aby otvorený formulár neumožnil úpravu po uplynutí odpočtu.
- Po zvolení odstránenia ukáž názov aukcie, dôsledok a samostatné potvrdenie. Po potvrdení sa vráť do zoznamu a prepočítaj počty. Pri zrušení dialógu sa údaje nemenia. Rovnaká kontrola stavu sa vykoná aj pri potvrdení.
- Sekcia **QR a zdieľanie** má funkciu kopírovania absolútnej lokalizovanej URL návštevníckeho detailu. Pri nedostupnej schránke nechaj odkaz označiteľný a ponúkni ručné kopírovanie. Zobraz lokalizovanú spätnú väzbu. Plocha pre QR má viditeľný text, že kód ešte nie je k dispozícii.
- Zdieľaný odkaz v inom prehliadači zobrazí pôvodný demo záznam. V sekcii zdieľania stručne vysvetli, že lokálne úpravy sa odkazom neprenášajú.

## 5. Údaje a architektúra

- Rozšír `data/demo-auctions.ts` a zachovaj štyri existujúce stabilné ID, vrátane aktívnej aukcie bez ponúk a ukončenej aukcie. Doplň opis, fotografie, minimálne navýšenie, poznámky a fiktívne ponuky. Najvyššiu sumu a počet ponúk odvoď z tej istej histórie pre kartu aj detail. Sumy reprezentuj v centoch, používaj existujúce formátovanie EUR a lokalizované dátumy.
- Zdieľaj lokálny stav aukcií a referenčný čas v rozsahu potrebnom pre zoznam, správu a náhľad. Jedna inicializácia pri načítaní a jeden interval postačia. Prechod medzi obrazovkami v rámci demo relácie zachová úpravy, odstránenie aj časy. Obnovenie stránky vytvorí pôvodné demo dáta. Zostaň pri existujúcich React a Next.js nástrojoch.
- Odvodzuj efektívny stav aukcie rovnakým spôsobom pre odznak, detail, filtre, súhrnné počty a pravidlá úprav. Po uplynutí času musí aktívna aukcia prejsť medzi ukončené pri najbližšej aktualizácii demo hodín. Po vyprázdnení filtra zobraz lokalizovaný prázdny stav.
- Zachovaj jeden zdroj pre cenu, stav a odpočet. Pre súkromnú správu a návštevnícky detail zdieľaj galériu, cenový prehľad a históriu podľa potreby. Správcovské ovládanie vykresľuj iba v správe.

## 6. Postup pre Codex

1. Skontroluj pracovný strom, pokyny repozitára, aktuálne aukčné komponenty, i18n a Clerk. Pred editáciou uveď krátky plán súborov a zohľadni existujúce zmeny.
2. Rozšír demo model a zjednoť stav, čas a súhrny. Over zachovanie pomeru 3 aktívne ku 1 ukončenej pri načítaní.
3. Pridaj obe trasy a detail s galériou. Prepoj kartu zo zoznamu so správou a over priamy prístup aj ochranu.
4. Pridaj lokálne úpravy, poznámky, potvrdenie odstránenia a kopírovanie odkazu. Priebežne overuj každý scenár.
5. Spusť `npm run lint`, `npx tsc --noEmit`, `npm run build` a `git diff --check`. Over paritu katalógov. Oznám skutočné výsledky, nevykonané kontroly a zmenené súbory.

## 7. Akceptačné kritériá

- [ ] Moje aukcie otvára správu správneho ID v SK aj EN. Návrat funguje aj po úprave alebo odstránení.
- [ ] Anonymný návštevník otvorí demo detail, pri správe dostane lokalizované prihlásenie s návratom. Neznáme ID má zrozumiteľnú stránku nenájdenej aukcie.
- [ ] Mobilný a desktopový detail zobrazujú galériu, stav, cenu, podmienky a históriu bez horizontálneho presahu. Galéria aj potvrdenie sú ovládateľné klávesnicou.
- [ ] História je dostupná v detaile aj správe v SK a EN. Riadky obsahujú sumu a čas, sú zoradené od najnovšej ponuky a najvyššia ponuka má textový štítok. Aukcia bez ponúk má prázdny stav.
- [ ] Nulový počet ponúk, prechod do ukončeného stavu a všetky tri filtre fungujú. Cena a počet ponúk sú konzistentné v detaile aj na karte.
- [ ] Úprava aukcie bez ponúk sa prejaví v zozname aj náhľade. Zrušenie formulára či dialógu údaje nemení. Odstránenie prebehne až po potvrdení.
- [ ] Aukcia s ponukami dovolí iba pridať poznámku. Ukončená aukcia sa zobrazí iba na čítanie. Otvorený formulár po vypršaní času zmenu neuloží.
- [ ] Odkaz vedie na návštevnícky detail v správnom jazyku a otvorí sa aj v anonymnom okne. Rozhranie označuje demo a vysvetľuje dosah lokálnych úprav.
- [ ] Obnovenie stránky vráti pôvodné demo dáta. Preklady majú paritu a existujúci Create Auction je dostupný.

Feature 12 **„Teória chaosu“** sa začne po dokončení a schválení Feature 11. Táto špecifikácia pokrýva lokálnu implementáciu. Commit, push a zmeny na GitHube vyžadujú výslovné poverenie.
