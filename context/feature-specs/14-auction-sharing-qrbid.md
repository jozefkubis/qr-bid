# Feature 14 – Zdieľanie aukcie cez odkaz a QR kód

## Cieľ

Po úspešnom vytvorení aukcie otvorí QRBid vlastníkovi stránku **Zdieľať aukciu**. Vlastník skopíruje verejný odkaz do skupiny na Facebooku alebo si stiahne QR kód na tlač. Obe možnosti otvoria verejný detail tej istej aukcie. Detail je dostupný každému s odkazom, prihadzovanie vyžaduje prihlásenie.

## Krok 1 – Stránka na zdieľanie

- Po úspešnom uložení aukcie a spracovaní fotografií presmeruj vlastníka na `/[locale]/my-auctions/[id]/share`. Pri prvom presmerovaní zobraz potvrdenie **Aukcia bola zverejnená**. Pri opätovnom otvorení cez správu aukcie stačí nadpis **Zdieľať aukciu**.
- Stránka na zdieľanie vyžaduje prihlásenie a vlastníctvo aukcie. Opätovne použi existujúce načítanie aukcie vlastníka. Pri neexistujúcej alebo cudzej aukcii zobraz 404.
- Zobraz názov, lokalitu, ak je k dispozícii, vyvolávaciu cenu a termín ukončenia. Dátum zobraz s časovým pásmom.
- Zobraz označiteľný verejný odkaz a tlačidlo **Kopírovať odkaz**. Po úspechu zobraz potvrdenie. Ak schránka nie je dostupná, označ odkaz na ručné kopírovanie.
- QR kód zobraz ako tmavý znak na bielom s voľným okrajom. Použi Terra paletu a na mobile umiestni kopírovanie nad QR kód.
- Pridaj **Stiahnuť QR kód (PNG)** a **Zobraziť aukciu**. V PNG zakóduj presne tú istú absolútnu adresu, ktorú používajú kopírovanie a tlačidlo. Cieľom je existujúci verejný detail `/[locale]/auctions/[id]` na doméne príslušného prostredia.
- Použi preklady EN a SK. PNG generuj z verejnej adresy pri načítaní stránky. Stačí existujúce ID aukcie a súčasný databázový model.

## Krok 2 – A4 plagát

Nasleduje po akceptácii prvého kroku. Pridaj stiahnutie jednostranového PDF vo formáte A4 s názvom aukcie, lokalitou, ak je dostupná, fotografiou, ak je dostupná, a veľkým QR kódom. QR musí smerovať na rovnaký verejný detail. Over čitateľnosť a skenovanie na reálnom výtlačku.

- Hore zobraz skutočné logo QRBid z aplikácie, oproti nemu jemný lokalizovaný štítok „Súkromná aukcia“ a pod nimi tenký oddeľovač hlavičky. Výrazný názov aukcie zarovnaj doľava a dlhý názov nechaj prirodzene zalomiť.
- Pod názvom zobraz kompaktné zaoblené Terra bloky pre voliteľnú lokalitu a lokalizovaný termín ukončenia s časovým pásmom. Použi rovnaký význam ikon lokality a času ako v aplikácii a lokalitu zobraz iba raz.
- Ak je fotografia dostupná, zobraz ju pod údajmi ako jeden široký, nízky a zaoblený pás. Zachovaj proporcie a použi centrovaný výrez, ktorý nechá rozpoznateľný hlavný predmet fotografie. Ak fotografia chýba, nasledujúci blok musí plynulo nadviazať bez prázdneho rámu alebo rezervovaného miesta.
- QR blok oddeľ viditeľným odstupom a zaobleným Terra rámom. Funkčný veľký QR zobraz vľavo, opticky aj geometricky vycentrovaný na čistom bielom podklade s najmenej štvor-modulovým voľným okrajom; vpravo zobraz krátku lokalizovanú výzvu a jednu stručnú faktickú vetu.
- Nad samostatnou zaoblenou URL kartou zobraz krátku výzvu mimo karty. Verejnú URL doplň ikonou odkazu a zobraz ju celú, čitateľnú a klikateľnú. URL a QR musia používať presne ten istý verejný detail.
- Zachovaj biely podklad stránky, jemne tmavšie Terra karty, rozumné okraje pre bežnú tlačiareň, EN/SK preklady, vložený Unicode font a jednu portrétovú A4 stranu. Nepreberaj zo screenshotu marketingové štítky, tvrdenia o prístupe ani bezpečnostné tvrdenia.

## Akceptácia

Každý manuálny blok rieš samostatne. Začni blokom 1.

