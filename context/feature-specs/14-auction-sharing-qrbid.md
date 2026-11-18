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

## Akceptácia

Každý manuálny blok rieš samostatne. Začni blokom 1.

1. **Vytvorenie a zdieľanie.** Na dostupnom nasadení vytvor skúšobnú aukciu v slovenčine. Po uložení skontroluj presmerovanie a potvrdenie. Skopírovaný odkaz otvor v anonymnom okne a naskenuj QR kód telefónom. Obe cesty majú otvoriť rovnaký verejný detail bez prihlásenia.
2. **Opätovné otvorenie a prístupy.** Zo správy aukcie otvor zdieľanie a over, že sa už nezobrazí potvrdenie o novom zverejnení. Neprihlásený návštevník súkromnej stránky sa má dostať na prihlásenie. Prihlásený používateľ s cudzou aukciou má dostať 404.
3. **PNG, preklady a rozloženie.** Stiahni PNG a over jeho cieľ. Skontroluj EN/SK, úzke mobilné zobrazenie a ručné kopírovanie pri nedostupnej schránke.
4. **A4 PDF.** Po dokončení druhého kroku vytlač plagát a naskenuj QR telefónom.

## Stav pri odovzdaní

Krok 1 je implementovaný v aktuálnej pracovnej kópii a produktový vlastník 18. novembra 2026 oznámil, že funguje, a schválil pokračovanie na Krok 2. Detailné výsledky jednotlivých manuálnych podscenárov neboli samostatne zaznamenané.

Krok 2 je implementovaný lokálne. Stránka zdieľania ponúka jednostranový lokalizovaný A4 PDF plagát s názvom, voliteľnou lokalitou, prvou fotografiou, ak existuje, veľkým QR kódom a rovnakou absolútnou verejnou URL ako kopírovanie, PNG a verejné tlačidlo. PDF knižnica a vložené Unicode fonty sa načítajú až po kliknutí. Reprezentatívny slovenský plagát s diakritikou a fotografiou bol vygenerovaný, otvorený v Edge PDF rendereri a vizuálne overený ako jedna neorezaná A4 strana. TypeScript, ESLint, 355-kľúčová EN/SK zhoda, produkčný audit, `git diff --check` a Turbopack build prešli. Reálny papierový výtlačok a telefónny sken QR kódu zostávajú pre akceptačný blok 4; Feature 14 dovtedy nie je uzavretá. Zmeny neboli commitnuté ani pushnuté.

Pri prevzatí v Codexe si prečítaj `AGENTS.md`, skontroluj `git status` a pokračuj akceptačným blokom 4. Feature 14 uzavri až po úspešnom výtlačku a telefónnom skene PDF QR kódu.
