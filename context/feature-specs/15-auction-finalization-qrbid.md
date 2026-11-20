# Feature 15 – Ukončenie aukcie a potvrdenie výsledku

**Stav:** Návrh na produktovú a technickú kontrolu  
**Rozsah tohto kroku:** Iba špecifikácia, dátový model a pravidlá prechodov. Bez implementácie, migrácie, nasadenia alebo odoslania e-mailu.

## 1. Cieľ

Po pevnom termíne aukcie QRBid vytvorí poradie účastníkov a postupne osloví vždy jedného záujemcu. Každý účet je v poradí najviac raz, so svojou najvyššou platnou ponukou. Aktívny záujemca má 48 hodín od sprístupnenia ponuky v **Mojich ponukách** na potvrdenie alebo odmietnutie.

Potvrdenie záujmu nie je dokončenie predaja. Po potvrdení sa vlastník a záujemca dohodnú mimo platobného systému QRBid. Vlastník neskôr samostatne označí predaj ako dokončený alebo po odstúpení potvrdeného záujemcu pokračuje ďalším účastníkom.

## 2. Schválené produktové pravidlá

- Aukcia sa končí v pevnom `ends_at`; posledná ponuka termín neposúva.
- Poradie obsahuje jedného kandidáta na účet a jeho najvyššiu prijatú ponuku.
- Ponuky sa sprístupňujú postupne od najvyššej sumy.
- Naraz môže byť pre aukciu aktívna najviac jedna ponuka na potvrdenie.
- Každá aktívna ponuka má 48 hodín od databázového `issued_at`. `expires_at = issued_at + interval '48 hours'`.
- Rovnaký presný termín sa zobrazuje v aplikácii aj v e-maile.
- Neúspešné odoslanie e-mailu sa opakuje, ale nemení `issued_at` ani `expires_at`.
- Odmietnutie alebo vypršanie lehoty atomicky uzavrie aktuálnu ponuku a sprístupní ďalšiu.
- Potvrdenie záujmu a dokončenie predaja sú dve rozdielne udalosti.
- Po potvrdení záujmu dostanú vlastník aj aktuálny potvrdený záujemca e-mail s výsledkom, ďalším postupom a odkazom do príslušnej chránenej časti QRBid.
- V chránenej časti si aktuálna potvrdená dvojica navzájom zobrazí meno a overený e-mail. Telefón sa v MVP nezdieľa.
- Kontakty sa nesprístupnia pred potvrdením. Po zaznamenanom odstúpení sa prístup bývalej dvojice k vzájomným kontaktom odoberie; nový kandidát ich získa až po vlastnom potvrdení.
- Po odstúpení potvrdeného záujemcu môže iba vlastník zvoliť **Pokračovať ďalším záujemcom**.
- Bez prijatých ponúk alebo po vyčerpaní poradia sa workflow uzavrie bez potvrdeného záujemcu a vlastník dostane e-mail.
- QRBid v tomto feature nespracúva platbu ani automatický právny prevod predmetu aukcie.
- **Potvrdiť záujem** znamená súhlas záujemcu, aby ho vlastník kontaktoval na overenom e-maile a aby strany mohli pokračovať v priamej dohode. Nejde o platbu, automatické dokončenie predaja ani automatické uzavretie kúpnej zmluvy v QRBid.
- Po sprístupnení overeného e-mailu môže vlastník záujemcu kontaktovať mimo QRBid a vo vlastnej správe mu dobrovoľne poskytnúť svoje telefónne číslo. QRBid telefón systémovo nezobrazuje ani nevkladá do výsledkového e-mailu.

## 3. Terminológia

- **Kandidát:** jeden unikátny účastník v zmrazenom poradí aukcie.
- **Ponuka na potvrdenie:** časovo obmedzená výzva pre jedného kandidáta, nie pôvodný bid.
- **Potvrdený záujem:** kandidát včas potvrdil, že chce pokračovať.
- **Dokončený predaj:** vlastník samostatne potvrdil výsledok po dohode so záujemcom.
- **Finalizácia:** databázový workflow od skončenia prihadzovania po dokončený predaj alebo vyčerpanie poradia.

