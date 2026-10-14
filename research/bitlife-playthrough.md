# BitLife playthrough research (observed in Google Play Games on PC, 2026-10-14)

Purpose: observe mechanics, menu structure, prices, salaries, odds and stat deltas of the reference game so Plotline can mirror its *balance* and *feature set*. All descriptions below are paraphrased in our own words; no game text, art or code is copied.

Setup note: BitLife runs inside Google Play Games on PC (process crosvm), not BlueStacks. Driven via computer-use screenshots and clicks.

## 1. Main screen anatomy and New Life flow

(filled in as observed)

## 2. Menus and submenus

## 3. Yearly flow and sample events

## 4. Numbers for balance

## 5. Death / ribbons / legacy / Surrender / Time machine / God mode

## 6. Plotline gap list and balance diff

### 1.1 Main screen (observed, life 1, age 0)

Layout top to bottom (portrait phone layout):
- **Top bar**: hamburger (main menu) | game logo | a "fast-forward"-style counter showing `0` with a countdown (`12h26m`) — looks like a daily time-limited currency/reward | a yellow "Become a Bitizen" button (premium upsell).
- **Character card**: avatar (age-stage emoji), country flag + full name (blue link, with an (i) info icon) + life-stage label ("Infant"); right side shows `$0` and "Bank Balance".
- **Diary / log**: scrollable text log per age. "Age: N years" header, then one line per event. Birth entry includes: born as female in <city>, <country>; a flavour line about conception; birthday date + zodiac sign; own name; mother (name, job, age); father (name, job, age); family pet (dog named X).
- **Two small banners** above the tabs: left "BitLife Community…", right "Get Movie Director" (store upsell).
- **Bottom tab bar** (5): [Life-stage/occupation tab: "Infant" now, becomes School/Job later] | Assets | big green **+ Age** button | Relationships | Activities.
- **Stat bars** (4, each with emoji + % label, green bar; red bar + warning triangle when low): Happiness, Health, Smarts, Looks.
- Below the stats: an ad banner (web ad, Hebrew locale). Ads are also interstitials between years occasionally (full screen, X at top-right appears after ~5s).

Starting stats for life 1 (random "Become someone else" start, female, Aarhus, Denmark): Happiness 83, Health 83, Smarts 70, Looks 11. Bank $0. Parents: mother 23 (wedding planner), father 22 (trucker), family dog.

First-year tutorial pop-overs: (1) highlights the stat bars with a one-line verdict ("quite miserable… unhealthy, unintelligent, unattractive" style summary generated from stats), (2) highlights the Age button: "press Age to grow older one year at a time; make choices as you go".

### 1.2 New Life flow ("Become someone else" variant)
1. Pick gender: Male / Female (two big pill buttons).
2. "Now, pick someone to become": three randomly generated people (avatar emoji + full name, names localized to a random country). Picking one instantly starts at age 0 with a generated country/city/parents. No stat preview before picking.
3. Banner "Your new life has begun!" then the diary birth entry.
(The full "New Life" entry in the main menu has a `...` sub-menu — documented below when life 2 starts.)

### 1.3 Main menu (hamburger), top to bottom
| Section | Row | Purpose | Locked/premium? |
|---|---|---|---|
| Store | BitLife Marketplace | IAP store ("discover new ways to play") | store |
| My Lives | New Life (…) | start a new life; `...` opens sub-options | free |
| My Lives | Save Life | save to user account | greyed (needs account) |
| My Lives | Lives in Progress | load saved life | greyed |
| My Account | My BitLife Account (…) | account status | free |
| My Account | My Stuff (…) | account-wide perks | free |
| Community | BitLife Community | see what other players do | free |
| Collectibles | Accessories (2) | own them all | free |
| Collectibles | Achievements (0/410) | earn them all | free |
| Collectibles | Artifacts (0) | find them all | icon badge (expansion) |
| Collectibles | Careers (0/164) | collect all careers | free |
| Collectibles | Challenges LIVE | global timed events | free |
| Collectibles | Designer Clothes (0/30) | earn them all | greyed |
| Collectibles | Treasures (0/351) | collect | expansion badge ("Black Market") |
| Collectibles | Heirlooms (0) | look for one each day | greyed |
| Collectibles | Items (0/16) | unlock them all | greyed |
| Collectibles | Ribbons (0/40) | earn them all | free |
| Collectibles | Scavenger Hunts (0/11) | finish them | free |
| Collectibles | Wildlife Handbook | find them all | expansion badge ("Outdoors") |
| Stats | Cemetery | compare past lives | greyed (no past lives) |
| Stats | Leaderboards | global leaderboards | free |
| Configure | Custom Cities | add your hometown | free |
| Configure | Custom People | make friends appear in game | free |
| Configure | Edit Sports Teams | rename teams | free |
| Configure | Favorite Activities | customize favourites | free |
| Configure | Help (…) | help/contact | free |
| Configure | Job Packs | collect them all (IAP) | store |
| Configure | Expansion Packs | IAP | store |

