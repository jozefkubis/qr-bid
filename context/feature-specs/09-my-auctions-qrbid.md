# Feature 09 — My Auctions / Moje aukcie

**Status:** Schválená špecifikácia pre Codex; implementácia samostatne.  
**Projekt:** QRBid — Next.js 16 App Router, React, TypeScript, Tailwind CSS, Clerk, next-intl.  
**Dizajn:** Terra — krémové pozadie, biele karty, zelená akcentová farba, Literata a Nunito Sans.  
**Rozsah:** Len frontend, bez databázy; súhrnné karty používajú tri produktovým vlastníkom schválené statické referenčné hodnoty.

## 1. Cieľ

Vytvoriť minimalistickú, responzívnu a lokalizovanú stránku **My Auctions / Moje aukcie** pre prihláseného používateľa. Referenčné screenshoty určujú základné rozloženie: názov stránky v hornej lište, tri kompaktné súhrnné karty, dvojica veľkých kariet aukcií a spodný široký CTA panel. Súhrnné hodnoty vo Feature 09 sú výslovne schválené statické UI referencie, nie údaje z databázy ani tvrdenie o skutočnej aktivite.

## 2. Schválené rozhodnutia

- Pridať **My Auctions / Moje aukcie** do existujúcej hornej lišty bezprostredne vedľa QRBid, iba pre prihlásených používateľov. Zachovať túto ľavú pozíciu na desktope aj mobile; neduplikovať odkaz v rozbalenom mobilnom menu.
- URL: `/en/my-auctions` a `/sk/my-auctions`.
- Názov **My Auctions / Moje aukcie** zobraziť v hornej lište vľavo bezprostredne vedľa QRBid, iba v signed-in stave. V hlavnom obsahu ho vizuálne neopakovať; zachovať sémantický `h1` pre prístupnosť.
- Podnadpis: **Manage your active and completed private auctions.** Preložiť prirodzene do slovenčiny.
- Pri nadpise jednoduchý vizuálny prepínač **All / Active / Ended**. Vo Feature 09 nemá filtrovať; nesmie predstierať funkčnosť.
- Pod hlavičkou tri úzke súhrnné karty v jednom riadku na desktope. Použiť ikony a typografickú hierarchiu z referencie: malý názov, väčšia tučná hodnota a malý doplnkový údaj vpravo. Schválený statický EN obsah je **Live Bidding Activity / 3 Active QR Assets / Real-time**, **Combined High Value / €645.00 / 40 total bids** a **Physical Scans (Today) / 82 Direct Scans / Print Posters**. Prvá slovenská karta používa stručné znenie **Prebiehajúca aktivita / 3 aktívne aukcie / V reálnom čase**; ostatný slovenský obsah prirodzene lokalizovať.
- Pod nimi **presne dve neutrálne ghost karty** bez údajov, mien aukcií, obrázkov nehnuteľností, cien či klikateľných akcií.
- Úplne dole široký panel s nadpisom **Ready to create another auction?**, textom **Create a new auction and share it with a QR code.** a funkčným tlačidlom **Create Auction** vedúcim na existujúcu lokalizovanú stránku vytvorenia aukcie.
- Kompletná EN/SK lokalizácia cez existujúce `messages/en.json` a `messages/sk.json`.
- Vo Feature 10 ghost karty nahradia reálne aukcie; pri nulovom počte aukcií vznikne skutočný *empty state*.

## 3. Rozloženie — tri časti

### A. Hlavička a súhrnné karty

Použiť existujúcu šírku kontajnera, odsadenia, farby, fonty a komponenty Terra. Popis stránky zarovnať vľavo; All / Active / Ended napravo na väčších obrazovkách, na mobile pod popisom. Tri rovnako vysoké kompaktné karty majú jemný rámik/tieň, kruhové ikonové pozadie, drobný názov, striedmo zväčšenú tučnú hodnotu a drobný údaj vpravo. Typografia má zostať subtílna a nesmie opticky zväčšovať výšku kariet. Na menších obrazovkách karty prehľadne skladať pod seba.

### B. Ghost karty aukcií

Dve vizuálne identické karty v responzívnej mriežke (desktop 2 stĺpce, mobil 1). Ich kostra predpripraví budúci vzhľad:

- neutrálna plocha fotografie s ikonou obrázka;
- placeholder pre názov a lokalitu;
- placeholder pre stav a zostávajúci čas;
- tri placeholder oblasti pre najvyššiu ponuku, počet ponúk a vyvolávaciu cenu;
- vizuálne rezervované oblasti budúcich akcií **View & Share QR** a **Auction Details**, bez skutočných tlačidiel a bez `href`.

Ghost karty nesmú vyzerať ako existujúce aukcie. Použiť jemné statické skeletony bez rušivej animácie. Dekoratívne časti označiť `aria-hidden="true"` a pridať jednu krátku lokalizovanú informáciu pre prístupnosť, že ide o náhľad rozloženia. Ak sa hodí, vytvoriť malý znovupoužiteľný `AuctionCardSkeleton`, ale nevytvárať model dát ani mock API.

### C. Spodný CTA panel

Jeden široký jemne orámovaný panel, malá ikona, stručný nadpis, podporný text a funkčný odkaz **Create Auction / Vytvoriť aukciu**. Na mobile usporiadať obsah vertikálne. Nepoužívať komplikované výrazy typu *QR target*, *asset* alebo *physical bidding*.

## 4. Navigácia a bezpečnosť

