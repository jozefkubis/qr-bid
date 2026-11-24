# Feature 16 – Prihadzovanie, odozva tlačidiel a výsledkové e-maily

**Stav:** Dokončené. Kroky 1 a 2 sú implementované a manuálne prijaté produktovým vlastníkom. Krok 3 je implementovaný lokálne a všetkých 14 fiktívnych EN/SK HTML/text náhľadov produktový vlastník manuálne prijal 24. 11. 2026. Žiadny e-mail nebol odoslaný.

**Umiestnenie v repozitári:** `context/feature-specs/16-auction-ui-and-emails-qrbid.md`

## Cieľ

Na mobile aj na počítači je jasné, ktorú sumu používateľ vybral, koľko odosiela a či bola ponuka prijatá. Tlačidlá majú jednotnú odozvu na stlačenie. Výsledkové e-maily stručne vysvetľujú, čo sa stalo a čo môže príjemca urobiť.

Podkladom je existujúci živý tok prihadzovania a výsledkový tok Feature 15. Predčasné zrušenie aukcie je samostatný odložený nápad.

## Krok 1 – Výber ponuky a potvrdenie v modále

**Implementačný stav (2026-11-23):** Existujúci panel prihadzovania lokálne používa jednoznačný výber rýchlej sumy, vlastnú sumu sledujúcu aktuálne minimum a spoločný natívny modálny dialóg pre obe cesty. Server posiela klientovi iba RLS-odvodený boolean vlastníctva; vlastník v modale namiesto odoslania vidí upozornenie s výkričníkom a návrat, zatiaľ čo databázový zákaz vlastného prihodenia zostáva rozhodujúcou ochranou. Server Action, databázová validácia a request UUID zostali zachované. TypeScript, ESLint, EN/SK parita, `git diff --check` a produkčný Next.js build prešli. Produktový vlastník prijal hlavné mobilné quick/custom/owner a odosielacie scenáre; samostatné zopakovanie súbehu v druhom okne, nízkeho viewportu a kompletného desktopového klávesnicového priechodu zostáva evidované nižšie.

### Výber sumy

- Zelené pozadie a značka výberu patria rýchlej voľbe, ktorú používateľ stlačil. Pred prvým výberom sú všetky rýchle voľby obrysové. Pri vlastnej sume sa výber rýchlej voľby vyčistí. Označenie má byť čitateľné aj bez rozlíšenia farby a dostupné asistívnym technológiám.
- Na mobile zobraz celkovú sumu ako hlavný údaj a navýšenie menším písmom pod ňou. Pri prvom prihodení stačí zobraziť vyvolávaciu sumu podľa existujúcich pravidiel.
- Kým používateľ vlastnú sumu neupravuje, pole sleduje platné minimum. Ak minimum stúpne počas úpravy, zachovaj rozpracovaný vstup a zobraz nové minimum pri poli. Po úspešnom prihodení vyčisti výber a nastav pole na nové minimum potvrdené serverom.

### Potvrdenie

