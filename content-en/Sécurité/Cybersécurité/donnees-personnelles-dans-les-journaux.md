---
order: 25
---

# Personal data in logs and copies (31/10/2026)

A **log** is the file where a program records what it does and what goes wrong, one line per event (see [log flooding](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inondation-de-logs) for the case where it writes too much). We read it to understand a failure. The problem this chapter deals with: by recording "what happened", the program also records **who** was concerned, and the log quietly becomes, without anyone having decided it, a second file of customers.

This chapter answers four questions: what personal data is, how it gets into a log, how it multiplies in copies (**satellites**, that is, copies kept by other applications, see below; backups; log aggregator, that is, a service that gathers the logs of many machines in one place), and how to prevent it, mask it or erase it. The examples run in [Python](/?c=langages&s=python&p=python), which you launch from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal); they rely on the [functions](/?c=langages&s=python&p=fonctions), the [lists and tuples](/?c=langages&s=python&p=listes-et-tuples), the [dictionaries](/?c=langages&s=python&p=dictionnaires-et-ensembles), the [loops](/?c=langages&s=python&p=boucles), the [classes](/?c=langages&s=python&p=poo), the [error handling](/?c=langages&s=python&p=gestion-des-erreurs) and the [modules](/?c=langages&s=python&p=modules-et-environnements). A last example shows the same problem in a content management system (Drupal), for illustration only. The authorization header that HTTP Basic sends with every request, one of the secrets that end up in a log, is described in [REST resource and HTTP Basic authentication](/?c=securite&s=cybersecurite&p=authentification-http-basic-et-ressource-rest).

> **This chapter is not legal advice.** It explains general principles and techniques. What a law requires in your situation (exact retention periods, legal bases, reporting obligations) depends on your country, your activity and your contracts. Decide it with a lawyer or, inside an organization, with its Data Protection Officer (the **DPO**, the person in charge of overseeing this compliance). No article number is cited here, because it cannot be verified here: the official text is linked below.

| Related topic | What the other chapter covers | What this chapter adds |
|---|---|---|
| [Secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets) | Where to store a password or an [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) key (the secret identifier that gives access to a service) | Keeping them from ending up in a log |
| [Secrets forgotten in production](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) | A public `.env` file, a secret left in the Git history | The secret that leaks through a log line |
| [ELK, log aggregation](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs) | Gathering and searching the logs of many machines | What was copied into it, and for how long |
| [The main families of vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles) | The big families of flaws | A leak that is not an attack: a design error |
| [Data governance for an AI system](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) | Classifying, keeping and erasing the data of an AI system | The general case of an ordinary application log |

## What is personal data

**Personal data** is any information that relates to an **identified or identifiable** natural person. "Identifiable" is the word that catches people out: a piece of data does not need to carry a name to be personal. It is enough that one can **trace it back to a person**, alone or by combining it with another piece of information.

| Data | Why it is personal | Where it slips into a log |
|---|---|---|
| Email address | It often points directly to a person (`first.last@...`) | Error message from a failed send, failed login form |
| [IP address](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) | It identifies a subscriber's connection at their internet provider; European authorities generally treat it as personal data | Access log of the **web server** (the program that receives a site's visits and answers them), line "connection from ..." |
| Internal identifier (user number) | It points to a row of the database that holds the rest | Every line "user 42 did ..." |
| Free text (message, comment, postal address) | A person writes anything in it: a name, a phone number, a health problem | Body of a request copied into an error |
| Session or cookie identifier | It follows a browser, so a person, from one page to the next (see [sessions and cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies)) | A **URL** or an [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) **header** (a line of information attached to a request) copied as is |
| Bank card number | It is tied to a holder; it is also a secret to protect | Payment refusal message, request body |

Three notions that look alike need to be told apart:

| Notion | Definition | Example | Still personal data? |
|---|---|---|---|
| Directly identifying data | Identifies the person without any effort | `lea.martin@example.org` | Yes |
| **Pseudonymized** data | The link to the person is replaced by a pseudonym; separate information (a key, a table) makes it possible to find the person again | `f88f55578bbde935` (see below) | **Yes**, as long as the link can be rebuilt |
| **Anonymized** data | No reasonable way to find the person, even by combining other sources | "1,200 connections this Tuesday" | No, but true anonymization is hard to achieve |

> **Pitfall:** believing that a "hashed" or "pseudonymized" piece of data has left the scope of data protection. As long as someone, somewhere, holds what is needed to rebuild the link (the key, the correspondence table, or simply the ability to guess the input), it stays personal data.

A personal data item is not a **secret** in the sense of the chapter on [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets). A secret (API key, password) gives power to whoever holds it; personal data concerns a person. A card number is both. The countermeasures in this chapter handle both families with the same filter, because they leak through the same paths.

## How personal data gets into a log

Nobody writes `log.info("here is Léa's email")` on purpose. Leaks almost always come from **messages useful for diagnosis** that copy a little too much context.