- Najprv prečítať aktuálny `SiteHeader`, existujúce Clerk komponenty a `proxy.ts`.
- Zachovať logo, Home, Clerk modal `SignInButton`, `UserButton`, prepínač jazyka a mobilné menu.
- Link My Auctions zobrazovať iba v stave `signed-in`, s použitím existujúceho Clerk vzoru, priamo vedľa QRBid vo všetkých šírkach.
- Novú stránku chrániť **na serveri** (`auth.protect()` alebo ekvivalent kompatibilný s aktuálnym SDK). V existujúcom `proxy.ts` doplniť ochranu lokalizovaných trás My Auctions, ak to zodpovedá aktuálnej architektúre.
- Nepridávať druhý proxy/middleware. Zachovať verejný landing, auth stránky a budúce verejné detaily aukcií.
- Pri priamom anonymnom prístupe použiť správnu jazykovú prihlasovaciu stránku a podľa možností bezpečne zachovať návrat na pôvodnú URL.
- Skrytie odkazu v UI **nenahrádza** serverovú autorizáciu.

## 5. Preklady

Pridať sémantické kľúče do existujúcich JSON katalógov, napríklad namespace `MyAuctions` a položku v `Navigation`. Preložiť nadpis, podnadpis, tri súhrnné karty, All/Active/Ended, prístupný opis ghost kariet a celý CTA panel. Dodržať paritu kľúčov. Nemení sa existujúca priorita jazyka: explicitná URL → cookie → prehliadač → EN.

## 6. Technické hranice

**Nerobiť:** Supabase integráciu, databázové tabuľky, RLS, Realtime, Storage, načítavanie aukcií, fake aukcie, skutočný výpočet štatistík, QR scan tracking, generovanie QR, prihadzovanie, skutočné filtrovanie, nové knižnice, ďalšie dashboardy ani redesign existujúcich stránok. Tri schválené statické súhrnné hodnoty sú iba vizuálny obsah Feature 09 a nesmú sa prezentovať ako backendové dáta.

Použiť jednoduché komponenty a aktuálny dizajnový systém. Žiadne nové environment premenné. Nečítať ani nevypisovať tajné kľúče. Bez automatického commitu/pushu na GitHub.

## 7. Postup pre Codex

1. **Audit bez zmien:** Skontrolovať reálne trasy, `SiteHeader`, `proxy.ts`, Clerk, `next-intl`, preklady a existujúce UI komponenty. Pred editáciou stručne pomenovať presné plánované súbory. Pri architektonickom konflikte zastaviť a požiadať o rozhodnutie.
2. **Trasa a ochrana:** Pridať lokalizovanú stránku My Auctions, serverové overenie prihlásenia a minimálnu zmenu proxy podľa potreby.
3. **Navigácia:** Pridať odkaz pre prihlásených vedľa QRBid v desktopovej aj mobilnej hornej lište, bez narušenia modalu a UserButton.
4. **UI:** Implementovať tri sekcie, tri súhrnné karty, dve ghost karty a funkčné CTA.
5. **Lokalizácia a overenie:** Doplniť EN/SK preklady, skontrolovať mobilný layout a autentifikáciu; spustiť `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`. Oznámiť presné výsledky.

## 8. Akceptačné kritériá

- [ ] `/en/my-auctions` a `/sk/my-auctions` zobrazujú príslušný jazyk.
- [ ] Neprihlásený používateľ nemôže stránku otvoriť; ochrana je na serveri.
- [ ] Verejné stránky a existujúce Clerk flow zostali funkčné.
- [ ] My Auctions je v hornej lište bezprostredne vedľa QRBid len pre prihlásených, na desktope aj mobile.
- [ ] My Auctions / Moje aukcie je v signed-in hornej lište vedľa QRBid; hlavný obsah ho vizuálne neduplikuje.
- [ ] Popis stránky a vizuálne All / Active / Ended zostali zachované.
- [ ] Presne 3 kompaktné súhrnné karty používajú schválené ikony, malý názov, väčšiu tučnú hodnotu a malý údaj vpravo.
- [ ] Presne 2 neinteraktívne ghost karty bez falošných dát.
- [ ] Spodný CTA odkaz vedie na lokalizovanú stránku Create Auction.
- [ ] Mobil nemá horizontálny overflow a layout je čitateľný.
- [ ] EN/SK preklady majú zhodné kľúče a preložené používateľské texty.
- [ ] Žiadne nové dátové služby, mock záznamy ani zbytočné závislosti.
- [ ] Lint, TypeScript, build a diff kontrola prešli, alebo sú presne popísané blokery.

## 9. Feature 10 — výslovne odložené

- Načítať iba aukcie aktuálneho vlastníka z databázy so správnou autorizáciou/RLS.
- Zobraziť reálne údaje a fotografie v kartách.
- Implementovať All / Active / Ended filtrovanie.
- Ak neexistujú aukcie, **namiesto ghost kariet zobraziť prázdnu plochu** s výzvou na vytvorenie prvej aukcie.
- Schválené statické referenčné hodnoty zo Feature 09 nahradiť iba overenými údajmi aktuálneho vlastníka.
- Rozhodnúť, či a ako vôbec merať QR skeny.
- Funkcie QR zdieľania a detailu aukcie napojiť až po schválení príslušných trás a správania.

## 10. Pokyn pre Codex

Toto je schválený rozsah **frontend-only** Feature 09. Najprv skontroluj aktuálny projekt a predlož stručný plán zmien, potom implementuj po malých krokoch. Zachovaj Terra, Clerk a next-intl. Nevymýšľaj dáta ani business logiku. Bez výslovného súhlasu používateľa nerob commit ani push. Na konci vypíš zmenené súbory, výsledky kontrol a veci odložené na Feature 10.