## 4. Navrhované stavy

### 4.1 Stav finalizácie aukcie

`auction_finalizations.status`:

| Stav | Význam | Povolený ďalší stav |
| --- | --- | --- |
| `awaiting_response` | Jeden kandidát má aktívnu 48-hodinovú ponuku. | `interest_confirmed`, `exhausted` alebo znovu `awaiting_response` s ďalším kandidátom. |
| `interest_confirmed` | Kandidát potvrdil záujem; predaj ešte nie je dokončený. | `sale_completed` alebo po vlastníkovej voľbe znovu `awaiting_response`/`exhausted`. |
| `sale_completed` | Vlastník označil predaj ako dokončený. Terminálny stav. | Žiadny. |
| `no_bids` | Aukcia nemala žiadnu prijatú ponuku. Terminálny stav. | Žiadny. |
| `exhausted` | Všetci kandidáti odmietli, expirovali alebo už boli použití. Terminálny stav. | Žiadny bez budúceho explicitne schváleného reopen pravidla. |

Zrušená aukcia zostáva samostatný lifecycle stav podľa END-002/003 a finalizačný workflow sa pre ňu nevytvorí.

### 4.2 Stav jednotlivej ponuky na potvrdenie

`auction_result_offers.status`:

| Stav | Význam |
| --- | --- |
| `active` | Ponuka je dostupná a pred `expires_at` ju možno potvrdiť alebo odmietnuť. |
| `accepted` | Kandidát včas potvrdil záujem. |
| `declined` | Kandidát ponuku výslovne odmietol. |
| `expired` | Kandidát do presného termínu neodpovedal. |
| `withdrawn` | Kandidát po potvrdení odstúpil a vlastník pokračoval ďalej. |

Pri `statement_timestamp() >= expires_at` už potvrdenie ani odmietnutie nie je platné; transakcia najprv označí ponuku ako `expired` a pokúsi sa vytvoriť ďalšiu.

## 5. Navrhovaný dátový model

Názvy sú návrh; migrácia sa vytvorí až po schválení.

### 5.1 `auction_finalizations`

- `auction_id uuid primary key references public.auctions(id) on delete restrict`
- `status text not null` s kontrolou povolených stavov
- `confirmed_offer_id uuid null` – referencia na aktuálne potvrdenú ponuku
- `started_at timestamptz not null default statement_timestamp()`
- `interest_confirmed_at timestamptz null`
- `sale_completed_at timestamptz null`
- `closed_at timestamptz null`
- `created_at`, `updated_at timestamptz not null`

Jeden riadok na aukciu zaručuje jeden autoritatívny workflow a poskytuje riadok na `FOR UPDATE` zámok.

### 5.2 `auction_result_candidates`

Nemenný snapshot poradia vytvorený po `ends_at`:

- `id uuid primary key`
- `auction_id uuid not null`
- `bidder_id uuid not null`
- `rank integer not null check (rank > 0)`
- `amount_minor bigint not null`
- `source_bid_id uuid not null` – konkrétna najvyššia prijatá ponuka účtu
- `created_at timestamptz not null`
- `unique (auction_id, bidder_id)` – účet je v poradí raz
- `unique (auction_id, rank)` – poradie je jednoznačné

Poradie vznikne z najvyššej prijatej ponuky každého `bidder_id`, následne zostupne podľa `amount_minor`. Existujúce transakčné prihadzovanie vyžaduje každú novú globálne najvyššiu ponuku aspoň o minimálny príhoz vyššiu, takže platné sumy sa dnes nemôžu rovnať. Napriek tomu bude dotaz deterministický aj s pomocným poradím podľa `source_bid_id`.