Takeaways: 410 achievements, 164 careers, 40 ribbons, 351 treasures are the collectible counts. Scrolling in the emulator is by swipe (drag), not mouse wheel.

## 2. Menus and submenus (observed)

### 2.1 Occupation / life-stage tab (age 0: "Infant")
At age 0 tapping it opens a **Profile** card: avatar, name, "You" badge; Gender, Age, Location (city, country); the 4 stat bars. (Becomes School / Job menus later — see below.)

### 2.2 Assets tab (age 0; everything greyed except Finances/Investments/Luxury headers)
| Section | Row | Purpose | State |
|---|---|---|---|
| Finances | Finances | view your finances | available |
| Finances | Investments | manage investment portfolio | available (expansion-flavoured) |
| Finances | Luxury Lifestyle | "Wealth" progress bar | expansion |
| Premium Assets | Auction Houses | buy rare collectibles | expansion/greyed |
| Premium Assets | Casino | start your own casino | expansion/greyed |
| Premium Assets | Museum | display collectibles | greyed |
| Premium Assets | Race Car Garage | buy a race-car garage | greyed |
| Premium Assets | Zoo | buy a zoo | greyed |
| Collectibles | Belongings | view possessions | greyed (none) |
| Misc. | Social Media | manage online identity | greyed (too young) |
Note: no Properties/Vehicles rows at age 0 — they must appear once you own something or are adult (check later).

### 2.3 Relationships tab (age 0)
| Section | Row | Purpose |
|---|---|---|
| Special | Aura Ring (…) | "generate swag without trying" — premium item |
| Special | Commune | start a cult (expansion, greyed) |
| Parents | Father (name, "Father") | relationship bar ~85% green, chevron to open |
| Parents | Mother (name, "Mother") | relationship bar ~85% |
| Pets | Dog (name + breed "Rhodesian Ridgeback") | relationship bar ~55%, `...` menu |

### 2.4 Activities tab (age 0; full list, alphabetical after the premium block)
Premium Activities block (all greyed/expansion): Movie Director, Vampire Mode, Outdoor Lifestyle, Luxury Lifestyle (wealth bar), Casino, Black Market, Commune, Racing, Secret Agent, Zoo.
"All" block (alphabetical): Accessories (accessorize yourself — available at 0), Adoption (adopt a child), Crime (commit a crime), Doctor (visit the doctor), Emigrate (move country), Fertility (clinic), Fight Betting (bet on UFL match), Gamble (local casino), Horse Races, Identity (define your identity), Lawsuit (sue someone), Licenses (manage licenses), Loan (borrow money), Lottery, Love (find someone), Mind & Body (self-improvement), Movie Theater, Nightlife (clubbing), Pets (get a pet), Plastic Surgery, Race Tracks, Rehab (addictions), Salon & Spa, Shopping, Social Media, Sweepstakes, Vacation, Will & Testament (legacy), Zoo Trip.
At age 0 every row except Accessories is greyed (age-gated). → ~29 base activity categories.

## 3. Yearly flow and sample events (life 1 log; paraphrased)