- Rýchla voľba aj úspešná kontrola vlastnej sumy otvoria rovnaký modál. Na počítači bude vycentrovaný, na mobile ukotvený pri spodnom okraji. Na nízkej obrazovke ostanú suma a akcie viditeľné, s rešpektovaním bezpečnej zóny displeja. Ak obsah potrebuje viac miesta, posúva sa vo vnútri modálu.
- Príklad SK: nadpis **Potvrďte prihodenie**, text **Vaša celková ponuka je 70,00 €**, akcie **Potvrdiť 70,00 €** a **Späť**. EN: **Confirm your bid**, **Your total bid is €70.00**, **Confirm €70.00** a **Back**. Formát sumy určuje jazyk aplikácie.
- Modál má prístupný názov, presunie fokus dovnútra, zachytáva Tab, počas otvorenia blokuje interakciu s pozadím a po zavretí vracia fokus na ovládací prvok, ktorý ho otvoril. Pred odoslaním ho možno zavrieť akciou Späť alebo klávesom Escape. Otvorenie modálu samo osebe nič neodosiela.
- Po potvrdení zobraz **Odosielam ponuku… / Submitting bid…** a zablokuj opakované odoslanie. Použi existujúcu Server Action, databázovú validáciu a identifikátor požiadavky. Opakovanie rovnakej požiadavky po nejasnom výsledku drží pôvodné ID. Skutočná zmena potvrdzovanej sumy vytvorí nové ID.
- Ak suma po novom prihodení ešte spĺňa minimum, zvolená suma ostáva. Ak už nestačí, modál zobrazí nové minimum a umožní návrat k úprave sumy. Upravenú sumu musí používateľ výslovne potvrdiť. Zamietnutie serverom je viditeľné priamo v modále. Po skončení aukcie sa zobrazí jasný stav a odoslanie sa zablokuje.
- Pri prijatí alebo potvrdenom opakovaní tej istej požiadavky modál zavri, obnov údaje a v paneli viditeľne oznám výsledok, napríklad **Ponuka 70,00 € bola prijatá. Ďalšia minimálna ponuka je 71,00 €.** Sumu a minimum odvoď z potvrdenej požiadavky a serverovej odpovede, s následným zosúladením pri refreshi. Výsledok oznám aj čítačke obrazovky.

### Akceptácia kroku 1

**Stav akceptácie (2026-11-23):** Produktový vlastník na mobile potvrdil otvorenie a zatvorenie modalu bez odoslania, okamžitú vlastnícku blokáciu s výkričníkom, úspešné rýchle prihodenie s jedným novým záznamom a novým minimom aj vlastnú sumu vrátane vyčistenia rýchlej voľby, návratu bez odoslania a následného prijatia. Súbežné zvýšenie minima v druhom okne, nízky viewport a úplný desktopový klávesnicový priechod neboli samostatne zopakované; existujúce zachovanie sumy/request UUID a databázová validácia zostali nezmenené.

Na skúšobnej aukcii over rýchlu aj vlastnú sumu na mobile a počítači. Pri minime 69,00 € vyber možnosť 70,00 €. Má sa zvýrazniť práve táto možnosť a modál má ukázať 70,00 €. Over návrat bez odoslania, odoslanie s viditeľným priebehom, jediný záznam ponuky a obnovené minimum 71,00 €. V druhom okne posuň minimum nad rozpracovanú sumu a over, že sa používateľovi zobrazí nové minimum bez zmeny jeho sumy. Over klávesnicu a nízky mobilný viewport.

## Krok 2 – Odozva tlačidiel v celej aplikácii

**Implementačný stav (2026-11-23):** Jedno zdieľané pravidlo v `app/globals.css` pridáva aktívnym natívnym tlačidlám, QRBid odkazom s tlačidlovým `rounded-soft` vzhľadom, ovládacím labelom pre výber súboru a prvkom s triedou `qrbid-pressable` mierku `0.98` počas `:active`. `Button` nesie zdieľanú triedu priamo a podporované Clerk prvky ju dostávajú cez `appearance.elements`. Selektory vylučujú `disabled`, `aria-disabled` a `aria-busy`; pravidlo sa vytvára iba pri `prefers-reduced-motion: no-preference`. Fokus, rozmery a trvalý stav vybratej ponuky sa nemenia. TypeScript, ESLint, EN/SK parita, `git diff --check` a produkčný Next.js build prešli a produktový vlastník následne prijal manuálnu pointer, klávesnicovú, disabled, Clerk, cross-page aj reduced-motion kontrolu.