### 5.3 `auction_result_offers`

- `id uuid primary key`
- `auction_id uuid not null`
- `candidate_id uuid not null unique` – kandidát môže byť oslovený iba raz
- `status text not null`
- `issued_at timestamptz not null`
- `expires_at timestamptz not null`
- `accepted_at`, `declined_at`, `expired_at`, `withdrawn_at timestamptz null`
- `created_at`, `updated_at timestamptz not null`
- kontrola `expires_at = issued_at + interval '48 hours'`
- kontroly, že stav a príslušný časový údaj si neprotirečia

Kľúčová databázová poistka:

```sql
create unique index auction_result_offers_one_active_per_auction_idx
on public.auction_result_offers (auction_id)
where status = 'active';
```

Čiastočný unikátny index je posledná ochrana proti dvom aktívnym ponukám aj pri chybe aplikačnej logiky alebo súbehu workerov.

### 5.4 `auction_finalization_events`

Nemenný audit udalostí:

- `id uuid primary key`
- `auction_id uuid not null`
- `offer_id uuid null`
- `event_type text not null`
- `actor_profile_id uuid null` – `null` pri systémovej udalosti
- `occurred_at timestamptz not null default statement_timestamp()`
- malé `metadata jsonb not null default '{}'` bez kontaktov a tajomstiev

Typy udalostí: `finalization_started`, `no_bids`, `offer_issued`, `offer_declined`, `offer_expired`, `interest_confirmed`, `confirmed_bidder_withdrew`, `next_candidate_requested`, `sale_completed`, `ranking_exhausted`.

Tento log explicitne oddeľuje `interest_confirmed` od `sale_completed` a zachová históriu opakovaného pokračovania.

### 5.5 `notification_outbox`

Trvácna fronta pre e-maily vytvorená v rovnakej databázovej transakcii ako doménová udalosť:

- `id uuid primary key`
- `event_id uuid not null`
- `recipient_profile_id uuid not null`
- `notification_type text not null`
- `locale text not null check (locale in ('en', 'sk'))`
- `status text not null` – `pending`, `processing`, `retry`, `sent`, `permanent_failure`
- `attempt_count integer not null default 0`
- `next_attempt_at timestamptz not null`
- `provider_message_id text null`
- `sent_at timestamptz null`
- `last_error_code text null`, `last_error_at timestamptz null`
- `created_at`, `updated_at timestamptz not null`
- `unique (event_id, recipient_profile_id, notification_type)` pre idempotenciu

Outbox neobsahuje Resend API kľúč. API kľúč zostane iba v serverovom runtime. E-mailový worker načíta pripravené joby, odošle ich cez Resend a bezpečne zapíše výsledok. Opakovanie jobu nikdy nevytvorí novú ponuku ani nový 48-hodinový termín.

E-mailová adresa sa pre konkrétne odoslanie načíta serverovo z Clerk a neukladá sa do event metadata. Schválený profilový návrh doplní do súkromného QRBid profilu zobrazované meno a `preferred_locale`. Meno sa prevezme zo serverovo overeného Clerk profilu a spolu s aktívnou podporovanou locale sa bezpečne synchronizuje pri používateľovej interakcii. Ak preferovaný jazyk ešte nie je uložený, použije sa `en`. Dnešný `qrbid_locale` cookie ostáva klientskou preferenciou, ale sám osebe nie je dostupný background workeru. Telefón sa pre Feature 15 nesynchronizuje ani nezdieľa.

## 6. Transakcie a ochrana proti súbehu

### 6.1 Spustenie finalizácie

Interná idempotentná databázová funkcia:

1. Vyberie skončenú nezrušenú aukciu a zamkne ju `FOR UPDATE`.
2. Ak finalizácia už existuje, bezpečne skončí bez duplikácie.
3. V jednej transakcii vytvorí finalizáciu a snapshot kandidátov.
4. Bez kandidátov nastaví `no_bids`, zapíše event a e-mail pre vlastníka.
5. Inak vytvorí ponuku pre rank 1, nastaví `issued_at` a `expires_at`, zapíše event a outbox job.

