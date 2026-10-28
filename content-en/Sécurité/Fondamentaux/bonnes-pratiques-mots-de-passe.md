---
order: 4
---

# Passwords: Best Practices for Users and for Websites (28/10/2026)

A **password** is a secret that the user knows and gives to a website to prove who they are: it is the proof from the "what you know" family, presented in [Authentication vs Authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation). It remains the most widespread method, and also the most fragile. This chapter speaks to two readers at once: the **user**, who chooses and keeps their passwords, and the **site** (the program that runs on a server and receives these passwords), whose developers decide what is accepted, stored and recorded.

| Part | For whom | Questions covered |
|---|---|---|
| [Why the password is the weak link](#why-the-password-is-the-weak-link) | Everyone | How passwords get stolen or guessed |
| [The strength of a password](#the-strength-of-a-password-a-calculation) | Everyone | How many combinations an attacker must try |
| [On the user side](#on-the-user-side) | User | Choosing, storing, protecting and reacting to a leak |
| [On the site side](#on-the-site-side) | Developer | Accepting, storing, limiting, resetting, monitoring |
| [Common mistakes](#common-mistakes-on-the-user-side-and-on-the-site-side) | Everyone | The most frequent mistakes and how to fix them |

This chapter does not explain password storage again: **hashing** (turning the password into a one-way fingerprint) and the **salt** (a random value added before hashing) are detailed in [Passwords and Secure Hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage). The JavaScript code on the site side relies on [functions](/?c=langages&s=javascript&p=fonctions), [conditions](/?c=langages&s=javascript&p=conditions), [arrays](/?c=langages&s=javascript&p=tableaux) and [objects](/?c=langages&s=javascript&p=objets).

Standards and their recommendations evolve: those cited here are dated 28/10/2026, and each official link lets you check the text currently in force.

## Why the password is the weak link

A password is a secret that humans have to invent, remember and type. Four human and technical weaknesses follow from this.

| Weakness | What happens |
|---|---|
| **Reuse** | The same password is used on ten sites: if just one leaks, all ten accounts fall |
| **Database leak** | A **leak** is the publication or resale of data stolen from a site; it contains email addresses (electronic mail) and passwords or their hashes |
| **Phishing** | A fake site or fake message pushes the user to hand over their own password (see [Social Engineering and Phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) |
| **Predictable choices** | Humans choose `123456`, their first name, a date: attackers know this and try these choices first |

These weaknesses are exploited by specific attacks, which operate at different points:

| Attack | Principle | What stops it |
|---|---|---|
| **Online brute force** | Try every possible combination, one by one, through the site's login form | Limit on the number of attempts, long password |
| **Offline brute force** | Try every combination against stolen hashes, on one's own machine, with no limit imposed by the site | Long password, slow salted hashing |
| **Dictionary attack** | Try first a list of probable passwords (see [the chapter on hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)) | Password drawn at random, site refuses common passwords |
| **Password spraying** | Try a single very common password on thousands of accounts, to stay under the per-account lockout thresholds | Refusing common passwords, detection on the site side |
| **Credential stuffing** | Take email address and password pairs from a leak and automatically try them on other sites | Unique password per site, second factor |
| **Phishing** | Obtain the victim's own password | Password manager, passkeys, vigilance |

Credential stuffing is the most profitable for the attacker, because reuse turns one site's leak into a key for all the others:

```text
Site A (small forum) is hacked
        |
        v
Stolen list: alice@example.com + "cat2020!"   (in clear, or recovered by dictionary)
        |
        v
A program automatically tries this pair on:
        +--> email account  : access granted if Alice reused the password
        +--> bank           : refused if the password is different there
        +--> social networks: access granted if Alice reused the password
```

A compromised email account is the most serious: almost every "forgot password" flow sends a link to this address (see [the secure reset flow](#a-secure-reset-flow)), so the attacker can then take over all the other accounts.

## The strength of a password: a calculation

The **strength** of a secret is measured by the number of combinations an attacker would have to try, in the worst case, to find it. For a randomly drawn secret, the calculation is simple: **size of the alphabet raised to the power of the length**. The notation `94^8` ("94 to the power 8") means 94 × 94 × 94 × 94 × 94 × 94 × 94 × 94 (eight times 94). The scientific notation `3.7 × 10^15` means 3.7 followed by fifteen shifted zeros, that is 3,700,000,000,000,000 (about 3.7 million billion).

Two secrets are compared here. The **alphabet** of the first is the set of 94 printable characters on the keyboard: 26 lowercase letters, 26 uppercase letters, 10 digits and 32 symbols. The alphabet of the second is a list of **7,776 words**, that of the dice method (6^5 = 7,776, that is five rolls of a six-sided die per word, see [the EFF's list](https://www.eff.org/dice)): each word drawn then counts as one "character" among 7,776.

| Randomly drawn secret | Calculation | Combinations | Bits |
|---|---|---|---|
| 8 lowercase letters | 26^8 | 2.1 × 10^11 (208,827,064,576) | 37.6 |
| 8 characters from 94 | 94^8 | 6.1 × 10^15 (6,095,689,385,410,816) | 52.4 |
| Four-word passphrase | 7776^4 | 3.7 × 10^15 (3,656,158,440,062,976) | 51.7 |
| Five-word passphrase | 7776^5 | 2.8 × 10^19 | 64.6 |
| Six-word passphrase | 7776^6 | 2.2 × 10^23 | 77.5 |
| 12 characters from 94 | 94^12 | 4.8 × 10^23 | 78.7 |

A **bit** is a unit of measure of strength: each additional bit doubles the number of combinations (52 bits mean 2^52 combinations). These values can be recalculated with Node.js (the environment that runs JavaScript outside a browser):

```bash
# node -e runs the JavaScript code given between quotes; BigInt (the suffix n) avoids
# rounding on very large numbers; ** is the power operator
node -e "console.log((7776n ** 4n).toString())"   # prints 3656158440062976
node -e "console.log((94n ** 8n).toString())"     # prints 6095689385410816
```

Attack times depend on the attacker's speed. Here is the time to **try everything** (on average, half is enough), with two speeds given as orders of magnitude: 10 billion attempts per second, the order of magnitude of a fast hash attacked with specialized hardware, and 10,000 per second, the order of magnitude of a slow hash (see [Passwords and Secure Hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). These are assumptions for comparison, not measurements.

| Secret | At 10 billion attempts per second | At 10,000 attempts per second |
|---|---|---|
| 8 lowercase letters | 21 seconds | 242 days |
| 8 characters from 94 | 7.1 days | 19,300 years |
| Four-word passphrase | 4.2 days | 11,600 years |
| Five-word passphrase | 90 years | 90 million years |
| Six-word passphrase | 700,000 years | 700 billion years |

Four lessons:

| Lesson | Explanation |
|---|---|
| **4 words are worth about 8 random characters** | 51.7 bits against 52.4: the passphrase is not stronger, but it is easier to remember, whereas `k7#Qx!9r` is forgotten or has to be written down |
| **Each extra word multiplies by 7,776** | 5 words are 4,664 times harder to find than 8 characters from 94: length gains over complexity |
| **The calculation assumes a random draw** | A human who "invents" their 8 characters picks them from the same patterns as everyone else (`Summer2026!`): the attacker tries them well before the rest. A random draw (dice, password manager generator) is required |
| **The site's hashing changes everything** | The same secret goes from a few days to thousands of years depending on whether the site stores a fast or a slow hash |

Hence the practical rule: **5 words at minimum** for a password memorized by heart, **6 words** or more for a password manager's master password (see below), and random passwords of 16 characters or more for everything the manager remembers in place of the user.

## On the user side

### Length rather than apparent complexity

A "complex" password under the usual rules (one uppercase letter, one digit, one symbol) is not necessarily strong: humans follow these rules through predictable moves.

| Password | Verdict | Why |
|---|---|---|
| `P@ssw0rd1!` | Weak | Replacing `a` with `@` and `o` with `0` is the first reflex attackers test |
| `Summer2026!` | Weak | One word, a year, a symbol: a banal pattern |
| `jXe8#pL2` | Medium | Random but short (52 bits) and hard to remember |
| `horse staple cloud knit piano` | Strong | 5 words drawn at random: 64.6 bits, easy to remember |
| `bP4$kz7-Qw2!mTr9vX` | Strong | 18 characters drawn at random, remembered by the manager |

### The passphrase

A **passphrase** is a password made of several words, separated by spaces or a hyphen. The proven method: draw 5 words **at random** (with dice and the [EFF's list](https://www.eff.org/dice), or with the passphrase generator of a password manager), never choose them yourself.

| To do | To avoid |
|---|---|
| Draw the words at random, without "improving" them | Choosing five words that you like or that are linked to each other |
| Keep the passphrase as it is: the number of words is what makes it strong | Adding a `1` and a `!` at the end "for form's sake" |
| Use the passphrase for a single purpose: the master password or unlocking the computer | Reusing the same passphrase on several sites |
| 5 words minimum, 6 for the master password | A famous quote, song lyrics, a proverb: they appear in attackers' dictionaries |

### One unique password per site

Credential stuffing shows why: if each site has its own password, a leak from one site only gives access to that site. Remembering dozens of different passwords by hand is impossible, hence the password manager.

### The password manager

A **password manager** is a program (an application, a browser extension) that keeps all passwords in an **encrypted vault** (a file made unreadable by [encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)), opened with a single password: the **master password**. Two examples of programs: [KeePassXC](https://keepassxc.org/) (the vault remains a file on the device) and [Bitwarden](https://bitwarden.com/) (the encrypted vault is synced between devices). Browsers also offer one, a simpler one.

| What the manager does | What it brings |
|---|---|
| Generates random, long passwords | Each site has a unique password that nobody can guess |
| Remembers everything, fills in forms | The user no longer has to remember or type |
| Only fills in on the **correct address** of the site | A fake site (phishing) is not recognized: if nothing is offered on a login page that is supposed to be known, the address is suspect |
| Flags reused, weak or leaked passwords | Gives the list of what needs changing |
| Syncs between devices | The phone and the computer share the same vault |

The vault is protected only by the master password: if an attacker copies the encrypted file, they attack it **offline**, with no limit on attempts. This password must therefore be:

| Requirement | Reason |
|---|---|
| A passphrase of 6 random words or more | It is the only barrier against offline brute force |
| Unique: never used elsewhere | A leak elsewhere must not open the vault |
| Never saved in the vault or in an unencrypted file | The vault stays closed as long as the password is not known |
| Backed by a second factor on the manager's account, when one is offered | A stolen master password is then not enough |

**Backup:** most managers cannot recover a forgotten master password (this is by design: the provider does not know it). So plan for a printed **recovery key** or an encrypted copy of the vault, stored somewhere safe (a physical safe, a locked drawer), and test it once. Everyday devices break down: a single vault without a copy is a risk.

### Multi-factor authentication and passkeys

**Multi-factor authentication** (MFA) requires two proofs from different families; it is detailed in [Multi-Factor Authentication](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur), with one-time codes (TOTP) and physical security keys (FIDO2/WebAuthn).

A **passkey** goes further: it replaces the password. It relies on the same principle as FIDO2/WebAuthn security keys: a pair of mathematical keys is created at registration; the **private** part stays on the device (or in the manager that syncs it), the site only receives the **public** part. At login, the device proves that it holds the private key, after a local gesture (fingerprint, device code), and the proof is valid only for the exact address of the site.

| Method | Protects against | Main limit |
|---|---|---|
| Password only | Nothing if the password leaks | Reuse, leaks, phishing |
| Password and SMS code | A password stolen alone | Phone number hijacking (*SIM swapping*) |
| Password and TOTP app | A password stolen alone | A fake site can collect the code typed |
| Passkey or security key | Leaks and phishing: nothing to steal or reuse, and the key refuses a fake site | Not all sites offer it yet (28/10/2026), the loss of the device must be planned for |

Enable these first on the accounts that open others: email, the password manager, the bank.

### Checking whether an account is in a leak

The free service [Have I Been Pwned](https://haveibeenpwned.com/) (a private service, not a public one) lists known leaks: you enter your email address and it indicates which leaks it appears in; it also offers an alert at sign-up and a password check. For a password, the method is designed never to send the password itself (see [the site's code](#refusing-weak-and-known-passwords)). Appearing in a leak does not mean that the account was attacked, but that the password used at the time must be considered known.

### What to do after a leak

| Step | Action | Why |
|---|---|---|
| 1 | Go to the site concerned by typing its address yourself (not via a received link) and change the password | An email saying "your account has leaked, click here" is often phishing |
| 2 | Change this password **everywhere it was reused**, starting with email and the bank | Credential stuffing tries it on every site |
| 3 | Enable the second factor or a passkey | A password alone is no longer enough for attackers |
| 4 | Check connected devices, recovery addresses and email forwarding rules | An attacker who has already got in leaves backdoor access there |
| 5 | Monitor bank statements and be wary of messages that follow the leak | Thieves exploit the news of a leak to phish |
| 6 | If banking or identity data is involved, inform the bank or the body | Place a block or monitor the use of this data |

### Never share, never write down in plain text

| Rule | Detail |
|---|---|
| Never **give** your password to anyone | No technical support, no bank, no legitimate administrator asks for it: such a request is a phishing attempt |
| To share access, use the manager's sharing feature or separate accounts | A password sent by message stays readable in the history and on the email servers |
| Do not write your passwords in a file, a message or on visible paper | A plain-text note is read by anyone who gets access to the device or the desk |
| The only reasonable exception: the manager's recovery key on paper, stored somewhere safe | A paper locked away protects better than a forgotten secret |

### Caution with security questions

A **security question** ("name of your first pet?") serves as a second way to recover an account. Its answer is a second password, but a weak one: it can be found on social networks or guessed. It does not count as a second factor (see [Multi-Factor Authentication](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)). When a site imposes one, answer with a **random text**, unrelated to the question, and store it in the manager like a password.

## On the site side

A site does not control what the user does, but it decides what it accepts, what it stores, what it lets be tried and what it writes in its logs. Its choices answer to published recommendations.

### NIST recommendations

The **NIST** (*National Institute of Standards and Technology*) is the American standardization body. Its document **SP 800-63B** (*Special Publication*, volume B of the guidelines on digital identity) describes how to manage authentication and is a reference worldwide; it is published at [pages.nist.gov/800-63-4](https://pages.nist.gov/800-63-4/). Its main requirements on passwords:

| Recommendation | Content | Why |
|---|---|---|
| **Minimum length** | At least 8 characters when the password is used with a second factor; revision 4 requires 15 characters when it is used alone (to be verified on the official source) | Length multiplies combinations more than any composition rule |
| **Maximum length** | Accept at least 64 characters | Passphrases and generated passwords are long |
| **All characters** | Accept spaces, symbols and Unicode characters; do not truncate silently | A passphrase contains spaces; truncation makes the secret shorter than expected |
| **Pasting and managers** | Allow pasting into the field | Without pasting, the manager cannot fill it in: users choose shorter passwords |
| **No composition rule** | Do not require "one uppercase letter, one digit, one symbol" | These rules produce `Password1!` rather than strong secrets |
| **No periodic change** | Do not require renewal every 90 days; require a change only after a proven compromise | A forced change gives `Summer2026!` then `Autumn2026!` |
| **Refusal of known passwords** | Compare against a list of compromised or too common passwords, or built on the name of the site or the username | A long password can still appear in attackers' lists |
| **No security questions or hints** | Do not offer "name of your first pet" | The answer can be guessed, which makes the account as weak as the question |
| **Limit on attempts** | Limit failed attempts on an account (NIST cites a ceiling of the order of 100 consecutive attempts: to be verified on the official source) | Without a limit, online brute force is possible |

These recommendations match the [password policy](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) described in the neighboring chapter on hashing: they specify the minimum length (that chapter cites 12 characters, a stricter choice by the site than the NIST floor). The **OWASP** (a community that publishes web security guides, see [The OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10)) holds the same positions in its [authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

### ANSSI recommendations

The **ANSSI** (the French national agency for information systems security) is the French cybersecurity authority. It publishes on [cyber.gouv.fr](https://cyber.gouv.fr/) a guide titled "Recommendations on multi-factor authentication and passwords" (to be verified on the official source). Its main lines, to be re-checked against the official text before relying on them:

| Principle | Content |
|---|---|
| Prefer multi-factor authentication | Add a second factor as soon as the service allows it (to be verified on the official source) |
| One password per service | Never reuse a password from one service on another (to be verified on the official source) |
| Long passwords | Favor length and passphrases (to be verified on the official source) |
| A password manager | Recommended to keep a unique password per service (to be verified on the official source) |
| Irreversible storage | Site side: passwords hashed with a salt, never in clear (to be verified on the official source) |

The exact figures (minimum length, target entropy according to the security level) are read in the guide itself: they depend on the security level of the system and are not repeated here.

### Storage: reminder and cross-reference

Storage is covered in detail in [Passwords and Secure Hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage): a slow, salted hash, never the password in clear, never reversible encryption. Among the suitable functions, **Argon2id** (the variant of Argon2 that current guides recommend first) and **bcrypt** are used through a function of the language's library, never rewritten by hand. One point of vigilance is added here: **bcrypt only reads the first 72 bytes** of the password (a **byte** is a group of 8 bits; an accented character often takes 2). A long passphrase can therefore be truncated without any error: read the documentation of the library used and choose accordingly (to be verified on the official source of the library).

### Limiting attempts without allowing denial of service

A **denial of service** makes a service unusable for legitimate users (see [Overload and Application-Level Denial of Service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)). A block that is too strict causes it: if five bad attempts lock an account for an hour, anyone can lock Alice's account by failing on purpose. The general principle of rate limiting is presented in [Web API Security](/?c=securite&s=cybersecurite&p=securite-api-web).

| Measure | Principle | Precaution |
|---|---|---|
| **Progressive delay** | Each failure doubles the wait before the next attempt (1 s, 2 s, 4 s, 8 s, capped at a few minutes) | No permanent block: the wait is enough to ruin brute force |
| **Counter per account AND per IP address** | Count failures on the same account, and on the same IP address (the address that identifies a machine on the network) | Password spraying touches many accounts with few attempts each: the per-IP counter detects it |
| **Known device** | The wait is softer for a browser already used successfully (a signed cookie, see [Sessions and Cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | The real user stays able to log in while an attacker elsewhere is slowed down |
| **Anti-robot test (CAPTCHA)** | A **CAPTCHA** is a test designed to tell a human from a program; it is required after a few failures | A CAPTCHA alone is not a limit: it can be bypassed, it complements other measures |
| **HTTP 429 response** | Status code "too many requests", with the `Retry-After` header that indicates when to try again (see [Exchanging Data: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) | The counter lives on the **server**, never in a cookie that the client controls |
| **Alert and stronger second factor** | Warn the owner of a series of failures; require the second factor on an unusual login | Avoids locking out the owner with a block |

### An identical error message, whether or not the account exists

A form that answers "this account does not exist" to one attempt and "wrong password" to another reveals which accounts exist (see [Business Logic and Automated Workarounds](/?c=securite&s=cybersecurite&p=logique-metier-et-automatisation)). The response must therefore be **the same** in all cases, for login and for reset:

```text
Login
   unknown address   ->  "Username or password incorrect"
   wrong password    ->  "Username or password incorrect"

Reset
   unknown address   ->  "If this account exists, an email has just been sent"
   known address     ->  "If this account exists, an email has just been sent"
```

The **response time** must also remain comparable: otherwise a fast response (no hash to compute) gives away an account that does not exist. Two ways: hash the password entered anyway against a fake hash for unknown accounts, or send the reset email as a background task rather than before answering. At sign-up, "this address is already in use" gives the same information: the solution is to answer "a confirmation email has been sent" in all cases, the email explaining the situation.

### A secure reset flow

Reset ("forgot password") is the most attacked path: for an attacker, it is easier to have access sent to them than to guess a password. A **token** here is a string of random characters, which serves as temporary proof and is placed in the link sent by email.

```text
User                                 Site                                  Email inbox
    |                                  |                                     |
 1. "Forgot password" (enter address)->|                                     |
    |                                  | 2. looks up the account (it may not exist)
    |<- 3. same message in all cases: "If this account exists, an email is sent"
    |                                  | 4. if the account exists: create a random token,
    |                                  |    stores fingerprint, expiry time, "unused"
    |                                  |-- 5. sends the link with the token->|
    |<------------------------------------------ 6. reads the email ---------|
 7. click the link ------------------->| 8. checks: fingerprint, expiry, single use
    |<- 9. form for a "new password" (same policy as at sign-up)
10. sends the new password ----------->| 11. hashes, stores; marks the token "used";
    |                                  |     closes all open sessions
    |                                  |-- 12. email "password changed" ---->|
```

| Rule | Why |
|---|---|
| Token drawn from a [cryptographic random generator](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs), of at least 128 bits (the code below takes 256) | A predictable token lets someone reset another person's account |
| Store only the **fingerprint** of the token, not the token | A leak of the database does not give a usable reset link |
| **Single use**: marked "used" at the first visit | A link re-read in a history must open nothing |
| **Short lifetime** (on the order of 15 to 60 minutes) | An email forgotten in an inbox does not stay dangerous |
| A new request invalidates the previous tokens | Only one valid link at a time |
| Never **send a password** by email, not even a "temporary" one | An email travels and stays stored in clear; sending a password forces the site to know it, hence to store it in clear |
| Do not log the user in automatically after the change | The change must remain a separate operation from a login |
| Close the open sessions after the change | An attacker already logged in loses their access |
| Link in HTTPS only, page without third-party resources | The address containing the token can be passed to a third party by some browser headers (to be verified on the [OWASP cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)) |

Build the token and its fingerprint, on the server side, with the `node:crypto` module provided with Node.js:

```javascript
const crypto = require("node:crypto");   // cryptography module provided with Node.js

const VALIDITY_MS = 30 * 60 * 1000;   // 30 minutes, in milliseconds

// Creates a reset token: only its fingerprint is kept on the server side
function createResetToken() {
    // randomBytes draws 32 bytes (256 bits) from a cryptographic random generator
    const token = crypto.randomBytes(32).toString("hex");   // 64 hexadecimal characters
    // A random token cannot be guessed by dictionary: a fast hash (SHA-256)
    // is enough for its fingerprint, bcrypt would be useless
    const fingerprint = crypto.createHash("sha256").update(token).digest("hex");
    return {
        token: token,              // sent ONCE by email, never stored
        fingerprint: fingerprint,  // stored in the database with the two following fields
        expiry: Date.now() + VALIDITY_MS,   // Date.now(): the current time in ms
        used: false,               // will switch to true at the first use
    };
}

const example = createResetToken();
console.log(example.token.length, example.fingerprint.length, example.used);   // 64 64 false
```

`require` loads a module, `"hex"` writes the bytes in hexadecimal (digits 0 to 9 and letters a to f), and `SHA-256` is a fast hash function, suited here because the token is already random (the slow hash, by contrast, protects secrets chosen by humans: see [the chapter on hashing](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)).

### Notifying the user of any change

The site sends an email to the **registered** address (not to an address typed in the request) each time the password, the email address or the second factor changes.

| The email contains | The email never contains |
|---|---|
| What changed and when | The new password |
| The device and approximate region, if the site knows them | A link that logs in directly without further verification |
| An "It wasn't me" link to an account recovery procedure | The reset token already used |

### Logging without ever writing the password

A **log** is a file where the program writes what happens: requests received, errors, logins. It is read by developers, copied to other tools and kept for a long time: a password that enters it stays there.

| To log | Never to log |
|---|---|
| A login attempt, successful or not, with the username, the time, the IP address | The password entered, even if "incorrect": a typo is often the real password of another site |
| Reset requests, password changes | The reset token or the full link |
| Blocks and alerts from the attempt limiting | The entire body of a login or sign-up request |

Leaks often happen without anyone having decided it: a tool that records **all** requests, an error trace that displays the parameters received, an analytics tool that copies the fields of a form. The password fields must therefore be **explicitly excluded** from these records. Infrastructure secrets have their rules in [Secrets Management](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

### Refusing weak and known passwords

Validation is written on the **server** (the code that runs at the site): a check done only in the browser page is bypassed in a few seconds. The following code checks the length and refuses common passwords or those containing the username, without any composition rule. It uses a `Set` (a collection of values without duplicates, see [arrays](/?c=langages&s=javascript&p=tableaux)) and **Unicode** normalization (the standard that numbers all characters, see [Text Encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

```javascript
// Set of very common passwords, in lowercase (reduced list here)
const COMMON_PASSWORDS = new Set([
    "password", "123456", "123456789", "qwerty", "azerty",
    "mypassword", "azertyuiop", "letmein", "iloveyou", "111111",
]);

const MIN_LENGTH = 12;    // floor chosen by the site (NIST requires at least 8)
const MAX_LENGTH = 128;   // generous ceiling (at least 64): only refuses abuse

// Returns the list of problems with the password; empty list = "accepted"
function checkPassword(typed, username) {
    // normalize("NFKC") unifies the spellings of the same Unicode character (an "é" can
    // be a single letter or an "e" followed by an accent) before counting
    const password = typed.normalize("NFKC");
    // [...text] splits into whole characters: an emoji counts as 1, not 2
    const length = [...password].length;
    const lowercase = password.toLowerCase();   // to ignore capitals
    const problems = [];                        // empty list at the start

    if (length < MIN_LENGTH) {
        problems.push("Too short: at least " + MIN_LENGTH + " characters");
    }
    if (length > MAX_LENGTH) {
        problems.push("Too long: at most " + MAX_LENGTH + " characters");
    }
    if (COMMON_PASSWORDS.has(lowercase)) {  // has: true if present in the list
        problems.push("Password too common");
    }
    // includes: true if one text contains another; we refuse the username inside the password
    if (username && lowercase.includes(username.toLowerCase())) {
        problems.push("Must not contain the username");
    }
    return problems;
}

// No "one uppercase letter, one digit, one symbol" rule: only the length counts
console.log(checkPassword("azerty", "alice"));
console.log(checkPassword("alice-loves-cats", "alice"));
console.log(checkPassword("horse staple cloud knit", "alice"));
```

Output:

```text
[ 'Too short: at least 12 characters', 'Password too common' ]
[ "Must not contain the username" ]
[]
```

The list of ten words is a sample: a real site loads a file of thousands or millions of common passwords, or queries a service that knows the leaks. [Have I Been Pwned](https://haveibeenpwned.com/) offers this service without the password leaving the site, thanks to a technique of **prefix-based anonymity**: we compute the SHA-1 fingerprint of the password, we send only its first 5 characters, the service returns all the known suffixes that start that way, and the comparison is done on our side. This SHA-1 fingerprint is used only to query the service, never for storage.

```javascript
const crypto = require("node:crypto");   // cryptography module provided with Node.js

// True if the password appears in known leaks from Have I Been Pwned
async function isLeaked(password) {
    // SHA-1 of the password, in uppercase hexadecimal (the format expected by the service)
    const hash = crypto.createHash("sha1").update(password).digest("hex");
    const fingerprint = hash.toUpperCase();
    const prefix = fingerprint.slice(0, 5);   // first 5 characters: the only ones sent
    const suffix = fingerprint.slice(5);      // the rest never leaves our server
    // fetch sends an HTTP request; the service replies with the suffixes of this prefix
    const response = await fetch("https://api.pwnedpasswords.com/range/" + prefix);
    const text = await response.text();      // one "SUFFIX:COUNT" line per suffix
    // We look for our suffix among the lines received
    return text.split("\n").some((line) => line.startsWith(suffix));
}
```

An `async` function (declared with this keyword) can wait for the result of a slow operation with `await`, without blocking the rest of the program; `slice(a, b)` extracts a piece of text; `some` checks that at least one element of a list meets a condition. These notions are detailed in [the chapter on asynchronous code](/?c=langages&s=javascript&p=asynchrone) and [the one on strings](/?c=langages&s=javascript&p=strings). Two design decisions to write into the site's documentation: what to do if the service is unreachable (generally, accept the password rather than block sign-up), and refuse the password only at creation or change, not for an existing user who is logging in.

## Common mistakes, on the user side and on the site side

| Side | Mistake | Consequence | Fix |
|---|---|---|---|
| User | The same password on several sites | One leak opens all the accounts (credential stuffing) | A unique password per site, kept by a manager |
| User | Short "complex" password (`P@ssw0rd1!`) | Found by lists of common variants | Passphrase of 5 random words, or a long random password |
| User | Weak or reused master password | The whole vault falls at once | 6-word random passphrase, unique, with a second factor |
| User | No second factor on email | Resets of the other accounts go through it | MFA or a passkey on email first |
| User | Keeping the same password after a leak | The attacker already has the list | Change it everywhere it was used, enable the second factor |
| User | Giving one's password by message or phone | Successful phishing | Never give it; go through the official site |
| User | Answering security questions truthfully | Answers found on social networks | Random answer stored in the manager |
| Site | Composition rules and renewal every 90 days | Predictable passwords (`Autumn2026!`) | Minimum length, refusal of known passwords, no periodic renewal |
| Site | Forbidding pasting, or capping at 16 characters | Managers and passphrases unusable | Allow pasting, accept at least 64 characters |
| Site | "This account does not exist" message | Attackers build the list of accounts | Identical message in all cases |
| Site | Permanent block after 5 failures | An attacker locks someone else's account (denial of service) | Progressive delay, counters per account and per address |
| Site | Sending a password by email | It circulates and stays readable in the inbox | Random token link, single use, short lifetime |
| Site | Writing the password in the logs | Readable by everyone who reads the logs | Exclude password fields from all logging |
| Site | Storing in clear, or hashing with SHA-256 or MD5 | Readable passwords, or recovered within hours after a leak | Argon2id or bcrypt with a salt (see the chapter on hashing) |

## Summary

| Topic | The user | The site |
|---|---|---|
| Length | Passphrase of 5 words minimum | Accept at least 64 characters, minimum 8 or more depending on context |
| Complexity | Unnecessary if the password is long and random | Do not impose any composition rule |
| Uniqueness | One password per site, via a manager | Refuse passwords already compromised |
| Storage | Manager protected by a strong master password | Slow, salted hashing, never the password in clear |
| Second factor | MFA or passkeys wherever possible | Offer MFA and passkeys |
| Attempt-based attacks | Long random password | Progressive delays, counters per account and per IP |
| Recovery | Protected email, random security answers | Single-use, short-lived token, identical message |
| After an incident | Change everywhere, enable the second factor | Notify, close sessions, log without the password |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Believing a green strength meter is enough | It measures apparent complexity and lets `Password1!` through | Refuse known passwords rather than trust a colour |
| Trusting 4 words chosen "at random" by yourself | A human is not a random generator | Draw the words with dice or a generator |
| A password absent from a leak = a strong password | The check does not say that a password is strong, only that it is not already known | Combine the leak check with a minimum length |
| Master password without a recovery key | A forgotten password makes the vault permanently unreadable | Recovery key stored offline, and tested |
| Recovering an account by SMS or security questions | The recovery path becomes the weak point, despite a strong second factor | Same requirement for recovery as for login |
| Reset message that differs depending on whether the account exists | Enumeration of accounts | Same message, same response time |
| Silent truncation of long passwords (bcrypt: 72 bytes) | A 100-character passphrase protects no more than a 72-byte one | Read the library documentation and refuse, rather than truncate silently |
| Reset token that can be reused or never expires | An old link stays valid indefinitely | Single use, expiry, invalidation at each new request |
| Logging entire requests in case of a bug | Passwords end up in the logs | Exclude sensitive fields before any recording |
| Checking the password only in the browser | Bypassed in a few seconds | Always validate on the server |
| Forcing periodic renewal out of habit | More predictable passwords | Renew only after a proven compromise |

## Best practices

| Best practice | Why |
|---|---|
| User: a password manager, one random password per site | Removes reuse without requiring memory |
| User: passphrase of 5 words (6 for the master password), drawn at random | High length and easy to remember |
| User: second factor or passkey, starting with email | A stolen password is no longer enough |
| User: check your addresses on [Have I Been Pwned](https://haveibeenpwned.com/), act fast after a leak | The delay between a leak and an attack is short |
| User: random answers to security questions, stored in the manager | They can no longer be guessed |
| Site: minimum 8 characters or more, at least 64 accepted, pasting allowed | NIST recommendations |
| Site: refuse known or common passwords, with no composition rule and no periodic change | Avoids predictable passwords |
| Site: Argon2id or bcrypt with a salt, via the language's library | See the chapter on hashing |
| Site: progressive delay per account and per IP, never a permanent block | Slows brute force without denial of service |
| Site: identical error message and response time | No enumeration of accounts |
| Site: random, single-use reset token of 15 to 60 minutes, never a password by email | The most attacked path stays safe |
| Site: notification email at each change, logs without password | Quick detection, and no new leak through the logs |

## Key Takeaways

| | |
|---|---|
| **Remember** | The password is the weak link because of reuse, leaks, phishing and predictable choices; these weaknesses are exploited by brute force (online or offline), dictionary attacks, password spraying and credential stuffing. Strength is calculated: 7776^4 (3.7 × 10^15) is roughly equal to 94^8 (6.1 × 10^15), and 5 words are worth 4,664 times more, provided the draw is random. On the user side: a randomly drawn passphrase, a unique password per site, a password manager with a strong master password and a backup, MFA or passkeys, leak checks, changing everywhere after a leak, no sharing, random answers to security questions. On the site side: the NIST SP 800-63B recommendations (at least 8 characters, at least 64 accepted, pasting allowed, no composition rule or periodic renewal, refusal of known passwords) and the ANSSI guidance, salted slow hashing, progressive delays without denial of service, identical message, reset by a single-use, short-lived token, notification, logs without the password. |
| **Pitfalls to avoid** | Reused or "complex" but short password; weak master password; email without a second factor; truthful security answers; composition rules and periodic renewal; pasting forbidden; low length ceiling; error message that differs by account; permanent blocking of accounts; password sent by email; reusable or non-expiring token; password in the logs; silent truncation; validation in the browser only. |
| **Best practices** | Manager and random passphrase; second factor or passkey on email first; leak check; changing everywhere after a leak; site side: server-side validation (length, known passwords), Argon2id or bcrypt hashing, progressive delays per account and per IP, identical responses and timing, random single-use short-lived token, notification email, logs with sensitive fields excluded. |
