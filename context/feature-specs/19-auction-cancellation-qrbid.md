# Feature 19 – Predčasné zrušenie aukcie

**Stav:** Implementované a manuálne akceptované s hostovanou databázou. Produkčné nasadenie aplikácie zostáva neoverené.

## 1. Zistenia z repozitára

- Schválené END-001/002/003 a EDIT-001 určujú pevný termín, právo vlastníka zrušiť aktívnu aukciu aj s ponukami, povinný verejný dôvod a uzamknutie cenových parametrov a termínu po prvej ponuke.
- `public.place_bid` uzamyká aukciu pomocou `FOR UPDATE` a vybaví opakovanie prijatej požiadavky pred kontrolami meniaceho sa stavu. Na posúdenie začiatku a konca stále používa `statement_timestamp()`, ktorý môže počas čakania na zámok zastarať.
- `private.start_auction_finalization` už používa rovnaký zámok a čerstvý databázový čas. Výber v `private.run_auction_finalization_cycle` berie do 100 skončených aukcií bez finalizácie. Obe cesty dnes posudzujú skončenie podľa `ends_at`.
- Verejná RPC `get_public_auction` vracia údaje aukcie, fotografie a históriu vrátane čísel dražiteľov z Feature 18. `get_my_auction_bidder_number` poskytuje iba vlastné číslo. Existujúci verejný Broadcast oznamuje prijatý bid a klient znovu načíta detail aj po pripojení.
- Vlastník číta aukciu cez RLS. `get_owned_bid_summaries` dopĺňa počty a najvyššie sumy. `get_my_bid_auctions` klasifikuje aukcie podľa termínu a najvyššej ponuky. Aktívnosť na ďalších obrazovkách vychádza prevažne z `ends_at`.
- Úprava, pridanie poznámky a SQL vymazanie uzamykajú aukciu. Správa fotografií používa oddelené operácie nad Storage a metadátami; pri vymazaní celej aukcie aplikácia odstraňuje objekty ešte pred volaním SQL na vymazanie. Ochrana iba v tomto RPC preto nechráni galériu pred prebiehajúcim odstránením objektov.

## 2. Dátový model a životný cyklus

Pridať do `public.auctions` nullable `cancelled_at timestamptz` a `cancellation_reason text`. Stav odvodiť z `cancelled_at`, aby sa neudržiavali dve nezávislé hodnoty. Staré riadky majú obe hodnoty NULL. Databázová kontrola vyžaduje obe hodnoty naraz, orezaný neprázdny dôvod a `starts_at <= cancelled_at < ends_at`. Limit je **500 znakov** po orezaní. Definovať jednotnú normalizáciu okrajových bielych znakov vrátane tabulátorov a nových riadkov. Server a SQL musia zhodne posudzovať dĺžku Unicode textu vrátane znakov mimo BMP. Dôvod renderovať ako text.

| Stav | Podmienka | Správanie |
| --- | --- | --- |
| Plánovaná | Bez zrušenia, databázový čas pred `starts_at` | Zatiaľ nedostupné prihodenie a zrušenie. |
| Aktívna | Bez zrušenia, `starts_at <= teraz < ends_at` | Vlastník môže zrušiť aj po prijatí ponúk. Ostatné pravidlá úprav a ponúk platia ďalej. |
| Riadne skončená | Bez zrušenia, `teraz >= ends_at` | Oprávnená na workflow Feature 15. |
| Zrušená | `cancelled_at` je vyplnený | Trvalý stav bez prihadzovania, finalizácie a víťaza. Má prednosť pred porovnaním termínu, aj po jeho uplynutí. |

Zrušenie ponechá UUID, pôvodný `ends_at`, URL a QR, údaje aukcie, fotografie a bidy. História naďalej uvádza najvyššiu prijatú sumu bez označenia víťaza.

## 3. Stage A – Databáza, koordinácia a bezpečnosť

