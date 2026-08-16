---
order: 2
---

# Social Engineering and Phishing

Not every flaw is technical: **social engineering** manipulates a person, rather than a machine, into carrying out the action the attacker wants (revealing a password, clicking a link, granting access). It bypasses any technical protection, however strong, because the weak link being targeted is human.

## The psychological levers exploited

| Lever | Principle | Example |
|---|---|---|
| Authority | Obeying someone who looks legitimate | An email signed "Management" or "IT Support" |
| Urgency | Preventing the target from taking time to verify | "Your account will be closed in 24h" |
| Fear | Pushing to act to avoid a negative consequence | "Suspicious activity was detected on your account" |
| Trust / familiarity | Impersonating a known contact | A message that looks like it's from a colleague or friend |
| Curiosity | Making the target want to click or open an attachment | "Here's the photo we talked about" |

## The main techniques

| Technique | Vector | Description |
|---|---|---|
| **Phishing** | Email | A message imitating a legitimate sender, with a link to a fake site or a booby-trapped attachment |
| **Spear phishing** | Targeted email | Phishing personalized for one specific person, using real information about them (name, role, ongoing project) |
| **Vishing** (*voice phishing*) | Phone | A call impersonating a bank, technical support, or an authority |
| **Smishing** (*SMS phishing*) | SMS | Same principle as phishing, over text message |
| **Pretexting** | Any | Inventing a credible scenario (fake technician, fake audit) to obtain information or access |
| **Baiting** | Physical or digital | Leaving an infected USB drive in a public place, or offering a booby-trapped free download |
| **Tailgating** | Physical | Following someone through a secured door as they open it |

Phishing is covered in more depth, including the typosquatting angle and a valid certificate on a fake domain, in the attack overview of [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite): this chapter covers social engineering as a discipline, of which phishing is only one technique.

## A concrete phishing example

```text
From:     support@paypa1-securite.com
Subject:  Action required: your account has been suspended

Hello,

We detected unusual activity on your account.
Click here to reactivate it within 24h: http://paypa1-secure-login.com/verify

The Support Team
```

| Suspicious clue | What it reveals |
|---|---|
| `paypa1` instead of `paypal` | Typosquatting: a domain that visually resembles the real one |
| Urgency ("within 24h") | A classic psychological lever, meant to prevent verification |
| Displayed link ≠ the company's official domain | Hovering over the link (without clicking) often reveals the real destination |
| Generic greeting ("Hello") | A company that already knows the customer usually addresses them by name |

## How to protect yourself

- Never click directly on a link received by email/SMS for a sensitive action (login, payment): open the official site yourself in a new tab, either by typing the address or through an already-saved bookmark.
- Check the full sender address, not just the displayed name (often faked with no link to the real address).
- Be wary of any unusual urgency or pressure: a legitimate company gives you time to verify.
- Confirm an unusual request (transfer, access, sensitive information) through a second, independent channel (call back on a number you already know, not the one given in the message).
- At work, report a suspicious message to the relevant team rather than silently deleting it: a report also protects other recipients of the same campaign.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Social engineering manipulates a person rather than a machine, relying on psychological levers (authority, urgency, fear, trust). Phishing (and its vishing/smishing variants) is its most common technique. |
| **Tools you can use** | Hovering over a link before clicking, checking the full sender address, already-saved bookmarks for sensitive sites. |
| **Pitfalls to avoid** | Clicking directly on a received link for a sensitive action; trusting only a sender's displayed name; giving in to artificial urgency. |
| **Best practices** | Confirm any unusual request through a second, independent channel; report a suspicious message instead of silently deleting it. |
