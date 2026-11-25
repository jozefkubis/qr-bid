# Feature 18 – Označenie prihadzujúcich v histórii ponúk

## Cieľ

Na verejnom detaile aukcie sa dá rozoznať, ktoré ponuky prišli
z rovnakého účtu. Prihlásený prihadzujúci si medzi viacerými
ponukami rýchlo nájde vlastné riadky podľa svojho avatara.

## Čo uvidí používateľ

- Prvý účet, ktorý úspešne prihodí, dostane označenie
  „Prihadzujúci 1“. Každý ďalší nový účet dostane ďalšie číslo.
- Všetky ponuky z jedného účtu majú v danej aukcii rovnaké číslo.
  Číslovanie sa v každej aukcii začína od 1. Označenie je rovnaké
  pre prihlásených aj odhlásených návštevníkov a platí aj
  pre historické ponuky.
- Pri vlastných ponukách prihlásený používateľ vidí svoj malý Clerk
  avatar vedľa označenia a jemné zelené pozadie riadka. Ak profilová
  fotka chýba alebo sa nenačíta, zobrazí sa štítok „Vy“.
  Čítačka obrazovky oznámi vlastnú ponuku aj pri zobrazenom avatare.
- Majiteľ aukcie aj ostatní návštevníci vidia pri cudzích ponukách
  iba označenie prihadzujúceho, sumu a čas. Profilová fotka,
  meno, e-mail, Clerk ID ani interné ID účtu sa verejne nesprístupňujú.
- Anglické označenia sú „Bidder 1“, „Bidder 2“ a „You“.
  Zachovaj existujúce označenie najvyššej ponuky.

## Rozsah implementácie

Uprav verejný detail reálnej aukcie. Použi existujúcu históriu
ponúk, Clerk a Realtime. Ostatné obrazovky vrátane Moje ponuky
a správy aukcie sú mimo rozsahu.

1. V novej Supabase migrácii rozšír položky histórie vo výstupe
   `get_public_auction` o `bidder_number`. Odvoď číslo v databáze
   z poradia prvých prijatých ponúk účtov v danej aukcii.
   Použi jednoznačné poradie aj pri zhodnom čase. Čísla odvoď
   z celej histórie pred prípadným obmedzením zobrazených riadkov.
2. Na serveri zisti číslo prihlasujúceho sa účtu pre danú aukciu
   podľa overenej Clerk identity. Prihlasovacie údaje ani ID
   prihadzujúceho neprijímaj od klienta. Ak použiješ samostatnú
   databázovú funkciu, jej výstup obsahuje iba vlastné číslo
   a funkcia je dostupná iba autentifikovanému volajúcemu.
3. Do zobrazenia histórie pridaj lokalizované označenia.
   Vlastné riadky rozpoznaj podľa čísla vráteného pre aktuálny
   účet. Avatar ber iba z vlastnej relácie. Personalizované
   údaje drž mimo verejnej odpovede aj zdieľanej cache.
4. Zachovaj existujúce obnovovanie histórie cez Realtime.
   Over, že používateľ uvidí avatar pri vlastnom riadku už
   po svojom prvom úspešnom prihodení. Pravidlá prihadzovania,
   oprávnenia tabuľky `bids` a finalizácia aukcie ostávajú
   mimo rozsahu.

## Akceptácia – jeden manuálny blok

1. Otvor skúšobnú aukciu cez účty A a B a v odhlásenom okne.
   Na mobile alebo v DevTools nastav šírku 320 px.
2. Prihoď v poradí A → B → A. V histórii od najnovšej ponuky
   uvidíš 1 → 2 → 1. Over, že sa história v ostatných oknách
   aktualizuje bez ručného obnovenia.
3. Účet A vidí svoj avatar alebo „Vy“ iba pri riadkoch 1.
   Účet B ich vidí iba pri riadku 2. Odhlásený návštevník
   vidí iba čísla. Suma, čas a označenie sa na 320 px
   zobrazia bez vodorovného posuvu.
4. Prepni jazyk na EN a over označenia. Obnov stránku a skontroluj,
   že čísla zostali rovnaké. Otvor staršiu skúšobnú aukciu
   s ponukami a over, že aj jej história má označenia.

## Zadanie pre Codex

Pracuj v `C:\Users\kubis\Desktop\qr-bid`. Prečítaj `AGENTS.md`
a projektový kontext v predpísanom poradí. Skontroluj `git status`,
zachovaj rozpracované zmeny a implementuj iba rozsah Feature 18.

Over verejný výstup `get_public_auction` aj ako odhlásený
volajúci. Skontroluj stabilné čísla, staršie ponuky, aukciu
bez ponúk a oddelenie údajov medzi dvoma prihlásenými účtami.
Spusti relevantný ESLint, kontrolu TypeScriptu alebo build
a `git diff --check`. Zapíš skutočný stav do progress trackera
a daj Jožkovi iba jeden manuálny testovací blok v slovenčine.

Commit, push a aplikovanie migrácie na hostovanom Supabase
urob až po výslovnom pokyne.