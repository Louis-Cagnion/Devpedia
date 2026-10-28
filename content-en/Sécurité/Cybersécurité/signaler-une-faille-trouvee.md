---
order: 22
---

# Reporting a Vulnerability You Found on a Website: What the Law Allows and Responsible Disclosure (28/10/2026)

This chapter gives general guidance and is not legal advice: the law varies from one country to another and changes over time, and only a qualified person (a lawyer or legal adviser) can say what applies to a specific case; France serves as the main example, with guidance for the European Union and the United States.

A **flaw** (or *vulnerability*) is a defect in a system that lets someone make it act differently from what was intended (see [the main families of vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles)). The question addressed here is the one every curious person learning security asks: "Can I look for flaws on a website, then warn the people who run it by email or in another way, or is that illegal?" The answer depends less on what you do than on the **authorization** you have, and on how you warn afterwards. The site names in this chapter (`example.org`) are fictitious.

## The short answer

| Question | Short answer |
|---|---|
| Can I look for flaws on a site that is not mine? | In general **no, not without authorization**, even without bad intent: it is most often an offense |
| Can I warn the site's managers? | **Yes**, it is possible and useful, but reporting carries risks and does not erase what was done before |
| What makes the search legitimate? | An **explicit authorization**: a contract or test mandate, a disclosure policy or a reward program, within its precise scope |
| What if I stumble on a flaw without looking for it? | Stop, note the minimum, report **in private** through the designated channel, and publish nothing before the fix |

The rest of the chapter explains each line of this table.

## Why it is illegal: unauthorized access

An image helps. The door of a closed shop has a broken lock: going in "to warn the owner" is still entering a place where you had no right to be. In computing, it is the same logic: what matters is neither the technical difficulty nor the intention, but whether you were **authorized** or not.