**Mechanics of a year**: tap Age → the diary gets "Age: N years" and 0–3 lines; 0–3 popups queue up (each must be dismissed before the next). Popup kinds seen:
- *Informational card* (blue rounded): title + 1–2 sentences, tap anywhere to dismiss. A thumbs-up/thumbs-down "rate this event" bar is shown in the top bar while any event card is open.
- *Relation card* (header strip with the person's avatar, name and role badge e.g. "Father", "Mother", "Friend", "Pet", "Brother"): title with icon, text, OK button, or 2–3 choice buttons + "Surprise me!" (random pick).
- *Category card* (header strip with category name, e.g. "Childhood", "Education"): title ("Tolerance", "Integrity"), scenario text, "How will you react?/What will you do?", 2–3 choices + "Surprise me!".
- *Outcome card* after a choice: title, one sentence, optional labelled reaction bar (e.g. "Her Concern" 95%).
- *Achievement toast* slides in at the top (trophy icon, name, one-line condition) when unlocked.
- *Interstitial ads*: a full-screen video appeared after dismissing an event at age 2 (~45 s, "Open Store ⏭" label at top-right during the video; a small X appears at top-right of the end card). Immediately followed by a Bitizen upsell (X at top-left). Banner ads sit under the stats permanently.
- Low stat ⇒ a "+ Boost!" button appears on that stat bar (rewarded ad to raise it).

| Age | Event (own words) | Options | Observed effect |
|---|---|---|---|
| 1 | nothing | – | Happiness 83→83, Health 83→82, Smarts 70→69, Looks 11→10 (small drift) |
| 2 | Family dog attacked me (bit ear, grabbed knee) – info card | – | Health 82→65 (−17) |
| 2 | Mother promoted to senior role – diary line | – | – |
| 3 | Childhood/Tolerance: eccentric stranger talking to mum pinches my cheek and tries to lift me | Hit her / Up, up / Scream / Surprise me | chose "Up, up": diary "I let a strange woman hold me"; Looks 11→18 (+7?), Health 65→66 |
| 4 | Father diagnosed with bowel polyps – diary line | – | – |
| 4 | Childhood/Integrity: I broke the parents' coffee table | Admit / Deny / Surprise me | chose Admit: diary line only; no visible stat change (Happiness 83→82) |
| 5 | Father (role card)/Cheater: saw dad kissing a strange woman during hide-and-seek | Think nothing of it / Tell my mother | chose Tell: outcome card "Her Concern" bar ~95% |
| 6 | Pet/Death: family dog died of old age at 11 | OK | **Happiness 81→30 (−51)** |
| 6 | Brother/Baby: parents had a baby boy (name + "Little Brother") | OK | – |
| 6 | Education/Primary School: starting school. Card lists School name, Type: Public, Level: Primary School, Years: 9 (Denmark) | OK | the Occupation tab presumably becomes "School" |
| 7 | Friend/New Friend: classmate wants to be friends; card shows Name, Gender, Age and bars for Looks / Smarts / Craziness | Become friends / Reject / Surprise me | accepted → info card "now friends"; achievement toast "Bosom Buddies – make a friend" |
| 8 | Mother/Constipation: mother is ill with a minor ailment | OK | – |
| 8 | Friend/Cancer: friend diagnosed with gallbladder cancer | OK | – |
| 8 | Crime/"Mischief Maker": thinking about doing something naughty | Ignore / Cause some trouble | chose trouble → opens the Crime menu directly |

### 2.5 Crime menu (age 8; only Mischief, Pickpocket, Porch Pirate, Shoplift enabled as a child; others greyed)
Rows: Bank Robbery (rob a bank), Burglary (burgle a home), Embezzle (funds from work), Grand Theft Auto (steal a car), Hack (someone's computer), Hitman (arrange a contract killing), Mischief (`...`), Murder (kill someone), Pickpocket (`...`), Porch Pirate (steal a neighbour's mail, `...`), Shoplift (from the mall, `...`), Train Robbery. → 12 crime categories.
Mischief flow: card "Crime / Mischief" → dropdown "Pick your accomplice" (Act alone / friends…) → "Get up to it" → outcome card (e.g. slashed a stranger's tyres; no stat change seen, no arrest).

### 2.6 Occupation tab (age 8, "Primary School Student")
Sections: **You**: Public Primary School (Grades bar ~75%) → School submenu. **Just For You**: Business (Special Career), Politician (Special Career), Street Hustler (Special Career) – each with a briefcase/star badge (job-pack IAP). **All**: Freelance Gigs (quick money), Job Recruiter, Jobs (full-time listings), Military, Part-Time Jobs (hourly), Special Careers (find a special career) – all greyed while in primary school.

School submenu (header "SCHOOL"): school row (name + Grades bar, `...`), Activities: Change Schools (ask to go private, `...`), Class (Popularity bar ~15%, chevron → classmates list), Drop Out (`...`), Faculty (chevron → teachers list), Nurse (`...` visit the school nurse), Study Harder (`...`). Study Harder → popup "began studying harder" (grades effect visible next year). After any action the game returns to the main screen with a teal "Back" chip to reopen the last menu.

### 2.7 Relationships (age 8)
Sections now: Special (Aura Ring, Commune) / Parents (father, mother) / Siblings (brother) / Friends (friend) / Late Pets (dead dog, greyed). Each person row: avatar, name, (role), Relationship bar (green, ~85–90% for parents, ~70% brother, ~75% friend).
**Mother page** (header "MOTHER"): name (Age 31) + Relationship bar + `...`; Edit (god-mode badge, IAP); Activities: Ask for Bike, Ask for Money, Compliment, Conversation, Deal (sell something to her), Gift, Insult, Movie Theater (go with her), Recruit (cult, expansion), Spend Time, Spy (greyed). → 11 parent interactions. "Ask for Money" → Confirm dialog (Yes/Cancel) → outcome "mother gave you $4".
| 9 | Situation/"A Doggone Good Costume": judge at school's puppy-costume contest, pick the winner | 4 costume names + Surprise me | flavour only (diary line) |
| 10 | Friend/Sleepover invitation from a classmate | Not interested / Make up an excuse / Go | Go → outcome card with two bars "Your enjoyment" ~45% / "His enjoyment" ~75%; diary line |
| 10 | diary: called a teacher "mom" by mistake (random flavour line, no popup) | – | – |
| 11 | Ailment/Middle Ear Infection (green "Ailment" card) | OK | Happiness 48→47, Health 65→64; cured via Doctor same year: Happiness 47→63 (+16), Health 64→72 (+8). Doctor visit cost $0 as a child (balance unchanged $4) |
| 12 | Parents/Bass Guitar: parents want me to take bass lessons | Agree / Refuse | Agree → outcome "Your Skill" bar ~20%; next year Happiness 63→**100** (also Health 72→75, Smarts 73→74) |
| 13 | Money/Freelance Gig prompt: thinking of picking up a gig | Check gigs / Nothing | opens Freelance Gigs list |

### 2.8 Doctor activity (age 11)
Submenu "DOCTORS": Alternative Doctor (greyed), Doctor (`...`), Donate Blood (greyed <18), Donate Plasma (greyed), Emergency Room (`...`), Optometrist (greyed), Psychiatrist (greyed), Witch Doctor (greyed/expansion).
Doctor flow: "Healthcare" card → choose between 2 local doctors shown with a Reputation bar each (one ~10% red, one ~80% green) → "Diagnosis" card naming the ailment, dropdown "Pick your treatment" (one entry per ailment) → "Treat me" → "Thank you" info card; next Age → green "Cured" card.

### 2.9 Freelance Gigs (age 13)
List with hourly rate: Handyman $32+/h (greyed), Tutor $24+/h (greyed), Caretaker $16+/h (greyed), Lawn Mower $16+/h (greyed), Babysitter $13+/h, Dog Walker $13+/h, Pet Sitter $13+/h (the last three available at 13). Gig card: "Pick your rate" dropdown $13/$15/$17/$19/$21(+)… → "Post an ad" → outcome: a client hired you for N hours; shows Earnings / Hours / Hourly Rate (e.g. 28 h × $17 = $476). Higher rate presumably lowers hire chance.
| 14 | Friend/Unfriended: friend dumped me | Insult her / Try to salvage / Let her go | salvage → success card; diary line |
| 14 | diary: little brother started primary school; a joke flavour line about a robot running for mayor (from an expansion) | – | – |
| 15 | Friend/New Friend (Looks/Smarts/Craziness bars) | accept/reject | accepted |
| 16 | Friend/Death: friend died at 16 from the cancer | Attend funeral / Skip it | attended; Happiness 100→88 |
| 16 | Education/Secondary School card: School name, Type Public, Level, Years: 2 | OK | – |
| 16 | Friend/Best Friends: friend asks to become best friends | Agree / Keep status quo | – |
| 17 | License/Driving License: time to take the driving test | Take the test / Not now | Test = one road-sign quiz question (picture + 3 answers, 2 silly) → pass card |
| 17 | Parents/car gift: parents offer a new car after passing | Accept gratefully / Turn it down / Ask for more expensive | accepted → "New whip" card; car appears in assets |
| 17 | Racing/Road Race: stranger challenges you to a street race | Accept / Ignore | Accept → **shows the Racing Expansion Pack upsell (₪22)** instead of playing it; nothing happens after closing |
| 17 | diary flavour: teacher asked me questions 4 times, I got them all right (Smarts flavour) | – | – |

### 2.10 Love activity (age 17)
Submenu "LOVE": Celebrity Dating App (greyed/expansion), Date (`...`), Dating App (greyed <18), Gay Dating App (greyed <18), Hook Up (greyed <18), Threesome (greyed). 
**Date** → "Love Interest" card (header: avatar, name, "Love" badge): short meet-cute sentence (e.g. met at the library); fields Name / Gender / Age / Sexuality / Occupation; bars Looks / Smarts / Craziness; buttons "Ask him on a date" / "No, he's not my type". One candidate at a time (no list), re-roll by reopening.

### 2.11 Partner (boyfriend) interaction menu (age 17)
Header "BOYFRIEND": name (Age) + Relationship bar (~70%) + `...`; Edit (god mode, IAP). Activities: Ask for Money, Break Up, Compliment, Conversation, Counseling (greyed, not married), Deal, Elope, Gift, Give Money, Insult, Make Love, Movie Theater, Propose, Recruit (cult/expansion), Sleepover, Spend Time, Spy (greyed). → 17 rows.

### 2.12 Graduation at 18 and university
Education/Graduation card: Golden diploma (IAP item) / Apply to university / Look for a job / Take some time off.
University card: "Pick your major" dropdown — this life offered 10 majors: Engineering, Anthropology, Education, History, Psychology, Graphic Design, Finance, Economics, Journalism, Criminal Justice (the list appears to be a per-life random subset). → Apply / Actually never mind.
Funding card ("How will you pay"): Annual Tuition $0, Years: 4, Total Cost $0, single button "Free public university" (Denmark). In paid countries this is where scholarship / student loan / parents-pay options would appear (not observable from this country). Diary: "enrolled for free thanks to Denmark's public education system".
Occupation tab at 18 (University Student): You: University (Grades bar), **Schedule** (Stress bar, with a calendar "17" icon, `...`); Just For You: Fight Club (expansion), Golden Resume (IAP), Golden Diploma (IAP), Pro Athlete / Politician / Street Hustler (Special Career, job-pack badge); All: Freelance Gigs, Job Recruiter (`...`), Jobs, Military, Part-Time Jobs, Special Careers (highlighted row with icons).

### 2.13 Jobs list (age 18, Denmark, no degree yet) — 37 listings, sorted by salary desc; format "Title (Employer type) / $salary", `...` opens the application
| Title | Employer | Salary/yr |
|---|---|---|
| Magistrate | Municipal | $204,468 |
| Dentist | Dental Office | $182,456 |
| Jr. Psychiatrist | Mental Health Center | $168,866 |
| Business Analyst | Corporate | $93,098 |
| PR Assistant | Corporate | $81,914 |
| Engineer I | Engineering Firm | $78,901 |
| Jr. Architect | Architectural Firm | $73,769 |
| Pilot Trainee | Airline | $73,689 |
| Jr. Computer Programmer | Corporate | $72,991 |
| Environmental Scientist | Engineering Firm | $67,254 |
| Pilot Trainee | Airline | $66,252 |
| Jr. Chiropractor | Medical Office | $65,026 |
| School Teacher | School District | $63,009 |
| Legal Secretary | Law Firm | $54,643 |
| Mortician | Mortuary | $52,031 |
| Apprentice Carpenter | Small Business | $50,921 |
| Real Estate Agent | Real Estate | $45,853 |
| Jr. Private Investigator | Small Business | $45,684 |
| Apprentice Electrician | Small Business | $45,134 |
| Painter | Small Business | $40,697 |
| Writer | Publisher | $38,736 |
| Driver | Ride Sharing App | $36,356 |
| Apprentice Auto Mechanic | Car Dealer | $35,378 |
| Apprentice Butcher | Grocery Store | $33,733 |
| Apprentice Telemarketer | Corporate | $33,585 |
| Receptionist | Corporate | $33,188 |
| Exotic Dancer | Strip Club | $31,620 |
| Housekeeper | Small Business | $30,912 |
| Jr. Flight Attendant | Airline | $29,899 |
| Deacon | Church | $29,181 |
| Construction Worker | Small Business | $29,073 |
| Line Cook | Restaurant | $28,707 |
| Horse Jockey | Horse Track | $26,854 |
| Receptionist | Corporate | $25,848 |
| Palm Reader | Psychic Parlor | $24,972 |
| Apprentice Telemarketer | Corporate | $24,074 |
| Crew Member | Fast Food | $21,592 |
| Monk | Monastery | $13,725 |
Notes: the same title can appear twice with different salaries (different employers). The list mixes degree-required jobs (shown even without the degree; applying presumably fails) with no-degree jobs. Entry no-degree range ≈ $14k–$50k; degree entry ≈ $63k–$93k; professional ≈ $170k–$205k.
Tapping a full-time listing while enrolled → popup "can't apply while enrolled in university".

### 2.14 Part-Time Jobs (age 18, university student) — hourly listings
Mall Santa (Mall) $34/h; Lab Assistant (University) $24/h; Research Assistant (University) $24/h; Valet (Hotel) $22/h; Resident Assistant (University) $21/h; Grader (University) $19/h; Teacher's Aide (University) $19/h; Admissions Assistant (University) $16/h; Department Store Associate (Retailer) $16/h; Movie Theater Cashier $16/h; Mall Kiosk Worker $16/h; Teaching Assistant (University) $16/h; Concessions Attendant (Movie Theater) $16/h; Library Assistant $16/h; Campus Tour Guide $16/h; Cafeteria Worker $16/h; Bookkeeper (Corporate) $16/h; Chicken Sexer (Farm) $16/h; Bowling Alley attendant… (list continues ~25 rows).
Application card: Job / Employer / Hourly Rate / Weekly Hours (9) / Weekly Wage ($216) → "Apply for this position" → hired immediately (no interview for part-time): "Welcome to <employer>" card.

### 2.15 Special Careers list (age 18)
Actor, Astronaut, Business, Dealer (drug cartel), Mafia, Model, Music Producer, Musician, Politician, Pro Athlete, Street Hustler — **every row carries the job-pack badge**; tapping one opens an IAP sheet (single pack ₪18.90, "Boss Mode" all packs ₪75). So in the free game none of the special careers are playable; the free fame route is regular jobs with fame (e.g. writer/actor via jobs?) — to verify. 

### 2.16 Assets tab (age 18) and Shopping
Assets now: Finances (`...`), Investments (expansion badge), Luxury Lifestyle (wealth bar); **Just For You** upsells: Racing Expansion Pack, Casino Expansion Pack, Landlord (expansion); Premium Assets: Auction Houses, Casino, Museum, Race Car Garage, Zoo (all expansion badges); Collectibles: Belongings (Black-Market badge); **Vehicles**: the gifted car row with a Condition bar (chevron → car page); Misc: Social Media; teal button **"Go Shopping…"**.
**Shopping** screen, grouped by store type: Bicycles (1 shop), Car Dealers (4: one racing emporium with pack badge + 3 regular), Jewelers (2: real + fake jewelry), Music Stores (1, instruments), Real Estate Brokers (2), Speciality Vehicle Dealers (aviation dealer, aircraft brokers, …more below).
**Real-estate broker list** (Denmark, ~25 rows, price desc, chevron rows with pack badge are expansion-only): Futuristic Home $8.97M (Landlord pack), Haunted Villa $5.77M (pack), Haunted Villa $4.70M (pack), Haunted Vampire Lair $3.39M (pack), Haunted Vampire Keep $3.23M (pack), Palace $1,696,384, Modern Home $365,127, Haunted Folly Castle $320,761, Spanish Colonial $309,276, Haunted Colonial $231,425, Pueblo Home $230,970, Modern Home $184,385, Haunted Contemporary $145,184, Haunted Craftsman $131,064, Condo $107,828, Townhome $105,285, Geodesic Home $95,553 (pack), Condo $78,042, Condo $40,551, Studio $22,489; teal "Refresh Inventory…" button at the bottom (probably a rewarded ad).
**Property card**: Price, Address, Size (1br/1ba), Age (63 years), Monthly Expense ($19), Monthly Mortgage ($97), Condition bar; buttons "Apply for a mortgage" / "Buy it with cash". Mortgage with $480 cash → "Rejected – Reason: Insufficient Finances". (Rule of thumb from the numbers: mortgage ≈ price/232 per month ≈ 30-year-ish amortisation; upkeep ≈ 1%/yr.)

### 2.17 Mind & Body (age 18)
Rows: Acting Lessons (`...`), Book (find a good book), Diet (go on a diet), Garden (greyed – needs a house), Gym (`...`), Instruments (chevron → list), Library (`...`), Martial Arts (chevron), Meditate, Memory Test, Modeling Lessons, Space Camp, Walk, Vo… (Voice lessons?, cut off). → ~14 rows.
Measured deltas (age 18): **Gym** $30 → Health 83→91 (+8), happiness capped at 100 (card shows "Enjoyment" bar); **Library** free → Smarts 74→78 (+4); **Meditate** free → Health 91→95 (+4), card reveals a hidden "Fertility" bar (~100%).
Finances card (age 18): Bank Balance $480; **Tax Rate 15.3%**; Investment Portfolio $0; Monthly Outflow $0; Assets $45,974 (= the gifted car's value); Liabilities $0; Net Worth $45,974; Income $11,232 (= 9 h × $24 × 52 weeks, part-time).
| 18 | Symptom card (green header "Symptom"): constipation, shows "Your Concern" bar (~20%) | Drink a smoothie / Doesn't bother me / Go to the doctor / Search the web | doctor → same 2-doctor pick (+ "Actually, never mind") → diagnosis "bowel polyps", text notes treatment is free thanks to Denmark's healthcare → Treat me / I'll pass |
| 19 | "Movie Director" expansion teaser chain: choose genre (Action/Comedy/Sci-Fi/Romance) → script card (Tone, Theme, pick an actor dropdown) → "Start filming" → 2 on-set decision cards (budget surplus: Production Design/Special Effects/Marketing; lead actor misbehaves: 4 options) → result card: Movie, Tone, Theme, Cast, bars Audience Reception / Critical Reception / Your Reputation → "I want to make another one!" (→ store). Free teaser of a paid mode; no money/stat effect seen. |
| 19 | Vampire expansion teaser (pale strangers offer to turn you) | Join them / Run away | ran away – nothing |
| 20 | Social/Podcast: friends start podcasts | Do it / Never mind | Never mind → hint card pointing to Activities → Social Media |
Money: bank $480 (18) → $9,965 (19) → $19,480 (20) purely from the 9 h/week part-time job (~$11.2k gross/yr, ~15% tax).

### 2.18 Social Media (age 20)
Platforms (each "Sign up for …", `...`): Facebook, Instagram, OnlyFans, TikTok, Twitch, Twitter, SoundCloud; section "Inactive Channels": Podcast (start your own podcast), … → 8 channels.

### 2.19 Time Machine (Activities row "Travel back in time")
Sheet with checkboxes: 1 year ago (Age 19) ✓ default, 3 years ago (Age 17), 5 years ago (15), 10 years ago (10), 15 years ago (5). Buttons: "Do it! ₪3.40" (one-shot IAP) and "Unlimited Uses! (All Lives) ₪52.00". Entirely paid; no free rewind.
| 22 | Education/Graduation (university): graduated with undergraduate degree in finance | OK | Smarts 79→86 during uni; immediately "released" from the part-time job (no longer a student); status "Unemployed"; Happiness 99→70 |
| 22 | Parents/house gift: now that you have a job, parents buy you a tiny house (Address, Size 1br/1ba, Age 42 yrs, Monthly Expense $20, Condition bar) | Accept / Turn down | accepted → own the house |

### 2.20 Job Recruiter and interview (age 22, finance degree)
Job Recruiter card: "finds the best full-time position for your skill set", **Cost $1,600** → "Let's try it" → result card: Title Stockbroker, Employer Aarhus Stock Exchange, Salary $106,048 (interview already arranged) → Attend the interview / Turn it down.
**Interview** card: one question ("are you goal-oriented?") with 4 answers (1 sensible, 3 jokes) + Surprise me → "Welcome aboard" card: Title, Career, Employer, Salary. Balance $38,510 → $36,910 (recruiter fee).
**Job page** (header "JOB"): job row with **Performance** bar (~60%, `...`); Activities: Co-Workers (Popularity bar ~45%, chevron → list), Hours (adjust your hours), Human Resources (report someone), Resign, Retire, Work Harder. (Promotion/raise requests are presumably in the job row's `...` menu – checked below.)
Occupation tab with a job: You: job row (Performance bar) + Schedule (Stress bar) ; the rest as before, plus "Education – Go back to school" row in All.
| 23 | Encounter card: a hustler hassles you on a walk | Attack / Argue / Solicit / Ignore | ignored |
| 23 | diary: boyfriend promoted; brother started secondary school | – | – |
| 24 | diary: raise of 10.26% → salary $116,925 (automatic yearly raise, no request) ; random "talked a lawyer off a ledge" flavour | – | – |
| 24 | Boyfriend/Proposal: card shows Ring (18K white gold), Setting (hot tub), Years Together (7), Relationship bar | Accept / Not ready | accepted → engaged; partner row becomes "Fiancé" |
Money with a full-time job: $36,910 (22) → $47,137 (23) → $57,364 (24): **≈ +$10.2k/yr net on a $106k salary** (Denmark: heavy tax + house/car upkeep).

### 2.21 Fiancé menu and Wedding planning (age 24)
Fiancé rows: Ask for Money, Break Up, Cancel Engagement, Celebrate Anniversary, Compliment, Conversation, Counseling, Deal, Elope, Gift, Give Money, Insult, Make Love, Movie Theater, Recruit (cult), Spend Time, Spy (greyed), **Wedding** (plan your wedding).
Wedding Planning card: "Pick your venue" dropdown (Winery, Family Member's House, Country Club, Banquet Hall, Barn, …) and "Pick your honeymoon" (No honeymoon, Monaco Grand Prix, Auckland NZ, Baghdad Iraq, Taj Mahal India, …) → "Select plan" → Wedding card with **Cost** (family house + Auckland = $8,102) → Do it / Edit the plan / Never mind.
Prenup card before the wedding: shows Your Net Worth ($104,475) vs His Net Worth ($101,004) → Make him sign / We don't need one. After marriage the spouse's **cash is merged into the bank balance** (diary: "brought cash assets of $101,004 into our marriage"): $57,364 − $8,102 wedding + $101,004 = $150,266.
| 25 | Symptom/Loss of Voice ("Your Concern" ~25%) | Search web / Smoothie / Doctor / Doesn't bother me | ignored; no visible effect |
| 25 | Career/Job Offer: headhunted for Jr. Financial Analyst at $77,454 (less than current $116,925) | Do it / No thanks | declined |
| 25 | Movie Director teaser prompt again | Learn / Push thought away | pushed away |
| 25 | Husband → Make Love → outcome card with "Your Enjoyment"/"His Enjoyment" bars; next Age → **Fertility/Pregnancy card**: Keep the baby / Don't keep the baby / Use the Golden Pacifier (IAP item) | kept |
| 26 | Promotion card "Moving on up": New Title Sr. Stockbroker, **New Salary $171,309 (+46.5%)**, Career, Employer – after 4 years in the job with "Work Harder" once | – | – |
Money: $160,700 (25).
| 27 | Baby card: gave birth to a girl → name field (editable, "Pick Random" link), Last Name dropdown (mine / spouse's) → "Select name" → child card with Smarts/Looks bars | – | – |
| 27 | Supervisor card/Overtime: boss wants 12 extra unpaid hours (Current Hours 36/week → New Hours 48/week) | Explain I can't / Refuse and insult / Agree | (mis-tapped) insulted him → outcome "called him a dimwit" |
| 28 | Job/Termination: fired from Sr. Stockbroker, reason text "browsing jobs online at work" (really the insult), shows Years in Position: 6 | Wish supervisor well / Beg to stay / Insult | begged → "No luck" |
Money: $171,135 (26) → $179,806 (27) (+$8.7k with the $171k salary — net growth stays small; Denmark taxes + baby).
| 28 | Rehire: Job Offer card for Sr. Stockbroker at $182,186 right after the firing | Do it / Take time off / Look for different job | accepted |
| 29 | Illness/Depression card (green header "Illness") after happiness hit 0 | OK | Psychiatrist: Counseling $815 / Shock Therapy $4,085 → counseling gave no instant change; "Cured" card came 2 years later and happiness jumped 4%→99% |
| 29 | Daughter/Vaccination | Vaccinate / Against | vaccinated |
| 30–36 | Pregnancy card every 1–2 years (husband initiates), each → Baby Girl naming card. Children: born at 27, 31, 35, (pregnant again at 37). Child illness cards (mumps, tonsillitis) → auto-cured next year. Car cards: broken fuel pump Repair $880 / flat tire Repair $176, with "Use the Golden Wrench" IAP option. Social/OnlyFans prompt (sign-up button plays a rewarded ad). | | |
**Money drain discovered (age 37)**: Finances card now shows **Tax Rate 37.2%** (on $182k; was 15.3% on $11k → progressive), **Monthly Outflow $15,187**, Assets $126,648, Marriage line, Combined Income $251,251 (Your Income $182,186 / His Income $69,065). Bank went $177k (29) → $165k (32) → $119k (36) → $100k (37): with 3 kids, a house and a car the household loses ≈ $19k/yr despite $251k combined income. Outflow seems to include taxes + living costs + dependants.
| 38 | Baby/Miscarriage card (first trimester) | OK | Happiness 99→48 (−51) |
| 39–40 | Symptom cards (constipation; "altered speech + tunnel vision" with high concern) → doctor → diagnosed migraines; treatment can **fail** ("you continue to suffer") | | |
| 41 | Encounter/Dog: stray dog at a funeral | Shelter / Run / Retreat / Keep as pet | kept → Pet naming card (Name + Pick Random) |
| 42 | Car card: car "beyond repair" at Age 26 years → only option "Scrap it" | – | car removed |
| 43 | Pet/Death: the dog died of **starvation** at 5 (we were broke) | Mourn / Have him taxidermied | – |
Money collapse: $81k (38) → $44k (40) → $24k (41) → $4.4k (42) → **−$16,339 (43)** — the bank balance can go negative (debt) with no bankruptcy popup so far. Diary lines also log parents retiring and sibling marriage/children.
| 44–47 | Depression again (happiness 0 while broke); High Blood Pressure illness card; Daughter/College Major card (pick her major from a dropdown or let her choose); Husband/Car Shopping nag (Shop / Argue / Refuse); a "Current" card keyed to the real calendar date (Oct 14 = chocolate-covered insect day, 4 joke options); achievement toast "Stockbroker – Career Collected" (careers collectable per job) | | Health drifting down: 74 (44) → 39 (47) → 22 (48) while depressed, broke and untreated |
| 49 | Job/Termination again (random, "working on resume at work"), Years in Position: 21 | Wish well / Beg / Insult | – ; husband Argument card follows (Argue back / Apologize) |
Money: −$54k (45) → −$78k (47) → −$91k (48). No bankruptcy/foreclosure event seen while in debt; expenses keep accruing.
| 50 | Husband/Divorce: he wants a divorce ("you are irresponsible") | Beg / Wish well / Insult / Attack | wished well → **Divorce Settlement** card: judge divides assets equally; "you end up with −$40,120 in debts after 26 years"; Legal/Will & Testament card (Name, Net Worth, Eligible Inheritors: 3, dropdown "Divide Equally" → Execute will / Never mind) |
| 50 | Job Referral card: friend refers you to Apprentice Blacksmith $50,103 | Take / Not for me | took it; happiness 0→38, health recovers slowly (0→9→18→31) |
| 53 | Father/Death at 76 (died in sleep): "your responsibility to plan his funeral" | Plan funeral / Let someone else / Skip | – |
| 55 | Job card "Appealing Steel": client wants an artwork; 4 price options (not for hire / free / a lot / a million) | | |
| 55 | Mother/Death at 79 → outcome card: **"you and your brother each inherited $470,497"** (bank −$55k → ~+$415k) | | |
Lifespans seen so far: parents 76 and 79; pet dog 11 (old age) / 5 (starved); friend 16 (cancer).