### 6.2 Potvrdenie alebo odmietnutie kandidátom

Autentifikované RPC odvodí profil iba z overeného Clerk JWT `sub`; klient neposiela `bidder_id`.

1. Zamkne `auction_finalizations` a aktívnu ponuku `FOR UPDATE`.
2. Overí, že ponuka patrí volajúcemu a finalizácia je `awaiting_response`.
3. Až po získaní zámkov načíta nový databázový `statement_timestamp()` a porovná ho s `expires_at`; nepoužije čas z requestu ani čas načítaný pred čakaním na zámok.
4. Pri včasnom potvrdení atomicky nastaví ponuku `accepted`, finalizáciu `interest_confirmed`, zapíše event a dva outbox joby.
5. Pri odmietnutí alebo už uplynutej lehote uzavrie aktuálnu ponuku a v tej istej transakcii vytvorí ponuku pre ďalší nepoužitý rank; ak ďalší nie je, nastaví `exhausted`.

### 6.3 Automatická expirácia

Plánovaný interný worker vyberie aktívne ponuky s `expires_at <= statement_timestamp()` a pre každú zavolá rovnakú internú prechodovú funkciu ako oneskorená používateľská odpoveď.

Pri súbehu kliknutia a workeru nerozhoduje čas príchodu HTTP requestu ani poradie začatia transakcií. Každá cesta najprv získa zámok finalizácie a aktívnej ponuky a až potom vyhodnotí aktuálny databázový čas a znovu načítaný stav. Ak je po získaní zámku `statement_timestamp() >= expires_at`, ponuka expirovala aj vtedy, keď kliknutie prišlo tesne pred termínom. Pri čase presne rovnajúcom sa `expires_at` vždy vyhrá expirácia. Druhá transakcia po získaní zámku uvidí už uzavretý stav a neurobí duplicitný prechod.

### 6.4 Odstúpenie po potvrdení

Iba vlastník môže v stave `interest_confirmed` spustiť **Pokračovať ďalším záujemcom**. Transakcia:

1. zamkne finalizáciu,
2. označí potvrdenú ponuku ako `withdrawn`,
3. zruší `confirmed_offer_id`,
4. zapíše auditné udalosti,
5. vytvorí ponuku pre ďalší rank alebo nastaví `exhausted`.

Týmto prechodom okamžite zanikne oprávnenie bývalého kandidáta čítať kontakt vlastníka a oprávnenie vlastníka čítať kontakt bývalého kandidáta cez výsledkové RPC. Audit uchová iba identifikátory a udalosti, nie kontaktný snapshot. Ďalší kandidát dostane svoju vlastnú sumu, nové `issued_at` a nový 48-hodinový termín; kontakt vlastníka neuvidí, kým sám nepotvrdí záujem.

### 6.5 Dokončenie predaja

Iba vlastník môže v stave `interest_confirmed` označiť `sale_completed`. Táto udalosť nemení pôvodné bidy a nie je automaticky odvodená z potvrdenia záujemcu.

## 7. Oprávnenia a bezpečnostné hranice

