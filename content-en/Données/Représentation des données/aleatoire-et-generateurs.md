---
order: 5
---

# Randomness and Generators

A processor is a deterministic machine: identical inputs, identical outputs. It therefore cannot produce true randomness. What `random()` functions provide isn't randomness, but a sequence of **computed** numbers that statistically resembles randomness. Hence their exact name: **pseudo**-random number generators (PRNGs).

This distinction isn't a theoretical detail: confusing the two categories of generators is a classic security flaw.

## A PRNG is a deterministic sequence

A PRNG starts from an initial state, the **seed**, and applies a formula to produce each following value. Same seed, same sequence, always, on every machine.

```python
import random

random.seed(42)
print(random.randint(1, 100))   # 82
print(random.randint(1, 100))   # 15

random.seed(42)                 # starting over from the same seed
print(random.randint(1, 100))   # 82 -> identical
```

In C, `rand()` with no `srand()` implicitly uses seed `1`: a program run again produces **exactly the same sequence**. Hence the habit of seeding with the current time:

```c
srand(time(NULL));   // different seed every second
int roll = rand() % 100;
```

**This determinism is often a feature**, not a flaw:

- **scientific reproducibility**: fixing the seed makes it possible to exactly replay a model's training run (see [Model Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient));
- **tests**: a test that uses randomness must be reproducible to be diagnosable;
- **procedural generation**: an entire game world can be regenerated identically from a single seed.

## The predictable-seed pitfall

Seeding with `time(NULL)` has a downside: the time is **known to everyone**. If a session token is drawn from a PRNG seeded with a timestamp, an attacker who roughly knows the creation time only has a few thousand seeds to try to regenerate the whole sequence.

Worse: a classic PRNG is designed to be **fast and well distributed**, not unpredictable. With enough observed values, you can recover the internal state and **predict every subsequent value**. This isn't an implementation weakness, it's outside its design goals.

## Two families not to confuse

| | Classic PRNG | CSPRNG (cryptographic) |
|---|---|---|
| Goal | Speed, good distribution | Unpredictability |
| Predictable? | Yes, from the state | No, even knowing the outputs |
| Seed source | Often the clock | System entropy |
| C | `rand()` | `getrandom()`, `/dev/urandom` |
| Python | `random` | `secrets` |
| PHP | `rand()`, `mt_rand()` | `random_bytes()`, `random_int()` |
| JavaScript | `Math.random()` | `crypto.getRandomValues()` |

**The rule is simple and has no exception: as soon as a value must be unpredictable, use a CSPRNG.** This covers session tokens, CSRF tokens, password reset codes, salts, secret identifiers, keys.

```python
import secrets
token = secrets.token_hex(32)     # unpredictable
```

```php
$token = bin2hex(random_bytes(32));   // not uniqid() or mt_rand()
```

See PHP's [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite) chapter, where CSRF tokens rely precisely on `random_bytes()`.

> Conversely, don't use a CSPRNG to shuffle a display list or simulate a die roll: it's slower and consumes entropy for no benefit.

## Where does real entropy come from?

The operating system collects physical events that are hard to predict: precise intervals between keystrokes and hardware interrupts, thermal noise, and on recent processors a dedicated instruction ([`RDRAND`](https://en.wikipedia.org/wiki/RDRAND)). It feeds an entropy pool with this, exposed on Linux via [`/dev/urandom`](https://man7.org/linux/man-pages/man4/urandom.4.html).

This is where a CSPRNG draws its seed, and it's what makes it unpredictable: the seed itself follows no formula.

## The modulo bias

A subtle but real mistake: bringing a draw into a range with `%` **unbalances** the probabilities when the generator's range isn't a multiple of the interval.

```c
// rand() returns 0..32767, i.e. 32768 values
int roll = rand() % 3;   // 0..2
```

32768 isn't divisible by 3: the values `0` and `1` come up 10,923 times, the value `2` only 10,922 times. The bias here is negligible, but it becomes significant when the requested range approaches the generator's range.

The fix is to **reject** draws that fall in the excess zone, or more simply to use a function that does it for you:

```python
random.randint(0, 2)      # handles the uniform distribution
secrets.randbelow(3)      # same, cryptographic version
```

The same reasoning applies to `Math.random()` in JavaScript or `mt_rand()` in PHP: prefer the dedicated function over an improvised `%`.

## Summary

| Key point | |
|---|---|
| A PRNG is deterministic | Same seed → same sequence |
| Determinism is useful | Tests, scientific reproducibility, procedural generation |
| Seed = clock | Predictable: never for security |
| Value that must be secret | CSPRNG required (`secrets`, `random_bytes`, `crypto`) |
| Bringing into a range | Avoid raw `%`: modulo bias |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A classic PRNG is a deterministic sequence (same seed = same sequence): useful for tests and reproducibility, but never for a value that must stay secret. A CSPRNG draws its seed from system entropy, which makes it unpredictable. |
| **Tools you can use** | `secrets`/`random_bytes()`/`crypto.getRandomValues()` (CSPRNG) vs. `random`/`rand()`/`Math.random()` (classic PRNG). |
| **Pitfalls to avoid** | Using a classic PRNG (or a predictable seed like the clock) for a session token, a salt, or any value that must stay secret. |
| **Best practices** | Systematic CSPRNG as soon as a value must be unpredictable; use a dedicated function (`randint`, `randbelow`) rather than an improvised `%` to bring a draw into a range. |