- Pri stlačení má aktívne tlačidlo vizuálnu mierku `0.98`, pri pustení sa vráti na `1`. Odozva funguje pre dotyk, myš a klávesnicové stlačenie tam, kde daný prvok podporuje aktiváciu.
- Pravidlo zdieľaj medzi komponentom `Button`, natívnymi tlačidlami a odkazmi štylizovanými ako tlačidlá. Pre aktivované ovládacie prvky v zabudovanom Clerk rozhraní použi podporované nastavenia vzhľadu, ak sú dostupné. Rozsah pokrýva stránky QRBid a ich ovládacie prvky.
- Zachovaj čitateľný fokus, rozloženie a dotykovú plochu. Vypnuté a načítavajúce sa tlačidlá efekt nepoužijú. Pri nastavenom obmedzení pohybu sa transformácia vypne. Trvalé zelené zvýraznenie vybratej ponuky sa riadi stavom výberu.

### Akceptácia kroku 2

**Stav akceptácie (2026-11-23):** Produktový vlastník potvrdil odozvu spoločného tlačidla, tlačidlového odkazu, file-picker ovládania, disabled prvku, klávesnicovej aktivácie, Clerk prvkov aj vypnutie transformácie pri `prefers-reduced-motion: reduce`. Následne potvrdil aj kontroly v Moje aukcie, Moje ponuky a zdieľaní. Screenshotom odhalené nízke zarovnanie tlačidla kontroly vlastnej ponuky bolo opravené centrovaním desktopového gridu a produktový vlastník opravu potvrdil. Krok 2 je prijatý.

Prejdi úvod, detail aukcie, vytvorenie, Moje aukcie, Moje ponuky, zdieľanie a prihlasovanie. Over spoločný komponent aj samostatne štylizované tlačidlá, krátku dotykovú odozvu, stav disabled a nastavenie obmedzenia pohybu.

## Krok 3 – Výsledkové e-maily SK a EN

**Implementačný stav (2026-11-23):** Existujúci Feature 15 renderer teraz rozlišuje všetkých sedem schválených kombinácií udalosti a príjemcu. Predmet vždy obsahuje názov aukcie a výsledok alebo potrebnú akciu; prvý odsek pomenúva udalosť a ďalší krok. Výzva kandidátovi obsahuje jeho sumu a presný `expires_at` formátovaný v explicitnom UTC, ostatné správy zobrazujú sumu iba pri udalosti s kandidátskou ponukou. Owner a bidder CTA zachovávajú existujúce chránené ciele; HTML má jedno responzívne hlavné tlačidlo a textová verzia rovnakú správu aj odkaz. Používateľský názov aukcie sa v HTML escapuje.

Lokálny príkaz `npm run email:previews` vytvára sedem EN a sedem SK fiktívnych HTML/TXT párov plus `tmp/email-previews/index.html`; nič neposiela cez Resend. Generátor overuje počet variantov, názov aukcie v predmete, práve jedno HTML CTA, zhodný správny odkaz v HTML/text verzii a sumu/UTC termín vo výzve. Všetkých 14 náhľadov prešlo, rovnako TypeScript, ESLint, EN/SK katalógová parita, `git diff --check` a produkčný Next.js build. Obsahová a vizuálna kontrola v úzkom e-mailovom zobrazení zostáva otvorená; Resend odoslanie, inbox doručenie, outbox a hosted stav sa v tomto kroku nemenili ani netestovali.

**Akceptácia (2026-11-24):** Produktový vlastník manuálne skontroloval a prijal celú sadu 14 EN/SK náhľadov vrátane HTML a textových verzií. Krok 3 a Feature 16 sú dokončené. Toto prijatie nie je súhlas s reálnym odoslaním cez Resend, nasadením, commitom ani pushom; tieto kroky zostávajú samostatne podmienené výslovným súhlasom.