- Na všetkých nových tabuľkách bude zapnuté RLS; priame práva `anon` a `authenticated` budú odobraté.
- Stav sa bude čítať a meniť iba cez úzko zamerané RPC s minimálnym návratovým tvarom.
- Kandidát vidí iba vlastnú aktívnu alebo historickú ponuku, termín a svoju sumu; nevidí poradie ani kontakty iných účastníkov.
- Pred potvrdením nevidí kandidát kontakt vlastníka a vlastník nevidí kontakt osloveného kandidáta.
- Po `interest_confirmed` samostatné serverovo autorizované výsledkové RPC sprístupní iba meno a overený e-mail druhej strany, a to iba vlastníkovi danej aukcie a kandidátovi z aktuálneho `confirmed_offer_id`. Telefón sa nevracia.
- Po `withdrawn` už bývalá dvojica cez toto RPC vzájomné kontakty nedostane. Nový kandidát získa kontakt až po svojom `interest_confirmed`. Pri `sale_completed` zostáva potvrdená dvojica rovnaká a prístup ku kontaktom sa zachová.
- RPC pri každom čítaní odvodí volajúci profil z overeného Clerk JWT `sub` a neakceptuje klientom dodanú identitu druhej strany.
- Verejný detail nevracia kandidátov, ponuky na potvrdenie, profily ani kontakty.
- `SECURITY DEFINER` sa použije iba tam, kde funkcia musí bezpečne čítať súkromné bidy; každá taká funkcia bude mať `set search_path = ''`, plne kvalifikované názvy, explicitné kontroly identity a odobraté `PUBLIC` execute právo.
- Interné worker funkcie nebudú dostupné `anon` ani `authenticated`.
- Resend API kľúč nesmie byť v SQL migrácii, databázovej tabuľke, klientskom bundle ani `NEXT_PUBLIC_*` premennej.
- Nové tabuľky sa nebudú automaticky vystavovať Data API. Prístup sa udelí explicitne iba potrebným RPC.

## 8. Automatizácia a spoľahlivosť

Pracovný MVP variant bez novej mikro služby:

1. databázový scheduler pravidelne spustí idempotentné vytvorenie finalizácií a expiráciu ponúk,
2. serverový worker spracuje `notification_outbox` cez Resend,
3. retry používa rastúci odstup a stabilný idempotency identifikátor,
4. zlyhanie alebo bounce e-mailu nemení doménový stav ani deadline,
5. monitoring sleduje staré `pending/retry` joby a permanentné zlyhania.

Navrhovaný scheduler je Supabase Cron približne raz za minútu. Jeden SQL job spustí interné idempotentné databázové funkcie pre nové ukončenia a expirácie. Druhý krok cez `pg_net` zavolá chránený interný endpoint existujúcej QRBid aplikácie, ktorý spracuje outbox cez Resend. Endpoint prijme iba požiadavku s osobitným náhodným worker secretom; tento secret bude uložený v Supabase Vault a zároveň ako serverová premenná QRBid, nikdy v migrácii, klientovi ani v Resend payload. Nepoužije sa publishable key ani Resend API key ako autentizačný token endpointu.

Worker v krátkej databázovej transakcii atomicky rezervuje pripravené joby pomocou zámku a `SKIP LOCKED`, zvýši počet pokusov a až potom odošle správu. Viaceré spustenia tak nespracujú rovnaký job súčasne. Resend volanie používa stabilný idempotency kľúč odvodený z ID outbox jobu. Pri dočasnej chybe sa naplánujú retry po 1, 5 a 30 minútach. Po poslednom dočasnom neúspechu alebo pri trvalej chybe príjemcu sa job označí `permanent_failure`, uloží sa bezpečný kód chyby a vznikne monitorovateľné upozornenie; ponuka však zostáva dostupná v aplikácii a jej deadline sa nemení. Ak dovtedy expiruje, databázový workflow pokračuje ďalším kandidátom nezávisle od stavu e-mailu. Oneskorený retry už uzavretej výzvy nesmie odoslať akčný e-mail; worker pred odoslaním znovu overí, že príslušná ponuka je stále `active`, inak job uzavrie ako neaktuálny.

## 9. E-mailové udalosti