| Leak channel | What happens | Example (invented) |
|---|---|---|
| Message that copies the request | The developer wants to know "what it failed with" and writes the whole input | `Failed for request {"email": "lea@example.org", "message": "..."}` |
| Error trace with its parameters | A **trace** (*stack trace*) is the list of functions called at the moment of an [exception](/?c=langages&s=python&p=gestion-des-erreurs) (an error reported by the program); depending on the tool, it shows the values of the arguments, or the line of code with its values | `ValueError: invalid literal for int() with base 10: 'lea@example.org'` |
| URL with a token | A password reset URL contains a **token** (a secret value used once) in the address, and the web server logs the full address | `GET /reset?token=a1b2c3d4e5f6` |
| Request body | A debug mode records the **body** of every HTTP request (see [API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), payment form included | `POST /payment  card=4111 1111 1111 1111` |
| SQL query logged with its values | The maximum level of detail shows the [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) query with the values already inserted | `SELECT * FROM customers WHERE email = 'lea@example.org'` |
| Web server access log | Every request received records the visitor's IP address, the requested address and sometimes the login identifier | `203.0.113.7 - lea.martin [31/Oct/2026] "GET /account" 200` |
| Message from a third-party library | A library copies the recipient's address, or the authorization header that was sent, into its error message | `Sending failed: recipient <lea@example.org> unknown` |
| Error tracking tool | An external service automatically receives each exception with the context of the request | A copy outside your infrastructure |

Here is an extract of a log as it lies around on many servers. Each line contains something that should not be there:

```text
2026-10-31 09:12:03 INFO Login of lea.martin@example.org from 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refused
2026-10-31 09:13:10 ERROR Payment refused for card 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Order 1234 validated
```

Lines 1 to 3 contain, respectively, an email address and an IP address, a reset token, and a card number. Only line 4 is clean. Anyone who reads this file (a colleague debugging, a hosting provider, an attacker who found a file-read flaw, see [the main families of vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles)) gets this information without having attacked the database.

Three reasons make this risk more serious than it looks:

| Reason | Explanation |
|---|---|
| Logs are less protected than the database | More people access them (developers, support, host), often freely and without any trace of who read what |
| They last a long time with nobody looking after them | A database follows a business logic (you delete an account); a log file keeps growing until the disk is full |
| They are copied elsewhere automatically | The aggregator, the backup, the error tracking tool: see the next section |

## Copies: every replica is one more copy to protect and to erase

Data written once into the database rarely stays in a single place. The diagram below shows a common case: a **referential** (the database of record, where people are created and corrected) that sends its data to **satellites** (copies kept by other applications or other sites, so that they can work without calling the referential every time).

```
                          +-----------------------+
   User         --------->|  Application          |
                          |  (referential)        |
                          +----------+------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Satellite A |          | Satellite B    |          | Application   |
   | (copy)      |          | (copy)         |          | log           |
   +------+------+          +--------+-------+          +-------+-------+
          |                          |                          |
          v                          v                          v
   +-------------+          +----------------+          +---------------+
   | Backup      |          | Backup         |          | Log aggregator|
   | of A        |          | of B           |          | (ELK)         |
   +-------------+          +----------------+          +---------------+
```

Each box in this diagram may contain Léa's email address. The table below lists what that implies:

| Copy | Who controls it | How to erase it | Classic pitfall |
|---|---|---|---|
| Referential | The application team | A deletion request | The only copy people think of |
| Satellite | Sometimes another team, sometimes a third party | A deletion call to each one | The satellite is switched off or failing when the call is made |
| Application log | The application team | Rewrite the file, or let the **retention** (the length of time a file is kept before it is deleted) expire | A file where new lines are always written at the end, one after another, is not easy to correct |
| Log aggregator | The operations team | Delete by query in the index, or expiry | The index keeps a copy of what the file has lost |
| Backup | Operations, sometimes a provider | Often impossible line by line: wait for expiry | A restore brings back a person who was already erased |
| External error tracking tool | A third party | Its own retention rules | The data leaves your infrastructure |

Two practical consequences follow:

1. **Every copy must be protected**: access rights, [encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) (making the data unreadable without a key), retention period. A leak from the least watched copy is as bad as a leak from the database.
2. **Every copy must be erasable**, or expire quickly enough that the erasure takes effect without any action. A copy you cannot find is a copy you cannot erase.

The chapter on [AI systems](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) gives the same list of "places where the data may have been copied" for a prompt sent to a model. The logic is identical for an ordinary log.

## What the GDPR says, in short

The **GDPR** (General Data Protection Regulation, a European Union regulation applied since 2018) sets the rules for processing the personal data of people in the Union. In France, the authority that enforces it is the **CNIL** (Commission nationale de l'informatique et des libertés, the French data protection authority). A log that contains an email address is a **processing** operation on personal data like any other: it is subject to the same principles, even if nobody set it up for that purpose.

The general principles, translated for a log:

| Principle (general wording) | What it means for a log |
|---|---|
| **Data minimization**: collect only what is necessary | Log an internal identifier rather than an email; do not log the body of a request |
| **Storage limitation**: do not keep data longer than necessary | A set retention period, applied automatically |
| **Integrity and confidentiality**: protect against unauthorized access | Access rights on files, encryption, limited access to logs |
| **Purpose limitation**: use data only for the purpose it was collected for | An error log serves to debug, not to track a customer's behavior |
| **Right to erasure** ("right to be forgotten"): a person may ask for their data to be deleted, under conditions | A request must reach **all** copies, logs included |

What this table does not say, and what must be checked: the right to erasure is **not absolute** (a legal obligation to keep data may outweigh it), and some security logs may justify being kept longer than others. Likewise, a personal data breach may oblige you to notify the authority within a short deadline. The chapter [Reporting a vulnerability you found](/?c=securite&s=cybersecurite&p=signaler-une-faille-trouvee) gives the 72-hour benchmark and also refers to the official text.

| Where to read the text | Address |
|---|---|
| The regulation itself (European Union) | [GDPR on EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| The French authority and its practical guides | [CNIL](https://www.cnil.fr) |

## First defence: do not log it

The best protection for a piece of data is to **never write it**. Before masking anything, ask whether the data is useful for diagnosis.

| I would like to write | I can write instead | Why that is enough |
|---|---|---|
| The user's email address | Their internal identifier (`uid 42`) | You find the person in the database; if the row is deleted, the identifier no longer points to anyone |
| The full body of the request that failed | The **names** of the fields and their size (`fields: email, message; message: 412 characters`) | You know which field is the problem without knowing its content |
| The URL with its token | The URL without the part after `?` | The path is enough to locate the page |
| The raw message of a library | The **type** of the error and a code | The raw text may copy the input |
| The card number | The last four digits | Enough for support to recognize the card |
| The full IP address | The truncated address (`203.0.113.0`) | Useful to spot an abusive group of neighboring addresses; less precise for identifying someone |

The second lever is the **logging level**. A level is a severity threshold: the program classifies each message (from the most verbose `DEBUG` to the most serious `CRITICAL`) and writes only those that reach the threshold that has been set. Python numbers the levels:

| Level | Python value | Typical use | Risk for data |
|---|---|---|---|
| `DEBUG` | 10 | Details for the developer: SQL queries, request bodies | **The highest**: this is where the most context gets copied |
| `INFO` | 20 | Normal events: startup, login, order | Medium: the person's identifier often appears here |
| `WARNING` | 30 | Anomaly that does not stop the program | Medium |
| `ERROR` | 40 | An operation failed | Medium: the faulty input is often copied |
| `CRITICAL` | 50 | The program can no longer continue | Low in volume |

The following program logs the same SQL query at level `DEBUG` and two ordinary messages, first with the `INFO` threshold, then with the `DEBUG` threshold. It uses the [`logging`](https://docs.python.org/3/library/logging.html) module, which ships with Python (we call it the "standard library", see [modules](/?c=langages&s=python&p=modules-et-environnements)). Write each block to a file with the same name as its first comment, then run it with `python3 name.py`:

```python
# levels.py: shows the effect of the logging threshold
import logging  # logging module from the standard library
import sys      # gives access to standard output (the terminal screen)

# Writes the messages to the screen. The format is a line template:
# %(levelname)s is replaced by the level, %(message)s by the text.
logging.basicConfig(stream=sys.stdout, format="%(levelname)s %(message)s")
# Gets a logger named "shop" (the name is used to find it again).
logger = logging.getLogger("shop")

# Tries two thresholds: INFO (20) then DEBUG (10).
for level in (logging.INFO, logging.DEBUG):
    # Sets the threshold: any message below it is ignored.
    logger.setLevel(level)
    # Announces the current threshold (getLevelName gives the name of a level).
    print("--- level", logging.getLevelName(level), "---")
    # A DEBUG message. The %s marker is replaced by the argument that follows,
    # here the email, at the moment the message is written.
    logger.debug(
        "SQL query: SELECT * FROM customers WHERE email = %s",
        "lea@example.org",
    )
    # An INFO message, with no personal data.
    logger.info("Order 1234 validated")
    # An ERROR message, with no personal data.
    logger.error("Payment refused for order 1234")
```

Output obtained:

```text
--- level INFO ---
INFO Order 1234 validated
ERROR Payment refused for order 1234
--- level DEBUG ---
DEBUG SQL query: SELECT * FROM customers WHERE email = lea@example.org
INFO Order 1234 validated
ERROR Payment refused for order 1234
```

> **Pitfall:** leaving the `DEBUG` level active "temporarily" in production while looking for a bug, then forgetting it. For weeks, every SQL query and every request body goes into the logs, with the customers' data.
>
> **Best practice:** the default level in production is `INFO` or higher. Switching to `DEBUG` is decided for a short time, on a specific machine, and is undone at the end of the investigation.

## Second defence: mask with a filter

When a sensitive piece of data can still reach a message (because a library copies it, or a developer forgot), we place a **masking filter** (also called *redaction*) on the path of the log. It is code that reads each message **just before it is written** and replaces the sensitive patterns with a neutral value.

```
   logger.info("Login of lea@example.org")
                      |
                      v
              +-------------------+
              | Masking filter    |    looks for: email, token, card, IP
              +---------+---------+
                        |
                        v
        "Login of [MASKED]"  --->  file / screen / aggregator
```

To recognize patterns, we use **regular expressions** (*regex*), a notation that describes the shape of a text, for example "letters, an `@`, a domain" (see [regex in Python](/?c=langages&s=python&p=regex-en-python)). One subtlety with card numbers: any run of sixteen digits is not a card (an order number is one too). So we add the [**Luhn check**](https://en.wikipedia.org/wiki/Luhn_algorithm), a verification formula that real card numbers satisfy: starting from the right, double the second digit, the fourth, the sixth... (the last digit is not doubled; subtract 9 from a double that exceeds 9), add everything up, and the total must be a multiple of 10. An arbitrary order number usually fails this test and stays readable. The filter also handles the `Authorization: Bearer <token>` header, the usual way to present an access token to an API (see [web API security](/?c=securite&s=cybersecurite&p=securite-api-web)).

The patterns in the module below use regular expression notation. The table decodes the symbols; `re.compile(r"...")` prepares a pattern (the `r` before the quotes means the backslashes are kept as they are), and `pattern.sub(replacement, text)` replaces each part of the text that matches:

| Symbol | Meaning |
|---|---|
| `[abc]`, `[^abc]` | One character among those listed; with `^`, a character that is **not** in the list |
| `\w`, `\d`, `\s` | A word character (letter, digit or `_`), a digit, a space; in upper case (`\D`), the opposite |
| `+`, `?` | One or more of what precedes; zero or one (optional) |
| `{12,18}`, `{1,3}` | From 12 to 18 times, from 1 to 3 times what precedes |
| `\.` | A literal dot (without the backslash, the dot means "any character") |
| `\b` | A word boundary: the start or end of a word, without consuming a character |
| `(a\|b)` | A group that remembers what it finds; `\|` means "or", and `\1` refers to the first group in the replacement |
| `(?:...)` | A group used for grouping only, without remembering anything |
| `(?i)` | Case-insensitive: upper and lower case are not distinguished (at the start of a pattern) |

The first block writes the masking module:

```python
# masking.py: masks sensitive data in a text and in a log
import logging    # logging module from the standard library
import re         # regular expressions
import traceback  # builds the text of an error trace

# The text that replaces a masked piece of data.
MASK = "[MASKED]"

# Email address: local part, at sign, domain with at least one dot.
PATTERN_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")

# Sensitive URL or form parameter: name=value (token, password).
# password and pwd (short for "password") are two possible names.
PATTERN_PARAMETER = re.compile(
    r"(?i)\b(token|access_token|api_key|password|pwd)=([^&\s]+)"
)

# Bearer authorization header: the word Bearer, then the token.
PATTERN_BEARER = re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~+/=-]+")

# Run of 13 to 19 digits, separated or not by a space or a dash.
PATTERN_CARD = re.compile(r"\b\d(?:[ -]?\d){12,18}\b")

# IPv4 address (the four-number form): one to three digits each, separated by
# dots. Group \1 keeps the first three numbers; the fourth one is lost.
PATTERN_IPV4 = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b")


def luhn_sum_valid(digits):
    """Says whether a string of digits passes the Luhn check used for cards."""
    # Running total of the digits, after doubling one digit out of two.
    total = 0
    # reversed reads the digits from right to left; enumerate adds a rank (0, 1, 2...).
    for rank, digit in enumerate(reversed(digits)):
        # Converts the character to a number.
        value = int(digit)
        # Odd ranks (the 2nd, 4th... digit counting from the right) are doubled.
        if rank % 2 == 1:
            value *= 2
            # If the double is above 9, subtract 9.
            if value > 9:
                value -= 9
        # Adds the digit to the total.
        total += value
    # The number is valid if the total is a multiple of 10.
    return total % 10 == 0


def mask_card(match):
    """Replaces a run of digits only if it looks like a card number."""
    # match.group(0) is the whole text found by the pattern.
    # Removes spaces and dashes (anything that is not a digit: \D).
    digits = re.sub(r"\D", "", match.group(0))
    # Luhn check: if it passes, it is probably a card, so we mask it.
    if luhn_sum_valid(digits):
        return MASK
    # Otherwise (an order number, for example), we leave the text intact.
    return match.group(0)


def mask(text):
    """Applies all the masks to a text and returns the cleaned text."""
    # Replaces each email with the mask.
    text = PATTERN_EMAIL.sub(MASK, text)
    # Keeps the first three numbers of the IP, replaces the last one with 0.
    text = PATTERN_IPV4.sub(r"\1.0", text)
    # Keeps the parameter name (\1), masks its value.
    text = PATTERN_PARAMETER.sub(r"\1=" + MASK, text)
    # Keeps the word Bearer, masks the token.
    text = PATTERN_BEARER.sub("Bearer " + MASK, text)
    # Runs of digits go through the Luhn check.
    return PATTERN_CARD.sub(mask_card, text)


class MaskingFilter(logging.Filter):
    """Masks sensitive data in a record before it is written."""

    def filter(self, record):
        # record is the log record: the object the module builds for each message.
        # msg = the text, args = the values to insert into it (the %s),
        # exc_info = the current exception (type, value, trace), or None if there is none.
        # getMessage() inserts the arguments into the message; we mask the result.
        record.msg = mask(record.getMessage())
        # The arguments are already inserted: we empty them so they are not added twice.
        record.args = ()
        # An exception attached to the message is formatted later by the log.
        if record.exc_info:
            # We build the trace now (the star * unpacks the exc_info tuple
            # into three arguments), then mask it.
            trace = "".join(traceback.format_exception(*record.exc_info))
            # exc_text: the trace text that the log will write in place of its own.
            record.exc_text = mask(trace).rstrip("\n")
        # True means: keep this record and write it.
        return True
```

The `MaskingFilter` class inherits from [`logging.Filter`](https://docs.python.org/3/library/logging.html#filter-objects): the module calls its `filter` method for each message, and the message is written only if it returns `True`.

The second block replays six events, first without a filter, then with the filter placed on the **handler** (the component that actually writes the message to the screen or to a file):

```python
# before_after.py: same scenario, without and then with the masking filter
import logging  # logging module from the standard library
import sys      # gives access to standard output (the terminal screen)

from masking import MaskingFilter  # the filter written in masking.py

# Format of a line: the level, then the message.
FORMAT = "%(levelname)s %(message)s"


def make_logger(name, with_filter):
    """Creates a logger that writes to standard output, with or without filter."""
    # A named logger: two different names give two separate loggers.
    logger = logging.getLogger(name)
    # Lets INFO and above through.
    logger.setLevel(logging.INFO)
    # The handler writes to standard output.
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(FORMAT))
    # The filter is placed on the handler: it sees everything that goes out.
    if with_filter:
        handler.addFilter(MaskingFilter())
    # Attaches the handler to the logger.
    logger.addHandler(handler)
    return logger


def scenario(logger):
    """Replays events that leak personal data."""
    # An email passed as an argument of the message (it replaces the %s), and an IP
    # written directly in the text.
    logger.info("Login of %s from 203.0.113.7", "lea.martin@example.org")
    # A reset URL with its token.
    logger.warning("GET /reset?token=a1b2c3d4e5f6&lang=fr refused")
    # A test card number (valid for the Luhn check).
    logger.error("Payment refused for card 4111 1111 1111 1111")
    # A copied authorization header.
    logger.info("API call with the Authorization header: Bearer eyJhbGciOi.abc.def")
    # A 16-digit order number that is NOT a card.
    logger.info("Order no. 1234567890123456 recorded")
    # An exception whose message contains the email: int() tries to convert
    # a text into a number, and fails with a ValueError.
    try:
        int("lea.martin@example.org")
    except ValueError:
        # logger.exception writes an ERROR message followed by the trace of the exception.
        logger.exception("Read failed")


# First pass: without filter.
print("--- Without filter ---")
scenario(make_logger("without", False))
# Second pass: with filter.
print("--- With filter ---")
scenario(make_logger("with", True))
```

Run `python3 before_after.py` in the folder that contains both files. Output obtained (the full path of the file in the traces is shortened to `before_after.py`):

```text
--- Without filter ---
INFO Login of lea.martin@example.org from 203.0.113.7
WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refused
ERROR Payment refused for card 4111 1111 1111 1111
INFO API call with the Authorization header: Bearer eyJhbGciOi.abc.def
INFO Order no. 1234567890123456 recorded
ERROR Read failed
Traceback (most recent call last):
  File "before_after.py", line 44, in scenario
    int("lea.martin@example.org")
ValueError: invalid literal for int() with base 10: 'lea.martin@example.org'
--- With filter ---
INFO Login of [MASKED] from 203.0.113.0
WARNING GET /reset?token=[MASKED]&lang=fr refused
ERROR Payment refused for card [MASKED]
INFO API call with the Authorization header: Bearer [MASKED]
INFO Order no. 1234567890123456 recorded
ERROR Read failed
Traceback (most recent call last):
  File "before_after.py", line 44, in scenario
    int("[MASKED]")
ValueError: invalid literal for int() with base 10: '[MASKED]'
```

Reading the comparison:

| Event | Before | After | Remark |
|---|---|---|---|
| Email in an argument | `lea.martin@example.org` | `[MASKED]` | The message stays readable |
| IP address | `203.0.113.7` | `203.0.113.0` | The last number is truncated, not removed |
| Token in the URL | `token=a1b2c3d4e5f6` | `token=[MASKED]` | The parameter `lang=fr` is not touched |
| Bank card | `4111 1111 1111 1111` | `[MASKED]` | Passes the Luhn check |
| Bearer header | `Bearer eyJhbGciOi.abc.def` | `Bearer [MASKED]` | The word `Bearer` stays, the token disappears |
| 16-digit order number | `1234567890123456` | `1234567890123456` | Fails the Luhn check: kept, as intended |
| Exception trace | Email visible in the error message and in the code line | Masked everywhere | Thanks to the handling of `exc_info` |

### The limits of masking, observed by running the code

This filter is a **last safety net**, never the first defence. Two common oversights were reproduced. A reminder: in Python, loggers form a hierarchy by their name, separated by dots; `app.payment` is the **child** of `app`, and `app` is its **parent**. A second point: the `extra=` parameter of a logging call takes a dictionary of additional fields (`logger.info("text", extra={"field": value})`) that the format can then display with `%(field)s`.

```python
# traps.py: two places where a badly placed filter masks nothing
import logging  # logging module from the standard library
import sys      # gives access to standard output (the terminal screen)

from masking import MaskingFilter  # the filter written in masking.py

# The parent logger "app", with a screen handler.
parent = logging.getLogger("app")
parent.setLevel(logging.INFO)
parent.addHandler(logging.StreamHandler(sys.stdout))
# The filter is placed on the PARENT logger, not on the handler.
parent.addFilter(MaskingFilter())

# A message sent directly to the parent: it goes through the filter.
logging.getLogger("app").info("direct: lea@example.org")
# A message sent to a CHILD logger ("app.payment"): the filter is skipped.
logging.getLogger("app.payment").info("child: lea@example.org")

# Second case: a field added with the extra= parameter.
handler = logging.StreamHandler(sys.stdout)
# The format shows the message, then the "email" field added by extra=.
handler.setFormatter(logging.Formatter("%(message)s | %(email)s"))
other = logging.getLogger("other")
other.setLevel(logging.INFO)
# This time the filter is indeed placed on the handler.
handler.addFilter(MaskingFilter())
other.addHandler(handler)
# The filter masks the message, not the added fields.
other.info("extra", extra={"email": "lea@example.org"})
```

Output obtained:

```text
direct: [MASKED]
child: lea@example.org
extra | lea@example.org
```

| Limit | Cause | Workaround |
|---|---|---|
| The message of a child logger is not masked | A filter placed on a **logger** applies only to messages sent **directly** to that logger, not to its children | Place the filter on each **handler** |
| A field added with `extra=` is not masked | The filter above handles only the message and the trace | Do not put personal data in `extra`, or extend the filter |
| An unusual name or free text is not recognized | A regular expression can detect a shape (email, card), not "a first name" | Do not log free text at all |
| A false positive masks a useful value | A run of digits that passes the Luhn check by chance is masked | Accept the cost: better to mask too much than too little |
| An unexpected format gets through | An address written differently (`lea (at) example.org`) is not recognized | Keep a list of patterns, reviewed regularly |
| An IPv6 address is not masked | The pattern handles only IPv4; IPv6, the newer form of IP address, is written in hexadecimal separated by `:` (for example `2001:db8::1`) and passes through unchanged | Add an IPv6 pattern, or do not log the address |
| A version number is taken for an IP | `version 1.2.3.4` becomes `version 1.2.3.0`: four numbers separated by dots look like an IPv4 | Accept this false positive, or restrict the pattern to the context ("from ...") |
| The other handlers see the message already masked | The filter modifies the shared `record` object: the handlers called **after** the one carrying the filter receive the masked message, while those called **before** have already written it in clear (with three handlers, the second carrying the filter, the first writes the email in clear, the other two mask it) | Place the filter on each handler: each one masks before writing, whatever the order |
| The computing cost | Each message is re-read by several regular expressions | Measure it; mask at the handler level, after filtering by level |

> **Pitfall:** believing that a masking filter "solves" the problem, and stopping worrying about what you log. The filter misses everything it does not know how to describe.
>
> **Best practice:** combine three things: do not log the data (previous section), mask as a safety net, and **check** the result by periodically searching for leaks in existing logs (see the checklist below).

## Third defence: pseudonymize with an HMAC

Sometimes we need to **follow a person** through the logs ("all the errors from the same person this week") without writing their email. **Pseudonymization** replaces the identity with a stable pseudonym: the same person always gets the same pseudonym, but the pseudonym does not reveal who the person is.

The naive method is a plain hash (for example SHA-256, a function that turns a text into a fingerprint of fixed size; see [hashing and encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). It has a flaw: the space of plausible emails is small. An attacker computes the fingerprint of each candidate (a **dictionary attack**) and compares. The **HMAC** (*Hash-based Message Authentication Code*, described in [the cryptography chapter](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) combines the hash with a **secret key**: without the key, the attacker cannot compute the fingerprints of their candidates.

The code below handles **bytes** (the numbers from 0 to 255 in which a text is stored, see [text encoding](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)): a `b` prefix in front of quotes (`b"..."`) makes bytes, and `.encode("utf-8")` converts a text into bytes using the UTF-8 encoding.

```python
# pseudonym.py: a stable pseudonym that cannot be reversed without a key
import hashlib  # hash functions (SHA-256)
import hmac     # HMAC: a hash combined with a secret key

# Demo key (in bytes, thanks to the b prefix).
# In real life: read from a vault, never written in the code.
KEY = b"demo-secret-key"
# Another key, to show that it changes everything.
OTHER_KEY = b"another-secret-key"


def pseudonym(email, key):
    """Returns a stable pseudonym: HMAC-SHA256 of the normalized email, shortened."""
    # Normalizes: removes spaces, lowercases, converts to bytes.
    message = email.strip().lower().encode("utf-8")
    # Computes the HMAC, writes it in hexadecimal (0-9, a-f), keeps 16 characters
    # (64 bits: enough so that two people very rarely get the same pseudonym).
    return hmac.new(key, message, hashlib.sha256).hexdigest()[:16]


def simple_hash(email):
    """Returns the SHA-256 hash of the email, without a key (do not use it here)."""
    # Same normalization, but no key.
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:16]


# Same person, same key, but typed differently: same pseudonym.
print("same person, same key  :", pseudonym("Lea.Martin@example.org", KEY))
print("same person, typed     :", pseudonym(" lea.martin@example.org ", KEY))
# Another person: different pseudonym.
print("another person         :", pseudonym("hugo.durand@example.org", KEY))
# Same person, other key: different pseudonym.
print("same person, other key :", pseudonym("lea.martin@example.org", OTHER_KEY))

# A list of candidates that the attacker tries one by one.
candidates = ["hugo.durand@example.org", "lea.martin@example.org", "zoe.petit@example.org"]
# The two pseudonyms the attacker found in a stolen log.
target_simple = simple_hash("lea.martin@example.org")
target_hmac = pseudonym("lea.martin@example.org", KEY)

print("--- Attacker without the key ---")
for candidate in candidates:
    # Computes the simple hash of each candidate: no key is needed for that.
    if simple_hash(candidate) == target_simple:
        print("simple SHA-256: found ->", candidate)
    # For the HMAC, the attacker must guess the key: here, an invented key.
    if pseudonym(candidate, b"guessed-key") == target_hmac:
        print("HMAC: found ->", candidate)
print("end of attempts")
```

Output obtained:

```text
same person, same key  : f88f55578bbde935
same person, typed     : f88f55578bbde935
another person         : 81e519b456dc7446
same person, other key : db5650d3bab2869f
--- Attacker without the key ---
simple SHA-256: found -> lea.martin@example.org
end of attempts
```

| Property | Plain hash | HMAC with a secret key |
|---|---|---|
| Same person, same pseudonym | Yes | Yes (as long as the key does not change) |
| Recoverable by trying candidates | **Yes** (demonstrated above) | No, without the key |
| Depends on a secret to keep | No | Yes: the key must be stored like a [secret](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| Effect of changing the key | None | Every pseudonym changes: the link with the history is lost |
| Still personal data? | Yes | Yes, as long as the key exists or the candidates can be tested |

A pseudonym in a log is useless on its own. When you need to find the person (support wants to understand one customer's failure), you recompute the HMAC of their email and search the logs for that value. This one-way search is exactly what we want. Shortening the fingerprint to 16 characters keeps the lines readable, but the shorter the fingerprint, the more likely two different people are to get the same pseudonym (a **collision**): for a very large number of people, keep more characters.

> **Pitfall:** using a hash without a key, or a key written in the code and versioned, and believing the logs are "anonymous". An attacker who reads them tests the list of every email address they know.
>
> **Best practice:** a key dedicated to this use, stored outside the repository and outside the logs; a comparison with [`hmac.compare_digest`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) when you verify a value (this function compares two values in a time that does not depend on where they differ, which prevents guessing a secret by measuring response times), and the awareness that a pseudonymized log remains subject to the same rules as a plain-text log.

One useful detail: **destroying the key** makes the pseudonyms of a log impossible to verify for everyone, you included. It is an end-of-life tool for a log, not a guaranteed erasure. When faced with an erasure request, have this choice validated by a lawyer or a DPO.

## Fourth defence: retention period and restricted access

The **retention period** (seen above) is how long a log is kept before it is deleted. A log that is never deleted is a risk that keeps growing. In Python, **rotation** (closing the day's file, opening a new one, deleting the oldest ones) is provided by the standard library:

```python
# rotation.py: one file per day, at most 30 old files kept
import logging           # logging module from the standard library
import logging.handlers  # contains the handlers that rotate the files

# At midnight, the day's file is archived and a new one starts.
# backupCount=30: at most 30 old FILES are kept (not 30 days),
# the oldest beyond that are deleted.
handler = logging.handlers.TimedRotatingFileHandler(
    "app.log", when="midnight", backupCount=30, encoding="utf-8"
)
logger = logging.getLogger("shop")
# Without this line, the logger keeps the default threshold (WARNING, 30):
# INFO messages would be ignored and app.log would stay empty.
logger.setLevel(logging.INFO)
logger.addHandler(handler)
# An INFO message, which must appear in app.log.
logger.info("Order 1234 validated")
```

After `python3 rotation.py`, the `app.log` file created in the current folder contains the line `Order 1234 validated` (without `setLevel`, it would be created but would stay empty). The handler counts **files**, not days: rotation happens only at the first write after midnight, and a day with no message at all produces no file. Thirty files can therefore cover more than thirty days. For a strict retention in days, add a cleanup by date (delete the files older than the decided duration), or let the [logrotate](https://github.com/logrotate/logrotate) tool do it, which performs the same rotation on Linux for the files of any program.

| Log | Typical content | Retention, example value (invented) | Who decides |
|---|---|---|---|
| Debug log | Technical details, queries | A few days, never permanently in production | The technical team |
| Application log (`INFO` and above) | Events and errors | A few weeks | The team, with the lawyer |
| Web server access log | IP addresses, URLs | To set according to the purpose (security, statistics) | The DPO or the lawyer |
| Security log | Logins, authentication failures | Longer, justified by the purpose | The DPO or the lawyer |
| Backup | Full copy | The length of the backup cycle: known and short | Operations |

The values above are **invented orders of magnitude**, meant to illustrate the idea of a duration per type of log. They are not legal recommendations: the right duration is justified by the purpose of the log, and some texts may require certain logs to be kept (for a host or an operator, for example). Have this checked.

**Restricted access** complements retention: a log that few people can read leaks less.

| Measure | In practice | Why |
|---|---|---|
| File rights | The file is readable only by the service account and an operations group (see [file permissions](/?c=langages&s=bash&p=permissions-et-fichiers)) | Another account on the machine cannot read it |
| Access to the aggregator by role | Each team sees its own logs, not the others' | Fewer people exposed |
| Read trail | Knowing who consulted the sensitive logs | Detects abnormal use |
| No sending to a third-party tool without need | The data leaves your infrastructure | You lose control of erasure |
| Encryption of disks and backups | A stolen drive is unreadable | Protects the copies "at rest" |

## Fifth defence: propagate the erasure to every copy

When a person asks for their data to be erased, the operation must **reach every copy** (see the diagram of copies above). Two mistakes are common: deleting only from the referential, and forgetting the case of a copy that is temporarily unreachable.

The following simulation sets up a **referential** (an in-memory [SQLite](https://www.sqlite.org/docs.html) database: SQLite is a database engine that ships with Python and needs no server, that is, a separate program that runs permanently), two **satellites** (remote copies, here simple dictionaries) and a **log** (a text file). It erases Léa in four situations and counts, each time, the traces that remain, for Léa and for Hugo (who must never be touched).

The code uses two modules from the standard library: [`tempfile`](https://docs.python.org/3/library/tempfile.html), which creates a temporary folder deleted at the end, and `pathlib`, which represents a file path as an object (see [working with files and folders](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers)). The SQL queries there use a **parameter** `?`: the value is passed separately from the statement, never pasted into the SQL text, which prevents a crafted value from being run as a statement (this is [SQL injection](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql)).

```python
# erasure.py: an erasure that reaches the referential, the satellites and the log
import sqlite3   # SQLite database, included with Python
import tempfile  # temporary folder, deleted automatically at the end
from pathlib import Path  # file path handling


class Satellite:
    """A remote copy of the people, stored by external identifier."""

    def __init__(self, name):
        # The name of the satellite, for the messages (self is the object being created).
        self.name = name
        # The copies: external identifier -> email.
        self.copies = {}
        # True if the satellite answers; False simulates an outage.
        self.reachable = True

    def delete(self, external_id):
        """Deletes the copy; fails if the satellite is unreachable."""
        # A satellite that is down cannot delete anything: we signal an error.
        # The f before the quotes (f-string) replaces {self.name} with its value.
        if not self.reachable:
            raise ConnectionError(f"{self.name} does not answer")
        # pop with a default value: no error if the copy no longer exists.
        self.copies.pop(external_id, None)


def erase_log(path, patterns):
    """Rewrites the log without the lines that contain one of the patterns."""
    # Only to be done on a file that no program is writing to at the moment:
    # rewriting a "live" log can lose or damage lines.
    # Reads all the lines of the file.
    lines = path.read_text(encoding="utf-8").splitlines()
    # Keeps the lines that contain none of the patterns.
    kept = [line for line in lines if not any(pattern in line for pattern in patterns)]
    # Rewrites the file with the kept lines.
    path.write_text("\n".join(kept) + "\n", encoding="utf-8")
    # Returns the number of deleted lines.
    return len(lines) - len(kept)


def erase(person_id, email, base, satellites, log_file, complete):
    """Erases a person; with complete=False, only the referential is touched."""
    # Deletes the person; the ? is replaced by the value, passed separately.
    base.execute("DELETE FROM people WHERE id = ?", (person_id,))
    # "Naive" mode: we stop here (this is the mistake being shown).
    if not complete:
        return []
    # Satellites that could not be reached.
    pending = []
    for satellite in satellites:
        try:
            satellite.delete(person_id)
        except ConnectionError:
            # We note the satellite so the deletion can be replayed later.
            pending.append(satellite.name)
    # Also erases the log lines that quote the email.
    erase_log(log_file, [email])
    return pending


def count(base, satellites, log_file, email):
    """Counts the remaining traces of the email in each store."""
    # Number of rows of the referential that carry this email.
    in_base = base.execute(
        "SELECT COUNT(*) FROM people WHERE email = ?", (email,)
    ).fetchone()[0]
    report = {"referential": in_base}
    # Number of copies of the email in each satellite.
    for satellite in satellites:
        report[satellite.name] = sum(copy == email for copy in satellite.copies.values())
    # Number of occurrences of the email in the log file.
    text = log_file.read_text(encoding="utf-8")
    report["log"] = text.count(email)
    return report


def set_up_scene(folder):
    """Creates the referential, two satellites and a log that quote Léa."""
    # In-memory database: it disappears when the program ends.
    base = sqlite3.connect(":memory:")
    base.execute("CREATE TABLE people (id INTEGER PRIMARY KEY, email TEXT)")
    # Two people: Léa (1) and Hugo (2).
    base.execute("INSERT INTO people VALUES (1, 'lea.martin@example.org')")
    base.execute("INSERT INTO people VALUES (2, 'hugo.durand@example.org')")
    # Two satellites that received a copy of both people.
    satellites = [Satellite("satellite-north"), Satellite("satellite-south")]
    for satellite in satellites:
        satellite.copies = {1: "lea.martin@example.org", 2: "hugo.durand@example.org"}
    # A log of three lines: two quote Léa, one quotes Hugo.
    log_file = folder / "app.log"
    log_file.write_text(
        "INFO Login of lea.martin@example.org\n"
        "ERROR Failed to send to lea.martin@example.org\n"
        "INFO Login of hugo.durand@example.org\n",
        encoding="utf-8",
    )
    return base, satellites, log_file


def play(title, erase_requested, complete, south_reachable):
    """Sets up a fresh scene, erases Léa if asked, then shows what remains."""
    print(title)
    # Temporary folder: it is deleted when the with block ends.
    with tempfile.TemporaryDirectory() as folder_name:
        base, satellites, log_file = set_up_scene(Path(folder_name))
        # Simulates a possible outage of the second satellite.
        satellites[1].reachable = south_reachable
        pending = []
        if erase_requested:
            pending = erase(1, LEA, base, satellites, log_file, complete)
        print("  pending:", pending)
        print("  Léa  :", count(base, satellites, log_file, LEA))
        print("  Hugo :", count(base, satellites, log_file, HUGO))


# The two addresses used by the scenarios.
LEA = "lea.martin@example.org"
HUGO = "hugo.durand@example.org"
# Parameters: (title, erasure requested?, complete?, south satellite reachable?).
play("1. Before any erasure", False, True, True)
play("2. Referential only", True, False, True)
play("3. Complete, south satellite down", True, True, False)
play("4. Complete, all reachable", True, True, True)
```

Output obtained:

```text
1. Before any erasure
  pending: []
  Léa  : {'referential': 1, 'satellite-north': 1, 'satellite-south': 1, 'log': 2}
  Hugo : {'referential': 1, 'satellite-north': 1, 'satellite-south': 1, 'log': 1}
2. Referential only
  pending: []
  Léa  : {'referential': 0, 'satellite-north': 1, 'satellite-south': 1, 'log': 2}
  Hugo : {'referential': 1, 'satellite-north': 1, 'satellite-south': 1, 'log': 1}
3. Complete, south satellite down
  pending: ['satellite-south']
  Léa  : {'referential': 0, 'satellite-north': 0, 'satellite-south': 1, 'log': 0}
  Hugo : {'referential': 1, 'satellite-north': 1, 'satellite-south': 1, 'log': 1}
4. Complete, all reachable
  pending: []
  Léa  : {'referential': 0, 'satellite-north': 0, 'satellite-south': 0, 'log': 0}
  Hugo : {'referential': 1, 'satellite-north': 1, 'satellite-south': 1, 'log': 1}
```

| Scenario | What it shows |
|---|---|
| 1 | The starting state: Léa is present five times (referential, two satellites, two log lines) |
| 2 | The "classic" erasure removes only the referential row: Léa remains present in four other traces, spread over three places (two satellites, the log), and nobody sees it |
| 3 | A satellite is down: the deletion fails, **but the program knows it** and returns `['satellite-south']`, to be replayed |
| 4 | The complete case: no trace of Léa is left, and Hugo is intact |

What the simulation does not cover, and what must be planned for in reality:

| Case | Difficulty | Common practice |
|---|---|---|
| Unreachable satellite | The deletion must not be "lost" | A **queue** of deletions to replay until it succeeds, with an alert if it stays non-empty too long |
| Backups | You do not edit a backup line by line | A short retention, plus an **erasure register** replayed after each restore |
| Log aggregator | The index has its own copy | Delete by query in the index, or scheduled expiry |
| Pseudonymized log | The line no longer contains the email | Recompute the HMAC of the person's email and search for that value |
| Proof | Being able to say what was done | Keep a record of the request and its steps, **without** copying the erased data into it |
| Log being written | Rewriting `app.log` while the program writes to it can lose or damage lines | Rotate the file first (rotation), then clean up the old one, or rewrite a copy taken out of service |

> **Pitfall:** considering the erasure finished as soon as the deletion request to the database succeeds.
>
> **Best practice:** write the erasure as an explicit walk through **all** copies, which produces a report (who answered, who is pending), and test it with a simulation like this one.

## Example in a content management system: the Drupal log

> **Illustrative example.** **Drupal** is a content management system (software for building and running a website) written in [PHP](/?c=langages&s=php&p=php) (see [the official site](https://www.drupal.org/docs)). What follows describes its logging system; the names are checked against the Drupal 11.x source code. The general idea holds for any application.

In Drupal, a module writes to the log through a **channel** (a name that indicates where the message comes from), with **placeholder variables**: the text contains markers (`@mail`) and an array gives their values. The point is to avoid pasting uncontrolled text into the message. The `@` and `%` markers escape the content, and `:` is for URLs. The `dblog` module stores these messages in the database, in a table named `watchdog`, which you can view from the administration screen. That table also keeps, for each message, context information (user, address of the requested page, IP address of the visitor).

```php
<?php

/**
 * Generic example: reminder sent to a user.
 */
function example_send_reminder(int $uid, string $email): void {
  try {
    // Simulates the failure of a message sending.
    throw new \RuntimeException('Mail server unreachable');
  }
  catch (\Exception $e) {
    // To avoid: the address goes into the log, in clear, with its variable.
    \Drupal::logger('example')->error('Failed to send to @mail', [
      '@mail' => $email,
    ]);
    // Better: an internal identifier, which means nothing once the person is erased.
    \Drupal::logger('example')->error('Failed to send the reminder (uid @uid)', [
      '@uid' => $uid,
    ]);
  }
}
```

| Idea to remember | Why |
|---|---|
| A placeholder variable protects the **display**, not the **confidentiality** | The `@mail` marker stops HTML code from running when it is displayed, but the value of `$email` is still stored with the message |
| The log table holds other personal data | The IP address and the user of each message are personal data, in addition to the text |
| The log in the database is also a copy | It is in the database backups, and often in a satellite or an export |
| The number of lines kept can be set | A limit and a periodic cleanup (a scheduled task, see [cron](/?c=langages&s=bash&p=automatisation-cron)) act as retention: check it in the module settings |
| The internal identifier is better than the email | After the person is deleted, the number no longer leads anywhere |
| Do not log `$e->getMessage()` blindly | The message of a library may copy the recipient's address |

## Checking what already exists: looking for leaks already written

Setting up the filter protects the future. To find out what is **already** in the logs, we search them with [`grep`](/?c=langages&s=bash&p=traitement-de-texte) (a command that prints the lines containing a pattern; `-E` enables extended regular expressions, `-o` prints only the matching part, `-n` adds the line number, `-c` counts the lines). The following commands were run on the log extract shown above. The first one creates the file `log_example.log` with these four lines (`cat > file <<'END'` writes into the file everything that follows, up to the line `END`):

```bash
# Creates log_example.log with the four lines of the extract.
cat > log_example.log <<'END'
2026-10-31 09:12:03 INFO Login of lea.martin@example.org from 203.0.113.7
2026-10-31 09:12:41 WARNING GET /reset?token=a1b2c3d4e5f6&lang=fr refused
2026-10-31 09:13:10 ERROR Payment refused for card 4111 1111 1111 1111
2026-10-31 09:14:02 INFO Order 1234 validated
END
# Email addresses: letters, digits or . _ + - before the at sign, domain after.
grep -n -E -o '[[:alnum:]._+-]+@[[:alnum:].-]+\.[[:alpha:]]+' log_example.log
# Number of lines that contain a token or a password in the URL.
grep -c -E '(token|password)=' log_example.log
# IPv4 addresses: four numbers of 1 to 3 digits separated by dots.
grep -n -E -o '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' log_example.log
```

Output obtained:

```text
1:lea.martin@example.org
1
1:203.0.113.7
```

| Question to ask | How to check it |
|---|---|
| Which email addresses are lying around in the logs? | `grep` with the pattern above, on a recent sample |
| Tokens or passwords in URLs? | `grep -c -E '(token\|password)=' file`: any non-zero result must be dealt with |
| Does a satellite or a backup contain a person who was already erased? | Compare the list of erasures with the contents of the copies |
| Who can read the logs? | List the file rights and the aggregator's roles |
| How long is each log kept? | Review the rotation and expiry settings, and compare them with the decided duration |
| Does an external tool receive logs? | List the automatic sends (error tracking, monitoring) |

## Frequently asked questions

| Question | Answer |
|---|---|
| My logs are in JSON format (one object per line): does the filter in this chapter suffice? | No. The filter reads only the text of the message (and the trace). A piece of data stored in a JSON field (for example via `extra=`) is not touched: you must mask field by field, or better, never put the data there |
| Can we mask at the aggregator rather than in the application? | The lines can be transformed before being indexed (see [ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs)), but the original file stays in clear text on the machine and the data has already travelled: mask first at the source, and also at the aggregator if needed |
| And IPv6 addresses? | The pattern in this chapter handles only IPv4 (see the table of limits): you must add an IPv6 pattern, or not log the address |

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Logging the full body of a request "to debug" | It contains forms, passwords, card numbers |
| Leaving `DEBUG` active in production | SQL queries and request bodies go into the files |
| Logging `str(exception)` without thinking | The message of a library often copies the input |
| Putting a token in the address (`?token=...`) | The web server and intermediaries (proxies, servers placed between the visitor and the site) log the full address |
| Relying on the masking filter alone | It recognizes only the shapes it was given, not a name in free text |
| Placing the filter on a parent logger instead of the handler | Child loggers bypass the filter (reproduced above) |
| Putting personal data in `extra=` | The filter presented here handles only the message and the trace |
| Hashing an email without a key and calling it "anonymization" | A dictionary attack recovers the value (reproduced above) |
| Keeping the pseudonymization key in the code | Anyone who reads the repository can recompute the pseudonyms |
| Deleting only from the referential | Satellites, logs and the aggregator keep the person (scenario 2) |
| Ignoring a satellite that is down during erasure | The person stays in that copy, and nobody knows |
| Restoring a backup without replaying the erasures | An erased person reappears |
| Keeping logs "just in case" | The longer the retention, the greater the exposure |
| Sending logs to a third-party tool without having decided to | The data leaves the infrastructure, with its own retention rules |
| Taking this chapter for legal advice | Durations and obligations depend on the country and the activity |

## Best practices

| Practice | Effect |
|---|---|
| Ask, for each log line, whether the data is useful for diagnosis | The best protection is to write nothing |
| Log an internal identifier rather than an email or a name | After erasure in the database, the line no longer points to anyone |
| Log the names and sizes of fields, not their content | You can diagnose without seeing the data |
| `INFO` or higher in production, `DEBUG` only occasionally | Less context copied |
| A masking filter placed on each handler | Last safety net for email, token, card, IP |
| Pseudonymize with an HMAC and a key stored like a secret | Follow a person without naming them |
| Automatic rotation, with a duration decided per type of log | Logs do not pile up indefinitely |
| Restricted access rights, access to the aggregator by role | Fewer people exposed, reads traceable |
| Erasure written as a walk through all copies, with a report | No silent omission; a satellite that is down is replayed |
| An erasure register replayed after a restore | An erased person does not come back |
| Periodically search existing logs for leaks | Catches what the filter did not see |
| Have durations and obligations validated by a lawyer or a DPO | The chapter explains principles; it does not decide for you |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A **personal data** item is any information that makes it possible to trace back to a person: email, IP address, internal identifier, free text. It gets into a log through useful diagnostic messages that copy too much context: request, trace, URL with a token, request body, SQL query, access log. Each **copy** (satellite, backup, aggregator, external tool) is one more copy to protect and to erase. In short, the GDPR sets out **minimization**, **limited retention**, the **security** of the data, and a **right to erasure** that is not absolute. The official text, a lawyer or a DPO decide the details. Defences, in this order: **do not log**, logging **levels**, **masking** by filter (last safety net), **pseudonymization** by HMAC with a secret key (the pseudonym remains personal data as long as the link can be rebuilt), limited **retention**, **restricted access**, and **erasure propagated** to all copies, with a report. |
| **Pitfalls to avoid** | Logged request body; `DEBUG` left on in production; `str(exception)` copied; token in the URL; filter alone for reassurance; filter placed on a parent logger; data in `extra=`; unkeyed hash taken for anonymization; key versioned with the code; erasure limited to the referential; satellite that is down ignored; backup restored without replaying erasures; logs kept "just in case"; automatic sending to a third-party tool; this chapter taken for legal advice. |
| **Best practices** | Log an internal identifier, not the email; log field names, not their values; `INFO` by default; a masking filter on each handler; HMAC with a key stored like a secret; automatic rotation and a duration decided per type of log; strict access rights; erasure written as a walk through all copies, with a replay queue and a register replayed after a restore; periodic search for leaks in existing logs; durations and obligations validated by a lawyer or a DPO. |