- Uprav existujúce šablóny Feature 15. Predmet pomenuje aukciu a výsledok alebo potrebnú akciu. Prvý odsek vysvetlí udalosť a čo nasleduje. Každý e-mail má jedno hlavné tlačidlo; textová verzia má rovnakú informáciu a odkaz.
- Pri výzve zobraz vlastnú ponúknutú sumu a presný termín z `expires_at` s jednoznačným časovým pásmom. Jazyk príjemcu sám neurčuje jeho miestne časové pásmo. Pri ostatných udalostiach zobraz sumu iba tam, kde ju existujúca udalosť poskytuje. Názov aukcie spracuj ako text zadaný používateľom.
- Pri potvrdenom záujme oba e-maily vysvetlia ďalšiu dohodu medzi účastníkmi. Meno a overený e-mail druhej strany sa sprístupňujú cez chránenú časť aplikácie. Znenie dokončenia predaja uvedie, že ho vlastník zaevidoval v QRBid.
- Použi existujúce udalosti, príjemcov, ciele odkazov, odosielateľa a lokalizáciu Feature 15. Na prvú kontrolu priprav lokálne ukážky s fiktívnymi údajmi.

| Udalosť a príjemca | Návrh hlavnej správy SK | Tlačidlo SK / EN |
| --- | --- | --- |
| Výzva kandidátovi | Aukcia sa skončila. Potvrďte, či máte záujem kúpiť predmet za sumu, ktorú ste ponúkli. Odpovedzte do uvedeného termínu. Pri odmietnutí alebo uplynutí termínu môže QRBid osloviť ďalšieho záujemcu. | Otvoriť ponuku a odpovedať / Open and respond |
| Potvrdený záujem – vlastník | Záujemca potvrdil, že chce pokračovať. V správe aukcie nájdete jeho overený e-mail. Napíšte mu a dohodnite si ďalší postup. | Zobraziť kontakt v QRBid / View contact in QRBid |
| Potvrdený záujem – záujemca | Zaznamenali sme vaše potvrdenie. V časti Moje ponuky nájdete overený e-mail vlastníka a môžete sa dohodnúť na ďalšom postupe. | Zobraziť kontakt v QRBid / View contact in QRBid |
| Bez ponúk – vlastník | Aukcia sa skončila a do stanoveného termínu neprišla žiadna ponuka. | Otvoriť správu aukcie / Open auction management |
| Bez potvrdeného záujemcu – vlastník | Aukcia sa skončila bez potvrdeného záujemcu. Ak to chcete skúsiť znova, môžete vytvoriť novú aukciu. | Otvoriť správu aukcie / Open auction management |
| Dokončenie zaznamenané – vlastník | Predaj ste v QRBid označili ako dokončený. Podrobnosti nájdete v správe aukcie. | Zobraziť výsledok aukcie / View auction result |
| Dokončenie zaznamenané – záujemca | Vlastník v QRBid označil predaj za dokončený. Výsledok nájdete v časti Moje ponuky. | Zobraziť výsledok v Mojich ponukách / View result in My Bids |

### Akceptácia kroku 3

Skontroluj všetkých sedem kombinácií udalosti a príjemcu v oboch jazykoch, v HTML aj v textovej verzii. Over správny odkaz podľa roly, presný termín výzvy, priame vyjadrenie ďalšieho kroku a čitateľnosť v úzkom e-mailovom zobrazení.

## Odovzdanie pre Codex

> Pracuj v QRBid a podľa AGENTS.md. Prečítaj projektový kontext, aktuálny tracker, Feature 15 a túto špecifikáciu. Skontroluj git status a zachovaj existujúce zmeny. Prvý implementačný blok je výhradne krok 1. Rešpektuj existujúcu validáciu ponúk a dizajn Terra. Po zmene spusti ESLint, TypeScript alebo produkčný build, kontrolu zhody prekladov a git diff --check. Aktualizuj tracker podľa skutočného stavu a daj Jožkovi jeden konkrétny manuálny testovací blok v slovenčine. Kroky 2 a 3 začni po overení a schválení predchádzajúceho kroku. Commit a push podliehajú výslovnému pokynu.