| Doménová udalosť | Príjemca | Obsah |
| --- | --- | --- |
| `offer_issued` | Aktívny kandidát | Aukcia, vlastná ponúknutá suma, presný `expires_at`, tlačidlo do Mojich ponúk. |
| `interest_confirmed` | Kandidát | Potvrdenie prijatia odpovede, ďalší postup a odkaz do chránenej časti s menom a e-mailom vlastníka. |
| `interest_confirmed` | Vlastník | Výsledok, ďalší postup a odkaz do chránenej správy aukcie s menom a e-mailom aktuálne potvrdeného záujemcu. |
| `no_bids` | Vlastník | Aukcia skončila bez ponúk. |
| `ranking_exhausted` | Vlastník | Poradie sa vyčerpalo bez potvrdeného záujemcu. |
| `sale_completed` | Kandidát a vlastník | Potvrdenie evidovaného dokončenia predaja a odkaz na príslušnú chránenú časť QRBid. |

Odmietnutie a jednotlivá expirácia nemusia samostatne zahlcovať vlastníka; ďalší kandidát dostane svoju výzvu a vlastník dostane správu pri potvrdení alebo vyčerpaní. Toto je odporúčanie na schválenie.

Všetky systémové texty budú EN/SK podľa uloženého jazyka príjemcu; pri chýbajúcej preferencii sa použije angličtina. Názov aukcie a iný používateľský obsah sa neprekladajú. Schválený produkčný odosielateľ je `QRBid <aukcie@mail.getqrbid.com>`; skúšobné odoslanie z tejto adresy cez Resend už podľa produktového vlastníka prešlo.

Výsledkový e-mail vysvetlí, že potvrdenie otvorilo kontakt a ďalšiu dohodu medzi stranami. Telefónne číslo nebude obsahovať. Vlastník môže po otvorení chránenej časti napísať záujemcovi na zobrazený overený e-mail a vo vlastnej správe mu poskytnúť svoje číslo.

## 10. UI rozsah budúcej implementácie

### Moje ponuky

- stav čakania, presná vlastná suma a presný termín s časovým pásmom,
- tlačidlá **Potvrdiť záujem** a **Odmietnuť** iba pri aktívnej ponuke,
- jasný stav po potvrdení, odmietnutí alebo expirácii,
- po potvrdení meno a e-mail vlastníka; po vlastníkovej evidencii odstúpenia sa tento kontakt už nezobrazuje,
- žiadne poradie ani údaje iných záujemcov.

### Správa aukcie

- stav finalizácie,
- meno a e-mail aktuálne potvrdeného záujemcu; pred potvrdením ani po evidovanom odstúpení sa kontakt kandidáta nezobrazuje,
- samostatné **Označiť predaj ako dokončený**,
- samostatné **Pokračovať ďalším záujemcom** po odstúpení,
- terminálne stavy bez ponúk a vyčerpané poradie.

### Verejný detail

- iba neosobný stav skončenej aukcie; bez identity, poradia alebo kontaktov kandidátov.

## 11. Schválené implementačné rozhodnutia

1. **Scheduler a worker:** Supabase Cron približne raz za minútu spustí interné idempotentné SQL prechody a chránené volanie QRBid outbox endpointu cez osobitný secret v Supabase Vault.
2. **Retry a permanentná chyba:** Dočasné chyby sa opakujú po 1, 5 a 30 minútach s rovnakým idempotency kľúčom. Trvalá chyba skončí v `permanent_failure`; pred odoslaním sa vždy overí aktuálnosť ponuky.
3. **E-mail pri dokončení:** `sale_completed` sa zaznamená v aplikácii a odošle samostatný výsledkový e-mail vlastníkovi aj potvrdenému záujemcovi.
4. **Odstúpenie:** V MVP odstúpenie eviduje iba vlastník tlačidlom **Pokračovať ďalším záujemcom**. Kandidát nemá samostatnú systémovú akciu na odstúpenie; oznámi ho vlastníkovi priamym kontaktom.
5. **Odosielateľ:** Produkčný From je `QRBid <aukcie@mail.getqrbid.com>`. V MVP sa nenastavuje dynamický Reply-To na používateľský kontakt; obe strany otvoria chránenú časť QRBid a použijú tam sprístupnený overený e-mail.

