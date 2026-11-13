# Feature 12 – Teória chaosu

**Projekt** QRBid · Next.js App Router · Clerk · Supabase PostgreSQL, Storage a Realtime  
**Dodávka** Postupne overiteľné etapy · rozhranie SK/EN · dizajn Terra  
**Nadväzuje na** 11-auction-details-qrbid.md

## 1. Začiatok práce pre Codex

Skontroluj pracovný strom, AGENTS.md, existujúce aukčné trasy a stav Feature 11. Používateľ uvádza, že Codex je už pripojený k Supabase. Over názov alebo identifikátor projektu, prostredie, režim prístupu a aktuálne migrácie cez dostupné čítanie. Pri kontrole konfigurácie pracuj s názvami premenných a identifikátormi prostredia. Hodnoty tajných kľúčov vynechaj z výstupu aj z Git histórie.

Rozsah prvého kroku je **etapa A**. Pred zmenou popíš stručne konkrétne súbory, cieľové prostredie a spôsob overenia. Ak je pripojenie read-only, využi ho na audit a priprav migráciu v repozitári na overenie v lokálnom alebo výslovne určenom testovacom prostredí. Produkčné migrácie, zmeny nastavení projektu, commit a push podliehajú výslovnému povereniu. Pokračuj po etapách podľa výsledkov. Ak niektorá obrazovka Feature 11 ešte chýba, označ závislosť a pokračuj s identitou a nezávislými časťami.

## 2. Navrhovaný dátový model

| Tabuľka | Údaje | Väzby |
| --- | --- | --- |
| profiles | id UUID, clerk_user_id text UNIQUE, created_at. Meno a priezvisko pridaj, keď ich potrebuje konkrétny tok. E-mail a jeho overenie spravuje Clerk. | clerk_user_id mapuje overené Clerk sub |
| auctions | id UUID, owner_id, title, description, location, category podľa formulára, currency, starting_price_minor, min_increment_minor, created_at, starts_at, ends_at, updated_at | owner_id → profiles.id |
| auction_photos | id, auction_id, storage_path, sort_order, created_at | auction_id → auctions.id |
| auction_notes | id, auction_id, body, created_at. Doplnenia vlastníka po prvej ponuke. | auction_id → auctions.id |
| bids | id, auction_id, bidder_id, amount_minor, created_at, request_id | auction_id → auctions.id, bidder_id → profiles.id. Unikátna kombinácia auction_id + bidder_id + request_id. |

Časové údaje ukladaj ako timestamptz a zobrazuj lokalizovane. Peniaze ukladaj v celých najmenších jednotkách meny. Pre prvý tok počítaj s EUR a centami. Nastav databázové obmedzenia pre kladné navýšenie, platný rozsah súm a koniec po začiatku. Over rozsah aj pri prevode medzi JavaScriptom a databázou. Začni indexom pre aukcie vlastníka a históriu podľa aukcie. Ďalšie indexy pridaj podľa reálnych dotazov.

Vlastník vychádza z overenej identity a pri bežných úpravách sa nemení. Časový stav vychádza z databázového času a termínov. Aktuálna najvyššia ponuka a počet sa odvodzujú z prijatých riadkov v bids. Demo záznamy ostávajú oddelené od reálnych účtov a živých údajov. V testovacom prostredí použi jasne označené testovacie záznamy.

## 3. Etapy a overenie

### A. Clerk a profiles

- Použi natívnu integráciu Clerk Third-Party Auth. Supabase klient pre operácie používateľa odovzdáva Clerk session token. RLS vychádza z overeného textového sub a z mapovania v profiles.clerk_user_id. Interné UUID profilu je samostatný identifikátor.
- Profil založ pri prvom potrebnom prihlásenom vstupe cez idempotentný serverový tok. Clerk ID získaj z overenej relácie a databázovú jedinečnosť vynúť cez UNIQUE. RLS a databázové oprávnenia nastav tak, aby klient nedokázal založiť alebo meniť profil cudzieho účtu ani priradiť vlastnému profilu iné Clerk ID.
- Over s účtom A, účtom B a bez relácie. Každý účet má vlastný profil, opakované prihlásenie ho nezdvojí a cudzí účet ho nevie čítať ani meniť.

### B. Create Auction a Moje aukcie

- Pridaj auctions, cudzie kľúče a RLS. Validuj formulár na serveri, vlastníka odvoď z relácie a po uložení zobraz skutočný záznam v Moje aukcie. Súhrn a prázdny stav vychádzajú z reálnych dát. Kontroluj aj priamy prístup k správe cez ID.
- Vlastník si vie aukciu vytvoriť a načítať aj po obnovení stránky. Druhý účet ju nevidí vo vlastnom zozname a nemôže ju spravovať. V tejto etape over súkromný tok vlastníka. Viditeľnosť zdieľaného detailu rozhodneme pred sprístupnením reálnych aukcií návštevníkom. Navrhovaný model je prístup cez odkaz bez verejného katalógu. Odkaz možno preposlať.

### C. Fotky, detail a správa

