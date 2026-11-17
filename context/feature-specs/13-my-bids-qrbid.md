# Feature 13 – My Bids / Moje ponuky

Špecifikácia prvej verzie. S implementáciou začať po akceptácii Feature 12.

## Cieľ

Prihadzujúci vidí, v ktorých aukciách vedie, kde ho prekonali a ktoré sa už skončili. Z prehľadu sa jedným kliknutím dostane na detail aukcie.

| EN | SK | Obsah |
| --- | --- | --- |
| My Auctions | Moje aukcie | Aukcie, ktoré používateľ vytvoril |
| My Bids | Moje ponuky | Aukcie, v ktorých má používateľ aspoň jednu prijatú ponuku |

## Stránka

- Chránená stránka v existujúcej EN/SK navigácii vedľa My Auctions. Navrhovaná trasa je `/[locale]/my-bids`, podľa konvencií projektu.
- Jedna karta na aukciu. Predvolené poradie je od najnovšej prijatej vlastnej ponuky.
- Na karte je fotografia, ak je k dispozícii, názov aukcie, textový stav, aktuálna najvyššia suma, moja posledná prijatá suma a čas do konca. Po skončení sa zobrazuje konečná najvyššia suma a údaj o ukončení.
- Tlačidlo **View Auction / Zobraziť aukciu** otvorí existujúci detail v aktuálnom jazyku. Ďalšie prihodenie prebieha cez existujúci postup vrátane potvrdenia.
- Desktop zobrazuje údaje v jednom riadku, ak to šírka dovolí: farebný ľavý stavový pás, kompaktnú zaoblenú fotografiu, textový stav pri názve, tri oddelené údajové stĺpce a detailovú akciu. Na mobile sú názov a stav hore, ceny vedľa seba, čas pod nimi a tlačidlo naspodku. Použiť existujúce komponenty a schválenú Terra paletu. Stav je čitateľný aj bez farby.
- Prázdny zoznam zobrazí „Zatiaľ nemáš žiadne ponuky.“ Prázdny filter zobrazí „V tomto filtri nemáš žiadne aukcie.“ Chyba načítania má vlastnú stručnú správu a možnosť skúsiť znova.

| Filter EN | Filter SK | Zobrazené aukcie |
| --- | --- | --- |
| All Bids | Všetky | Všetky aukcie s prijatou vlastnou ponukou |
| Leading | Vediem | Aktívne aukcie, v ktorých najvyššia prijatá ponuka patrí používateľovi |
| Outbid | Prekonané | Aktívne aukcie, v ktorých najvyššia prijatá ponuka patrí inému účtu |
| Ended | Ukončené | Ukončené aukcie bez ohľadu na poradie používateľa |

Počty pri filtroch počítajú aukcie. Ukončená aukcia patrí do filtrov Všetky a Ukončené.

## Údaje a správanie

- Identitu používateľa určí server z aktuálnej Clerk session. Použiť existujúci bezpečný prístup k Supabase. Prehľad musí rešpektovať existujúce pravidlá prístupu a jeho údaje sa nesmú zdieľať medzi reláciami používateľov.
- Načítať iba údaje potrebné pre karty. Server určí vlastnú poslednú prijatú ponuku, aktuálnu najvyššiu prijatú ponuku a stav. Stav ukončenia vychádza z existujúcich pravidiel aukcie a autoritatívneho času. Klient dostane stav a potrebné sumy bez identity či kontaktu iných prihadzujúcich.
- Zoznam načíta aktuálne údaje pri otvorení a opätovnom vstupe na stránku. Realtime ostáva súčasťou detailu aukcie.
- Vyhľadávanie, ďalšie možnosti zoradenia, priame prihodenie z karty a štatistiky sú kandidáti na neskoršie doladenie. Potvrdenie výhercu, kontakt a prevzatie sa budú riešiť po dohode o pravidlách vyhodnotenia aukcie.

## Prvý akceptačný blok

Použi dve testovacie kontá A a B ako prihadzujúcich na aktívnej aukcii, ktorú vlastní tretí účet. Príklad má vyvolávaciu cenu 20,00 € a minimálne navýšenie 1,00 €.

1. A cez detail prihadzuje 20,00 € a následne 21,00 €. V **Moje ponuky** sa zobrazí jedna karta, aj keď sú prijaté dve ponuky. Stav je **Vediem** a obe ceny sú 21,00 €.
2. B cez detail ponúkne 22,00 €. A znova otvorí **Moje ponuky**. Tá istá karta je vo filtri **Prekonané**, najvyššia suma je 22,00 € a posledná vlastná ponuka je stále 21,00 €.
3. A otvorí **Zobraziť aukciu** a overí, že sa zobrazí správny detail v aktuálnom jazyku.

Po vyhodnotení tohto bloku nasledujú samostatné kontroly pre ukončenú aukciu, oddelenie účtov, neprihláseného používateľa, prázdne stavy a mobilné rozloženie v EN/SK.