In France, the **Code pénal** (French Criminal Code: the text that defines offenses and their penalties, available on [Légifrance](https://www.legifrance.gouv.fr/), the official French law website) devotes articles 323-1 and following to attacks on an **automated data processing system** (in practice, any computer system: a server, a site, an application, a database).

| Article | What it punishes (summary) |
|---|---|
| 323-1 | Accessing or remaining, **fraudulently**, in all or part of such a system |
| 323-2 | Hindering or distorting its operation (for example by overloading it, see [denial of service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| 323-3 | Fraudulently introducing, extracting, holding, reproducing, transmitting, deleting or modifying data in the system (to be verified on Légifrance for the exact list of acts) |
| 323-3-1 | Providing or holding, without a legitimate reason, tools designed to commit these offenses; the law cites security research and IT security among the legitimate reasons (to be verified on Légifrance) |
| 323-7 | The attempt is punished like the offense itself (to be verified on Légifrance) |

Penalties are imprisonment and fines; their amounts vary by article and by the law in force: read them on Légifrance rather than in a course.

Three words need clarifying:

| Word | Meaning |
|---|---|
| **Access** | Entering the system, even without breaking any protection: a simple attempt with credentials, or a guessed address, can be enough |
| **Remaining** | Staying in a system after realizing you are not allowed there: an access that came about by chance becomes a problem if you keep exploring |
| **Fraudulently** | Knowing that you are not authorized to do so: this is the moral element of the offense |

### What good intent does not erase

Wanting to warn the owner does not erase the offense: good intentions are not an authorization. Courts nevertheless take the context into account, and case law (all the decisions of the courts) is nuanced: good faith, the absence of damage and the way the report is made weigh on the decision and on the sentence, without preventing prosecution. A French case often cited, that of the **extranet** (the part of a site reserved for partners) of a public body, decided on appeal in 2014 and then by the **Cour de cassation** (the highest court for criminal matters) in 2015, also shows that a file that is **technically accessible** (with no password, found through a search engine) is not for that reason **authorized**: continuing to access it while knowing it was not meant for the public was judged to be fraudulent remaining in the system (to be verified on Légifrance for the details of the decision).

Here, from the most harmless to the most serious, is how one same subject breaks down. This table is a teaching estimate, never a court decision:

| Action on a site that is not yours | Legal risk | Why |
|---|---|---|
| Read what the page sends to every visitor (its **source code**, the text received by the browser, or an error message displayed spontaneously) | Low | Nothing is bypassed: the site sent this information to everyone |
| Run an **automated scanner** (a program that sends hundreds of test requests) | High | It is attack behavior, and it can disrupt the service |
| Guess a hidden address, or change a number in the address to see another person's page | High | You are trying to reach what was not meant for you |
| Try a default password or credentials | High | It is access by circumvention |
| Open, read or download third-party data | Very high | Data extraction, with in addition a privacy problem |
| Test on another person's account | Very high | Direct harm to a third party |
| Overload the site to "see if it holds" | Very high | Hindering its operation |

## Outside France

| Area | Benchmarks (to be verified on the official source) |
|---|---|
| European Union | A **directive** (a text that each member state must transpose into its own law) of 2013, numbered 2013/40/UE, requires punishing illegal access to information systems. The NIS2 directive (2022/2555) encourages coordinated disclosure and provides for a national **CSIRT**, an incident response team that serves as a trusted intermediary. The regulation on cyber-resilience (2024/2847; a European **regulation** applies directly, without going through a national law) requires manufacturers of digital products to handle vulnerability reports |
| United States | The *Computer Fraud and Abuse Act* (18 U.S.C. § 1030) punishes access "without authorization" or "exceeding authorization". A Department of Justice policy, published in 2022, says not to prosecute good-faith security research, but it is not a law: it prevents neither other types of prosecution nor a civil complaint |
| Elsewhere | Highly variable: some countries explicitly protect researchers, others do not. Several laws may apply at once (that of the person, that of the country where the server is) |

The European Union brings together countries whose laws are not identical: the European text sets a framework, and it is the national law that applies.

## What people typically come across by chance

Many reports come from an accidental discovery. Here are the common cases, with the chapter that explains the flaw:

| What you notice | The corresponding flaw |
|---|---|
| A page listing the contents of a folder (a **directory listing**) with sensitive file names | Exposed file or backup, see [forgotten secrets in production](/?c=securite&s=cybersecurite&p=secrets-oublies-en-production) |
| An access key (a secret) visible in the page's code | Exposed secret, see [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| An administration or data page displayed without a password | Broken access control, see [the OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| An error message revealing internal details (paths, version, query) | Information leak, see [the main families of vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles) |
| A very old version of a component known for a flaw | Vulnerable dependency, see [dependency security](/?c=securite&s=cybersecurite&p=securite-des-dependances) |

Noticing does not cross the line; opening, testing or digging can.

## What a disclosure policy changes

A **vulnerability disclosure policy** (abbreviated *VDP*, for *Vulnerability Disclosure Policy*) is a public text in which an organization says how to report a flaw to it, what it authorizes, and what it promises in return. A **bug bounty program** ("flaw hunting rewarded") goes further: it pays a reward, depending on severity, to whoever reports a valid flaw (see [bug bounty and pentesting](/?c=securite&s=cybersecurite&p=tests-et-audit-de-securite)).

These texts give an **explicit authorization**, but **only** within a precise scope (the addresses listed, the techniques permitted):

| Situation | Authorization to search | Reward | Good to know |
|---|---|---|---|
| No policy published | None | None | Searching remains risky; you can only report an accidental discovery |
| Disclosure policy (VDP) | Yes, within its scope | Often none (thanks) | Read the scope and the rules before any test |
| Bug bounty program | Yes, within its scope | Yes, depending on severity | Often managed by an intermediary platform, with its own rules |
| Mandated penetration test | Yes, by written contract | Payment to the provider | Framework set in advance (scope, hours, rules) |

A serious policy almost always contains:

| Element | What it says |
|---|---|
| **Scope** | The addresses and services authorized; everything else is forbidden, even under the same **domain name** (the part of the address that designates the site, such as `example.org`) |
| Forbidden techniques | For example denial of service, social engineering (see [phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)), access to other users' data |
| **Non-prosecution clause** (*safe harbor*, literally "safe port") | The organization promises not to prosecute whoever respects the rules |
| Contact and deadlines | Whom to write to, within what time it replies and fixes |

This clause binds only the organization that writes it: it binds neither the courts nor a third party whose data or systems would be affected (to be verified with a lawyer for a specific case). The best-known intermediary platforms:

| Platform | Role | Official address |
|---|---|---|
| YesWeHack | Connects organizations and researchers; French company | [yeswehack.com](https://www.yeswehack.com/) |
| HackerOne | Same; American company | [hackerone.com](https://www.hackerone.com/) |
| Bugcrowd | Same; American company | [bugcrowd.com](https://www.bugcrowd.com/) |
| Intigriti | Same; European company | [intigriti.com](https://www.intigriti.com/) |

### The `security.txt` file

When an organization has no program, it can still say where to report a flaw to it. The **`security.txt`** file is a small text file, defined by the standard **RFC 9116** (an **RFC** is a reference technical document of the Internet, [readable here](https://www.rfc-editor.org/rfc/rfc9116)), placed at the address `/.well-known/security.txt` of the site. The `.well-known` folder ("well known") is reserved for standard files that one looks for at a predictable location.

```text
# The lines that start with # are comments, ignored by readers
# Contact: where to write (mandatory); mailto: introduces an email address
Contact: mailto:securite@example.org
# Expires: end date of validity of the file (mandatory), ISO 8601 date format
Expires: 2027-06-30T23:00:00.000Z
# Encryption: the address of the public key used to encrypt the message
Encryption: https://example.org/.well-known/public-key.asc
# Policy: the address of the full disclosure policy
Policy: https://example.org/disclosure-policy
# Preferred-Languages: the languages accepted in the report
Preferred-Languages: fr, en
# Canonical: the official address of this file, to spot a forged copy
Canonical: https://example.org/.well-known/security.txt
```

| Field | Role | Mandatory |
|---|---|---|
| `Contact` | Email address, form or phone number to report | Yes |
| `Expires` | After this date, the file must no longer be trusted: it is probably abandoned | Yes |
| `Encryption` | Public key for encrypting the message (see [asymmetric encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) | No |
| `Policy` | Link to the disclosure policy | No |
| `Preferred-Languages` | Languages understood | No |
| `Canonical` | Official address of the file | No |
| `Acknowledgments` | Page thanking the people who reported a flaw | No |

It must be served over **HTTPS** (the encrypted version of HTTP, see [APIs and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)), so that no one can substitute a fake contact. Warning: a `security.txt` says **where to report**, it does not authorize testing; the authorization comes from the policy it references, if there is one.

## Coordinated disclosure

**Disclosing** a flaw means making it public. Three attitudes exist:

| Model | Principle | Advantage | Risk |
|---|---|---|---|
| Immediate disclosure (*full disclosure*) | Publish everything right away | Maximum pressure to fix | Attackers exploit the flaw before the **fix** (*patch*, the update that removes it): users are exposed |
| **Coordinated disclosure** (called "responsible") | Report **in private**, allow a reasonable time to fix, publish after the fix or after an announced deadline | Users are protected before the flaw becomes known | Requires patience; the organization may drag its feet |
| Silence | Tell no one | Little risk for oneself | The flaw remains open, and others may find it |

The **ISO/IEC 29147** standard describes how to receive and publish information about a vulnerability, and **ISO/IEC 30111** how to handle it internally; coordinated disclosure is the practice that these standards organize.

The deadline is set in advance and adjusted. A 90-day period is often cited in the industry (for example by Google's security team), but it is not a rule of law: a flaw already exploited by attackers justifies a shorter deadline, and a complex fix may require a longer one. Once the flaw is fixed and published, it may receive a **CVE** identifier in the public catalog of known flaws (see [the main families of vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles)).

## In France: the ANSSI and the CERT-FR

The **ANSSI** (*Agence nationale de la sécurité des systèmes d'information*, the French national agency for information systems security) is the state service in charge of cybersecurity ([official site](https://cyber.gouv.fr/)). The **CERT-FR** is the government center for monitoring, alerting and responding to computer attacks, attached to the ANSSI ([official site](https://www.cert.ssi.gouv.fr/)). *CERT* stands for *Computer Emergency Response Team*, a team that responds to computer emergencies.

| What we know | What to check on the official site |
|---|---|
| The CERT-FR offers a system for reporting vulnerabilities | The exact address, any form, and the key to encrypt the message |
| It publishes advisories and security alerts about known flaws | Who may report, and for which types of systems |
| It can act as an intermediary when no contact is found | What it does next with the report (forwarding to the organization, deadlines) |
| A 2016 French law on digital matters protects the confidentiality of whoever reports in good faith to the ANSSI (article L. 2321-4 of the *Code de la défense*, French Defence Code) | The exact text and its scope: it organizes reporting, it does **not authorize** an access made without right after the fact |
| The CNIL (*Commission nationale de l'informatique et des libertés*, the French data protection authority, [cnil.fr](https://www.cnil.fr/)) handles personal data breaches | Its precise role in each case |

Outside France, the same role is played by the national CERT or CSIRT, for example the [CISA](https://www.cisa.gov/) in the United States; at European level, the agency [ENISA](https://www.enisa.europa.eu/) publishes resources.

## How to report in practice

### Whom to write to

We search in this order, stopping at the first contact found:

| Order | Where to look | Remark |
|---|---|---|
| 1 | A "security" page or a disclosure policy on the site | Read the scope and the rules before writing |
| 2 | The `/.well-known/security.txt` file | Check the `Expires` date |
| 3 | A dedicated address (by convention `security@` followed by the domain name) or the contact page | Avoid the customer support address, read by many people |
| 4 | The bug bounty platform cited by the organization | Follow its submission rules |
| 5 | The national CERT (in France, the CERT-FR) | If no contact exists or if the organization does not reply |
| 6 | For a free library: the `SECURITY.md` file or the private reporting of the code repository (see [GitHub and platforms](/?c=qualite-performance-et-outils&s=git&p=github-et-plateformes)) | A flaw in a dependency is reported to its **maintainers** (the people who run the project) (see [dependency security](/?c=securite&s=cybersecurite&p=securite-des-dependances)) |

Never on a social network, a forum, a public comment or a ticket visible to everyone: that would publish before the fix.

### Encrypt when you can

If the `security.txt` or the policy provides a **public key**, the message is encrypted with it: only the organization, which holds the matching private key, can read it (see [asymmetric encryption](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). The common standard for email is **OpenPGP** ([openpgp.org](https://www.openpgp.org/)). Without a key provided, write a sober message (where, what, impact) and avoid attaching details that would allow a careless reader to reproduce the flaw; propose a secure channel for the follow-up.

### What to put in the message

| Item | Content | Why |
|---|---|---|
| [1] Subject | A clear line: "Security report: ..." | The email is not taken for spam |
| [2] Where | The precise address (URL), the date and time of the discovery | Lets the team find the problem in the **logs** (the files where the server records what happened) |
| [3] What | What you saw, in one or two sentences | The team understands what it is about |
| [4] Reproduce | The **minimal** steps, without exploiting the flaw | Prove it without going further |
| [5] Impact | What an attacker could do, without having done it | Sets the priority |
| [6] Data | No third-party data attached, in the text or in a screenshot | Do not spread personal data |
| [7] Next steps | A proposed publication deadline and a contact to reply | Sets up coordinated disclosure |

```text
[1] Subject: Security report: directory listing on www.example.org

Hello,

[2] On 28/10/2026, around 2 p.m. (Paris time), I noticed that the address
    https://www.example.org/sauvegarde/ displays the list of files in the folder.
[3] This list contains a file named "customers-2026.sql".
[4] To see this, open the address above in a browser.
[5] If this file is indeed a copy of the customer database, anyone
    could download it.
[6] I have not opened or downloaded any file, and I am not attaching any data.
[7] I suggest publishing nothing before your fix, or at the latest within
    90 days without a reply from you. You can reply to this address.

Best regards,
First Name Last Name
```

The example illustrates the **minimal proof**: the page itself is enough to prove the flaw, there is no need to open the file, and doing so would change the nature of the act.

## The path of a report

```text
1. Discovery            by chance, or within an authorized scope
        |               stop: do not go further than necessary
        v
2. Minimal proof        address, date, time; no third-party data
        |
        v
3. Contact              policy, security.txt, platform or national CERT
        |               private message, encrypted if a public key is provided
        v
4. Acknowledgment       the organization confirms it received the message
        |               no reply: follow-up, then national CERT
        v
5. Fix                  the organization fixes the flaw; discussion of the deadline
        |
        v
6. Publication          after the fix, or after the announced deadline
```

## What we never do

| Forbidden | Why | What remains allowed |
|---|---|---|
| Download or keep third-party data | Infringes their privacy, and is data extraction within the meaning of the law | Describe what you saw, without copying it |
| Test on other people's accounts | You directly affect a third party | Create your own test accounts, if the policy allows it |
| Cause a denial of service or a load test | Hinders the service | Nothing: it is almost always excluded from policies |
| Go further than the minimal proof (pivot to other systems, install yourself, stay connected) | Each further step aggravates the access | Stop as soon as the flaw is established |
| Extort: demand money in exchange for silence, threaten to publish | This looks like extortion or blackmail, serious offenses | Accept a reward **provided for** by a bug bounty program |
| Publish before the fix or before the announced deadline | Exposes users | Publish after the fix, by mutual agreement |
| Ignore the scope of a bug bounty | Out of scope, the authorization disappears | Only touch the listed addresses, or ask in writing |
| Trap the site's people (fake messages, see [phishing](/?c=securite&s=cybersecurite&p=ingenierie-sociale-et-phishing)) | Outside the framework of almost any policy | Stay on the purely technical point |
| Sell the flaw to third parties | Serious criminal risk and harm to users | Report it to the owner |

## For the website owner

This chapter is also addressed to the people who run a site: they are the ones who make reporting easy, or discourage it.

| Action | Why | How |
|---|---|---|
| Publish a disclosure policy | Clearly states what is authorized and under which conditions | A page on the site: scope, rules, contact, deadlines |
| Publish a `security.txt` | A researcher finds the contact in seconds | `/.well-known/security.txt`, with `Expires` to be renewed |
| Monitor the contact address | An ignored report sometimes ends up published | A dedicated address, read by more than one person |
| Reply quickly | An acknowledgment reassures and avoids a hasty publication | In practice within a few working days |
| Fix and keep the researcher informed | The researcher can then publish with your agreement | Give a fix date, even an approximate one |
| Thank the researcher | Encourages future reports | A thanks page (`Acknowledgments`) |
| Do not threaten a good-faith researcher with prosecution | It discourages any report, and the flaw remains open | Write a non-prosecution clause into the policy |
| Notify if personal data is affected | The **GDPR** (the European regulation on personal data protection) requires notifying the authority (in France, the CNIL) within 72 hours, depending on the risk (article 33, to be verified on the official site) | Keep proof of the discovery date |

## What to do if I come across a flaw by chance?

| Situation | What to do | Why |
|---|---|---|
| I noticed a visible defect without forcing anything | Note the address, date and time; do not explore; look for the contact | Noticing does not cross the line |
| The site has a bug bounty or a policy | Read the scope, follow the rules, file the report through the indicated channel | The authorization exists, but only within the scope |
| I would like to check whether it is really exploitable | Do not do it alone; **ask in writing** for a test authorization | Without authorization, testing is the risky act |
| I have already opened or downloaded third-party data | Stop, do not spread or send them, do not mention them in the message, ask a lawyer for advice before acting | Copies are evidence against me and a harm to third parties |
| I find no contact | Write to the national CERT (CERT-FR in France), check the procedure on its site | It acts as an intermediary (to be verified on the official site) |
| No reply after several days | Follow up through the same channel, then go through the national CERT; do not publish | Silence does not authorize publication |
| I am threatened with prosecution | Keep the exchanges, publish nothing in retaliation, consult a lawyer | Publishing in anger makes the situation worse |
| The flaw is in a system of my employer or my client | Go through the internal channel (security manager, contract) | The contract may already set the rule |
| I want to practice without risk | Use a CTF or a lab of your own (see [the CTF](/?c=securite&s=securite-offensive&p=ctf-capture-the-flag) and [web exploitation from the attacker's side](/?c=securite&s=securite-offensive&p=exploitation-web-cote-attaquant)) | The framework is designed for this |

## Summary

Searching for flaws in a site that is not yours is generally illegal for lack of authorization, even with good intentions; an accidental discovery is reported in private, with minimal proof and without touching third-party data. A reward program or a disclosure policy gives an authorization, but only within its scope; the `security.txt` file says where to write. Coordinated disclosure leaves time to fix before publishing, and organizations make all this possible by publishing a policy, replying quickly and not threatening people acting in good faith. In France, the CERT-FR of the ANSSI is the recourse when no contact exists.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| "I warned them nicely, so it is legal" | The report does not erase the unauthorized access that preceded it, and it can serve as evidence of that access |
| Believing that an address without a password is authorized | Technically accessible does not mean authorized; continuing to go there is fraudulent remaining in the system |
| "I'm just testing a little to be sure" | Every test is an act: verifying is what makes the situation risky |
| Running a scanner "to help" | A scanner acts like an attack and can disrupt the service |
| Asking for money on a site without a reward program | It can be seen as extortion |
| Believing that a bug bounty authorizes the whole domain | Only the items listed in the scope are authorized (a subdomain or a third-party provider is not necessarily part of it) |
| Believing that a non-prosecution promise binds the courts and third parties | It binds only the organization that gives it (to be verified with a lawyer) |
| Publishing after a certain number of days without warning | Coordinated disclosure requires an announced deadline and a final reminder |
| Attaching screenshots containing personal data | You yourself spread the data you were supposed to protect |
| Relying on an outdated `security.txt` | A file whose `Expires` date has passed is no longer guaranteed |
| Taking this chapter for legal advice | The benchmarks are general: the law changes and each case is particular |

## Best practices

| Best practice | Why |
|---|---|
| Read the disclosure policy and its scope **before** touching anything | The authorization exists only within that framework |
| Practice on your own systems, CTFs or labs designed for this | No legal risk, and the same skill |
| Note the address, date and time, and stop at the minimal proof | A precise report without excess |
| Write a short, neutral and factual message, without threats or money demands | It will be taken seriously, and the relationship stays healthy |
| Encrypt the message when a public key is provided | Only the organization reads the details |
| Keep exchanges in writing | A useful record in case of disagreement |
| Respect the announced deadline, and warn before publishing | The very principle of coordinated disclosure |
| Ask a lawyer for advice **before** going further if in doubt | Afterwards, it is harder to correct |
| On the site side: publish a policy and a `security.txt`, reply quickly and do not threaten | Reporting becomes easy and the flaw gets fixed |

## Key Takeaways

| | |
|---|---|
| **To remember** | Searching for a flaw without authorization on a site that is not yours is generally illegal, even without bad intent: in France, articles 323-1 and following of the Code pénal target fraudulent access to or remaining in an automated data processing system. A disclosure policy or a bug bounty program gives an explicit authorization, within a precise scope. The `security.txt` file (RFC 9116, at `/.well-known/security.txt`) gives the security contact. Coordinated disclosure means reporting in private, allowing time to fix, then publishing; it is opposed to immediate disclosure. The CERT-FR of the ANSSI is the recourse in France (procedure to be verified on the official site). A good report states where, what, how to reproduce it briefly and the impact, without third-party data. |
| **Pitfalls to avoid** | Believing that warning nicely makes what was done legal; confusing accessible with authorized; scanning or testing "to help"; asking for money outside a reward program; ignoring the scope; publishing before the fix; attaching personal data; relying on a non-prosecution promise as if it were a law. |
| **Best practices** | Read the policy before any test; practice within a framework designed for it; stop at the minimal proof; write a sober message, encrypted if a key is provided; respect the announced deadline; ask a lawyer when in doubt; on the site side, publish a disclosure policy and a `security.txt`, reply quickly and do not threaten people acting in good faith. |