- Nadviaž na trasy a pravidlá Feature 11. Fotky ukladaj do Storage a poradie a cestu do auction_photos. Prístup k objektom viaž na vlastníctvo alebo schválenú viditeľnosť aukcie. Pred nahratím over typ a veľkosť. Pri čiastočnom zlyhaní zápisu či mazania zabezpeč opakovateľné dokončenie alebo upratanie objektu.
- Aktívna aukcia bez ponúk umožní úpravy a potvrdené odstránenie. Aktívna aukcia s ponukami umožní iba pridať časovo označenú poznámku. Ukončená aukcia je iba na čítanie. Pravidlá úprav, poznámok a mazania vynúť pri databázovej operácii aj po pripojení ponúk v etape D.
- Over galériu, zmeny po obnovení stránky, prístup k cudzej fotke a bezpečný výsledok po neúspešnom nahratí. Pre verejný detail vráť explicitne povolené polia. Zobrazenie profilu, identity prihadzujúceho a e-mailu do tohto výstupu nepatrí.

### D. Prihadzovanie a história

- Prvá ponuka má minimum vo výške vyvolávacej ceny. Ak je cena 20 000 €, ponúkni akciu **Ponúknuť 20 000 €**. Po prvej ponuke zobraz rýchle navýšenia 1×, 2× a 3× nastaveného minima. Pri minime 100 € sú to **+100 € / +200 € / +300 €**. Po kliknutí ukáž na potvrdenie celú sumu v mene aukcie.
- Klient pošle ID aukcie, potvrdenú absolútnu sumu a identifikátor požiadavky. Prihadzujúceho odvoď z overenej relácie. Databázová operácia v jednej transakcii uzamkne riadok aukcie a po získaní zámku overí aktuálny databázový čas, viditeľnosť alebo prístup, rozdiel vlastníka a prihadzujúceho a aktuálne minimum. Rovnaký zámok použijú zmeny a odstránenie aukcie, ktoré závisia od času alebo existencie ponuky.
- Pri presnom opakovaní požiadavky vráť pôvodný výsledok bez ďalšieho zápisu, aj keď už medzitým pribudli ponuky alebo aukcia skončila. Rovnaké ID požiadavky s inou sumou odmietni. Zakáž priamy klientsky INSERT, UPDATE a DELETE na bids. Zápis ide cez jedinú kontrolovanú operáciu s explicitnými oprávneniami a kontrolou identity. Pri operáciách s vyššími oprávneniami prever rozsah grantov a vykonaj testy autorizácie.
- Príklad. Po prijatí 20 200 € je ďalšie minimum 20 300 €. Ak potvrdených 20 100 € už neplatí, vráť nové minimum. Používateľ vyberie a potvrdí novú sumu sám.
- Do histórie návštevníka zobraz sumu a čas. Načítaj ju spolu s aktuálnou ponukou a počtom z rovnakého zdroja. Osobné údaje a bidder_id zostávajú mimo návštevníckeho výstupu.
- Over prvú ponuku, ponuku pod minimom, vlastnú aukciu, cudzí neprístupný detail, čas pred začiatkom a po konci, opakovanú požiadavku a dve súčasné rovnaké ponuky. Pri súbehu over aj úpravu podmienok oproti prvej ponuke. Z testovacej dvojice súčasných rovnakých ponúk môže vzniknúť najviac jeden riadok.

### E. Realtime

- Pripoj odber na konkrétnu aukciu. Použi udalosť po prijatí ponuky ako signál na načítanie aktuálnej ceny, minima, počtu a histórie z autorizovaného zdroja. Pri Broadcast nastav autorizáciu kanálov podľa schválenej viditeľnosti. Udalosť nesie iba bezpečné údaje, napríklad signál zmeny. Samostatne over prístup anonymného návštevníka, ak ho schválená viditeľnosť povoľuje.
- Prvé načítanie aj opätovné pripojenie zosúlaď s databázou. Po odchode z detailu zruš odber. Ak sa cena zmení počas otvoreného potvrdenia, zachovaj potvrdenú sumu a upozorni na nové minimum.
- Over dve otvorené okná bez obnovovania stránky, odpojenie a návrat, neprístupný kanál a zastaranú ponuku. Rozhodnutie o prijatí ponuky zostáva v databáze aj počas výpadku Realtime.

## 4. Kontrola po každej etape

- Uveď dotknuté súbory a migrácie, cieľové prostredie, vykonané kontroly a ich výsledky. Pri zmenách aplikácie spusti lint, TypeScript, build a git diff --check podľa možností pracovného prostredia. Over SK/EN a mobilný tok na dotknutých obrazovkách.
- Otestuj oprávnenia z kontextu bežného účtu, druhého účtu a anonymného návštevníka. Vyhodnoť aj priame dátové požiadavky, aby výsledok nezávisel iba od skrytého tlačidla.
- Otvorené rozhodnutia pred živým spustením zahŕňajú viditeľnosť, pravidlá zrušenia aukcie s ponukami, potvrdenie výsledku a právny charakter ponúk. Generovanie QR/PDF, notifikácie a platby patria do samostatných krokov.

## Referencie

- [Supabase a Clerk](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Autorizácia Supabase Realtime](https://supabase.com/docs/guides/realtime/authorization)
- [PostgreSQL a zámky riadkov](https://www.postgresql.org/docs/current/explicit-locking.html)