Schválené sú aj význam **Potvrdiť záujem**, zdroj mena a uloženie jazyka, kontakty po potvrdení, odobratie prístupu po odstúpení, 48 hodín od sprístupnenia v aplikácii, jeden účet/jedna najvyššia suma a uzavretie `no_bids`/`exhausted` novou aukciou pre ďalší pokus. Dokumentačný review gate je uzavretý.

## 12. Budúce implementačné kroky po schválení

1. Schváliť otvorené rozhodnutia a synchronizovať `architecture-context.md` a UI kontext.
2. Vytvoriť jednu kontrolovanú migráciu cez Supabase CLI až po návrhu a databázových testoch.
3. Implementovať a testovať transakčné RPC vrátane súbehu odpovede a expirácie.
4. Implementovať súkromné bidder/owner čítania a EN/SK UI.
5. Pridať Resend serverovú vrstvu, šablóny, outbox worker a retry.
6. Nasadiť až po review gate; potom overiť databázové advisories, oprávnenia, scheduler, reálne e-maily a celý viacúčtový acceptance flow.

## 13. Akceptačné scenáre budúcej implementácie

- Aukcia bez bidov skončí `no_bids` a vlastník dostane jeden idempotentný e-mail.
- Viac bidov jedného účtu vytvorí jedného kandidáta s jeho najvyššou sumou.
- Rank 1 vidí jednu aktívnu ponuku s presným 48-hodinovým termínom.
- Zlyhanie prvého e-mailu vytvorí retry bez zmeny termínu.
- Včasné potvrdenie vytvorí `interest_confirmed`; samostatné dokončenie až `sale_completed`.
- Odmietnutie sprístupní rank 2 za jeho vlastnú najvyššiu sumu.
- Expirácia sprístupní ďalšieho kandidáta práve raz.
- Súbežné potvrdenie a expirácia nikdy nevytvoria dva platné výsledky ani dve aktívne ponuky.
- Kliknutie spracované po získaní zámku pri databázovom čase presne `expires_at` alebo neskôr skončí expiráciou; nevznikne `interest_confirmed`.
- Kliknutie aj expiračný worker čakajúce na ten istý zámok po jeho získaní znovu vyhodnotia stav a databázový čas; najviac jeden vykoná prechod a čiastočný unikátny index stále nedovolí dve `active` ponuky.
- Pred potvrdením vlastník ani kandidát nevidia meno alebo e-mail druhej strany.
- Po potvrdení vidí iba vlastník a aktuálny potvrdený kandidát navzájom svoje meno a e-mail; telefón, poradie a kontakty iných účtov zostanú skryté.
- Po evidovanom odstúpení bývalý kandidát už nevidí kontakt vlastníka a vlastník už cez výsledkové RPC nevidí kontakt bývalého kandidáta. Nový kandidát neuvidí kontakt vlastníka pred vlastným potvrdením.
- Vlastník po odstúpení pokračuje ďalším nepoužitým kandidátom.
- Po vyčerpaní poradia vznikne `exhausted` a jeden e-mail vlastníkovi.
- Cudzí používateľ, anonymný používateľ ani klientom podvrhnuté ID nezíska stav alebo kontakty iného kandidáta.
- EN/SK aplikácia a e-mail zobrazia rovnaký deadline a správne časové pásmo.

## 14. Review gate

Produktový vlastník schválil dátový model, stavy, kontaktné pravidlá, deadline, automatizačný variant, retry, e-mailové udalosti a produkčného odosielateľa 20. novembra 2026. Špecifikácia je pripravená na samostatný implementačný krok. Toto schválenie nemení požiadavku postupovať inkrementálne, overiť migráciu a bezpečnostné hranice pred nasadením a nevykonať commit, push alebo hosted zmenu bez príslušného pokynu.