1. **Vytvorenie a zdieľanie.** Na dostupnom nasadení vytvor skúšobnú aukciu v slovenčine. Po uložení skontroluj presmerovanie a potvrdenie. Skopírovaný odkaz otvor v anonymnom okne a naskenuj QR kód telefónom. Obe cesty majú otvoriť rovnaký verejný detail bez prihlásenia.
2. **Opätovné otvorenie a prístupy.** Zo správy aukcie otvor zdieľanie a over, že sa už nezobrazí potvrdenie o novom zverejnení. Neprihlásený návštevník súkromnej stránky sa má dostať na prihlásenie. Prihlásený používateľ s cudzou aukciou má dostať 404.
3. **PNG, preklady a rozloženie.** Stiahni PNG a over jeho cieľ. Skontroluj EN/SK, úzke mobilné zobrazenie a ručné kopírovanie pri nedostupnej schránke.
4. **A4 PDF.** Po dokončení druhého kroku vytlač plagát a naskenuj QR telefónom.

## Stav pri odovzdaní

Krok 1 je implementovaný v aktuálnej pracovnej kópii a produktový vlastník 18. novembra 2026 oznámil, že funguje, a schválil pokračovanie na Krok 2. Detailné výsledky jednotlivých manuálnych podscenárov neboli samostatne zaznamenané.

Krok 2 je implementovaný lokálne. Stránka zdieľania ponúka jednostranový lokalizovaný A4 PDF plagát s názvom, voliteľnou lokalitou, prvou fotografiou, ak existuje, veľkým QR kódom a rovnakou absolútnou verejnou URL ako kopírovanie, PNG a verejné tlačidlo. PDF knižnica a vložené Unicode fonty sa načítajú až po kliknutí. Reprezentatívny slovenský plagát s diakritikou a fotografiou bol vygenerovaný, otvorený v Edge PDF rendereri a vizuálne overený ako jedna neorezaná A4 strana. TypeScript, ESLint, 355-kľúčová EN/SK zhoda, produkčný audit, `git diff --check` a Turbopack build prešli. Reálny papierový výtlačok a telefónny sken QR kódu zostávajú pre akceptačný blok 4; Feature 14 dovtedy nie je uzavretá. Zmeny neboli commitnuté ani pushnuté.

Po produktovej pripomienke 19. novembra 2026 bol plagát prepracovaný na dvojstĺpcový stred s približne 8 cm fotografiou vľavo, termínom ukončenia s časovým pásmom pod fotografiou a výzvou s QR vpravo. Verejná URL je pod oboma stĺpcami. Variant bez fotografie používa samostatné vycentrované usporiadanie bez prázdneho rámu. Lokálne vygenerované slovenské varianty s fotografiou a bez fotografie mali po jednej A4 strane, nič nebolo odrezané, oba odkazy zostali klikateľné a oba QR kódy sa z vyrenderovaného PDF dekódovali na presne zobrazenú URL. Papierový výtlačok a sken telefónom zostávajú otvorené.

Neskorší schválený Stitch návrh z 19. novembra 2026 nahradil tento dvojstĺpcový stred novou kompozíciou: kompaktné bloky lokalita/koniec pod názvom, široký nízky foto pás, samostatný orámovaný QR panel s QR vľavo a stručnou výzvou vpravo a samostatný URL riadok. Screenshotové marketingové a bezpečnostné tvrdenia sa nepreberajú. Slovenské varianty s fotografiou a bez fotografie boli znovu vyrenderované ako jedna neorezaná A4 strana; oba odkazy zostali klikateľné a oba QR kódy sa z výsledného PDF dekódovali na presne zobrazenú URL. Papierový výtlačok a sken telefónom zostávajú otvorené.

Finálne vizuálne doladenie podľa produktovej pripomienky používa skutočné logo aplikácie, bielu stranu, zaoblené jemne tmavšie Terra karty, ikony lokality, času a odkazu, približne o 14 % vyšší fotografický pás a približne o 20 % väčší QR kód. Výzva k priamemu odkazu zostáva mimo URL karty podľa predlohy. Digitálna kontrola oboch variantov po tejto zmene prešla; papierová akceptácia zostáva otvorená.

Posledná dizajnová iterácia zosvetlila povrchy kariet, opticky vycentrovala ikony a QR, pridala lokalizovaný štítok „Súkromná aukcia“ oproti logu, tenký oddeľovač hlavičky a čitateľnejší text nad URL kartou. QR je vložený ako ostrý vektor so štyrmi voľnými modulmi na každej strane. Oba slovenské varianty naďalej prešli jednostranovou A4 kontrolou, dekódovaním QR a porovnaním s klikateľnou zobrazenou URL; fyzická akceptácia zostáva otvorená.

Pri prevzatí v Codexe si prečítaj `AGENTS.md`, skontroluj `git status` a pokračuj akceptačným blokom 4. Feature 14 uzavri až po úspešnom výtlačku a telefónnom skene PDF QR kódu.