- Navrhované RPC `public.cancel_owned_auction(auction_id, reason)` odvodí profil z overeného Clerk `sub`, vyberie vlastný riadok na `FOR UPDATE` a až potom skontroluje stav a čerstvý `clock_timestamp()`. Cudziemu účtu a pri neexistujúcom ID vráti rovnaký kód nedostupnosti. Pod zámkom skontroluje existenciu finalizácie ako obrannú poistku, interval aktivity a dôvod. Jedným UPDATE uloží normalizovaný dôvod, čas a `updated_at`. Opakovanie vráti `already_cancelled` bez zápisu aj po pôvodnom termíne. Návrat obsahuje kód výsledku, bez identít. Anonymný volajúci nemá EXECUTE.
- RPC mutácia prevezme existujúcu architektúru úzko oprávnených funkcií. Pre privilegovanú časť použiť prázdny `search_path`, kvalifikované názvy a explicitne odobrať implicitné EXECUTE. Verejnému RPC udeliť EXECUTE iba `authenticated`; vnútorné privilegované helpery držať mimo vystavených schém podľa potreby. Server Action tiež overí Clerk reláciu a použije používateľský token. Priame UPDATE/DELETE tabuľky zostanú bez grantov. Existujúci tabuľkový INSERT umožňuje zadávať aj nové stĺpce, preto zúžiť grant na povolené stĺpce vytvárania aukcie alebo doplniť INSERT politiku vyžadujúcu obe hodnoty NULL. Pred migráciou overiť všetky aktuálne granty a INSERT cesty.
- `place_bid` ponechá kontrolu existujúceho `request_id` pred blokovaním nového bidu. Rovnaká suma pri opakovaní vráti existujúcu ponuku, iná suma zachová konflikt. Po tejto kontrole vráti pri zrušenej aukcii `cancelled`. Nové ponuky posudzuje podľa čerstvého času po zámku. Ak prvý uspeje bid pred termínom, následné včasné zrušenie ho zachová. Ak prvé uspeje zrušenie, nový bid sa nevloží. Presná rovnosť s `ends_at` už vylučuje nový bid aj zrušenie. [PostgreSQL – riadkové zámky](https://www.postgresql.org/docs/current/explicit-locking.html)
- `start_auction_finalization` skontroluje zrušenie pod tým istým zámkom pred každým zápisom. Ak zrušenie uspelo pred termínom, aj čakajúca finalizácia po termíne skončí bez výsledkov. Ak prvá po termíne začne finalizácia, zrušenie sa odmietne. Výber v `run_auction_finalization_cycle` vylúči zrušené aukcie pred limitom dávky; kontrola v samotnom štarte zostáva autoritatívna. Existujúce rozvrhy Cronu, expirácia už vydaných ponúk a doručovanie existujúceho outboxu sa pre riadne skončené aukcie používajú ďalej. Pre zrušenú aukciu nevznikne finalizácia, kandidát, výsledková ponuka, výsledková udalosť ani outbox riadok.
- `update_owned_active_auction`, `delete_owned_active_auction` a `add_owned_auction_note` odmietnu zrušený stav pod zámkom a overia čerstvý čas. Zachovať existujúce podmienky podľa počtu bidov. Zablokovať v metadátach a Storage politikách zápisy a odstraňovanie pre zrušené aukcie. Skontrolovať aj upload, individuálne odstránenie, úplné vymazanie a kompenzačné čistenie po zlyhaní. Verejné čítanie existujúcich fotografií má fungovať aj po zrušení.
- **Súbeh so Storage.** Implementácia serializuje zmeny referencií fotografií v `change_owned_auction_photos` rovnakým zámkom. Server najprv nahrá objekty pod náhodnými názvami a až potom ich transakčne sprístupní v galérii. Pri odobratí najprv transakčne odstráni referenciu a až potom objekt. Pri vymazaní celej aukcie najprv uspeje SQL vymazanie, až potom fyzické čistenie. Ak zrušenie vyhrá zámok, existujúce referencie zostanú funkčné a odstránenie sa nezačne. Ak zmena referencií vyhrá pred zrušením, zrušenie zachová galériu v stave po tejto zmene. Správa objektov používa existujúce serverové poverenie a obmedzenú RPC dostupnú iba servisnej role. Priame používateľské zápisy do metadát aj objektov sú odobraté. Pri nejednoznačnom výsledku publikovania server ponechá súbory, aby nepokazil prípadne už zverejnené referencie. Neúspešné fyzické čistenie môže zanechať súbor bez referencie.
- `get_public_auction` rozšíriť o čas a dôvod zrušenia pri zachovaní existujúcich polí a `bidder_number`. Zachovať úzku verejnú projekciu bez profilových ID a kontaktov. Overiť zmenu návratového typu a explicitne obnoviť granty pri prípadnom drop/create. Vlastnícke čítanie z tabuľky doplní oba stĺpce; `get_owned_bid_summaries` obsahovo zachová agregáty. `get_my_bid_auctions` vráti `cancelled` pred klasifikáciou podľa termínu a ponechá vlastné historické sumy. Funkcie na čítanie výsledkov nepotrebujú nový výsledkový stav, pretože zrušená aukcia nemá výsledkový workflow.
- Pri prvom prechode z NULL na vyplnené `cancelled_at` publikovať po commite udalosť `auction_cancelled` na existujúcom `auction:{id}:bids` s neutrálnym payloadom `{ changed: true }`. Klient na oba typy udalostí aj úspešné pripojenie načíta autoritatívny detail. Dôvod a údaje účtov neposielať v signáli. [Supabase – Broadcast z databázy](https://supabase.com/docs/guides/realtime/broadcast)

## 4. Stage B – Správa aukcie

Navrhované tlačidlo **Zrušiť aukciu / Cancel auction** je v správe vlastnej aktívnej aukcie bez ohľadu na počet bidov. Zostane vizuálne oddelené od vymazania dostupného pri aktívnej aukcii bez bidov. Použiť existujúce Terra komponenty a vzor natívneho modalu z potvrdenia prihodenia.

| Prvok | SK | EN |
| --- | --- | --- |
| Nadpis | Zrušiť aukciu? | Cancel this auction? |
| Upozornenie | Zrušenie je nevratné. Víťaz nebude vybraný. Existujúce ponuky zostanú zachované. | Cancellation is permanent. No winner will be selected. Existing bids will be kept. |
| Pole | Dôvod zrušenia | Reason for cancellation |
| Pomocný text | Dôvod bude verejný. Neuvádzajte osobné údaje. | The reason will be public. Do not include personal information. |
| Akcie | Späť / Potvrdiť zrušenie | Back / Confirm cancellation |

Povinné viacriadkové pole s limitom, chybou pri prázdnej hodnote a väzbou chyby na pole. Počas odosielania zamedziť duplicitnému odoslaniu a podržať modal; po chybe zachovať dôvod, zobraziť lokalizovanú chybu a obnoviť dostupné akcie. Pred odoslaním funguje Späť aj Escape a fokus sa vráti na spúšťač. Mobilný modal má rolovateľný obsah, dostupné akcie a priestor pre bezpečnú oblasť. Po úspechu zobraziť stav a dôvod v správe. Pri súbežnom zrušení načítať uložený dôvod a stav; pri uplynutí termínu zobraziť aktualizovaný stav aukcie.

## 5. Stage C – Verejný detail a prehľady

- Verejný detail zobrazí **Aukcia zrušená / Auction cancelled** a dôvod, galériu, údaje a históriu vrátane štítkov a indikátora vlastných bidov z Feature 18. Nezobrazuje aktívne odpočítavanie, minimálnu ďalšiu ponuku ani prihadzovanie. Prípadný zobrazený pôvodný termín má výslovné označenie.
- Po Realtime obnovení ukončiť otvorené potvrdenie bidu a oznámiť stav aj pre pomocné technológie. Zastaraný formulár dostane lokalizovaný výsledok `cancelled` zo servera. Doručenie signálu nie je podmienkou správnosti. Obnovenie po reconnecte alebo návšteva URL načíta aktuálny stav.
- **Moje aukcie / My Auctions** a **Moje ponuky / My Bids** zobrazia stav **Zrušené / Cancelled**. Návrh je samostatný filter s počtom v oboch prehľadoch. Filter Všetky zahŕňa zrušené aukcie. Počty v ostatných filtroch ich vylučujú. Súhrn riadne skončených používa samostatný počet. Moje ponuky ponechajú posledný vlastný bid aj prístup na detail bez odpočtu a výzvy na potvrdenie výsledku.
- Správa zrušenej aukcie zobrazí stav, dôvod, galériu, históriu alebo existujúce zhrnutie ponúk a odkaz na zdieľanie. Neponúkne mutácie, ďalšie zrušenie ani panel riadnej finalizácie. Prehľady načítajú aktualizovaný stav pri návšteve; existujúci verejný detail je jediný nový odber udalosti. Aktualizovať dotknuté lokalizované cesty po úspechu podľa existujúceho revalidačného vzoru.

### Mapa dotknutých súborov

| Oblasť | Súbory |
| --- | --- |
| Databáza | Nová migrácia v `supabase/migrations/` nad poslednými definíciami v migráciách pre transactional bidding, location, Feature 15, Feature 18, photo-policy fix a bid broadcast. Testy v `supabase/tests/`. |
| Dátová vrstva a mutácie | `lib/supabase/auctions.ts`, `lib/supabase/auction-photos.ts`, `lib/bid-action-state.ts`, `app/[locale]/my-auctions/[id]/actions.ts`, `app/[locale]/auctions/[id]/actions.ts`. Pri koordinácii čistenia preveriť tiež `app/[locale]/auctions/new/actions.ts`. |
| Detail a správa | `app/[locale]/my-auctions/[id]/page.tsx`, nový komponent modalu pod `components/auctions/`, `app/[locale]/auctions/[id]/page.tsx`, `components/auctions/real-auction-detail.tsx`, `live-bidding-panel.tsx`, `auction-realtime-refresh.tsx` a podľa potreby `local-auction-end-time.tsx` v tom istom priečinku. Overiť existujúcu cestu `app/[locale]/my-auctions/[id]/share/page.tsx`. |
| Prehľady a texty | `components/auctions/my-auctions-dashboard.tsx`, `owned-auction-card.tsx`, `my-bids-dashboard.tsx` v rovnakom priečinku a `messages/sk.json`, `messages/en.json`. |

## 6. Stage D – Verifikácia a akceptácia

| Automatizovaný scenár | Očakávaný výsledok |
| --- | --- |
| Zrušenie bez bidov a s bidmi | Vlastník môže zrušiť oba prípady. Uloží sa čas a orezaný dôvod. Termín, fotky a história ostanú zachované. |
| Neplatné vstupy a oprávnenia | Prázdny, iba biely alebo príliš dlhý dôvod, cudzí účet, anonymný RPC a pokus nastaviť stĺpce priamym INSERT/UPDATE sa odmietnu bez vedľajších účinkov. Otestovať aj slovenský text a hranicu limitu. |
| Čas a opakovanie | Pred začiatkom a pri alebo po termíne sa zrušenie odmietne. Opakovaný či súbežný dvojitý pokus nezmení pôvodný dôvod ani čas. |
| Prihodenie po zrušení | Nový request sa odmietne. Rovnaký už prijatý request sa prehrá a odlišná suma s tým istým UUID skončí konfliktom. |
| Súbeh bidu a zrušenia | Dve databázové spojenia, obe poradia získania zámku. Otestovať aj začiatok pred termínom s čakaním za termínom. |
| Súbeh finalizácie a zrušenia | Dve spojenia okolo `ends_at`. Po včasnom zrušení čakajúca finalizácia nič nezaloží. Ak finalizácia získa zámok po termíne ako prvá, zrušenie sa odmietne a workflow vznikne raz. |
| Cron po termíne | Zrušená aukcia nevstúpi do dávky a nevytvorí výsledkové riadky ani pri priamom internom štarte. Riadne skončená aukcia sa spracuje aj v dávke s vysokým počtom zrušených aukcií. |
| Úpravy, galéria a vymazanie | Stará požiadavka po zrušení nezmení stav ani Storage. Overiť obe poradia súbehu, nedokončené čistenie a retry bez straty fotografie v už zrušenej aukcii. |
| Čítania a UI | Verejná odpoveď zachová čísla a históriu, bez súkromných údajov. Stav pretrvá po termíne. Overiť filtre, súhrny, SK/EN, URL/QR, prístupnosť modalu, otvorený bid modal a Realtime vrátane reconnectu. |

Databázové regresie pridať k existujúcim pgTAP testom. Súbehy overiť oddelenými PostgreSQL spojeniami so synchronizáciou cez zámky. Pred akceptáciou spustiť aj existujúce testy Feature 15, lint, TypeScript, build a kontrolu parity katalógov.

### Jeden manuálny blok po implementácii

1. Priprav aktívnu skúšobnú aukciu s jednou prijatou ponukou. V okne A otvor správu ako vlastník. V okne B otvor verejný detail ako prihadzujúci.
2. V okne A otvor **Zrušiť aukciu**. Skús potvrdiť prázdny dôvod. Over chybové hlásenie a že v okne B je aukcia stále aktívna.
3. V okne A zadaj dôvod bez osobných údajov a potvrď. Over stav a dôvod v správe.
4. V okne B bez ručného obnovenia over **Aukcia zrušená**, presný dôvod, zachovanú ponuku s číslom dražiteľa a dostupné fotografie. Over, že odpočet a prihadzovanie zmizli. Obnov pôvodný odkaz a skontroluj, že stav, dôvod a história zostali.

## 7. Otvorené rozhodnutia a poradie práce

- Schválený limit je 500 znakov a zrušené aukcie majú samostatný filter. Pred nasadením koordinovať migráciu s vydaním aplikácie, pretože starý kód používa priame Storage zápisy a nový vyžaduje nové RPC. Overiť existujúci serverový `SUPABASE_SECRET_KEY` aj pre bežné foto operácie.
- Samostatné e-mailové upozornenie je otvorené. Zobrazenie iba v aplikácii je jednoduchšie a bez doručovacích nákladov, účastník sa však o zrušení dozvie až pri návšteve. Samostatný e-mail raz každému unikátnemu prihadzujúcemu by informoval aj neprítomných, vyžaduje však schválenie príjemcov, obsahu a retry pravidiel. Zatiaľ sa plánuje iba stav v aplikácii.
- Pred budúcim nasadením zosúladiť evidenciu migrácií Feature 18 s hostovanou schémou. Tracker uvádza ručné použitie SQL bez záznamu v CLI histórii. Overiť kompatibilitu starého a nového klienta pred sprístupnením mutácie, najmä status `cancelled` v My Bids a pri neobnovenom formulári na prihadzovanie.
- Hostované overenie, aplikovanie migrácie a nasadenie patria do následného schváleného kroku.
