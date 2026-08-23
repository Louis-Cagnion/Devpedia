---
order: 5
---

# CTF: Capture The Flag

A **CTF** (*Capture The Flag*) is a computer security competition where solving each challenge earns a **flag**: a string proving the challenge was actually solved (e.g. `FLAG{buff3r_0v3rfl0w}`), submitted on a platform to score points. It's the most common training format for legally practicing the techniques covered in this category, on programs specifically designed to be attacked rather than on a real system.

## Two Main Formats

| Format | Principle |
|---|---|
| **Jeopardy** | Independent challenges, sorted by category, each with its own points; participants freely choose which ones to solve |
| **Attack-defense** | Every team receives the same services to run: it must both defend them (fix their flaws) and attack other teams' services to steal their flags, in real time |

The jeopardy format, simpler to organize and to follow solo, is by far the most common for individual learning; attack-defense is closer to a team exercise under near-real conditions.

## The Classic Categories of a Jeopardy CTF

| Category | What it covers |
|---|---|
| **Pwn** | Binary exploitation: [memory corruption](/?c=securite&s=securite-offensive&p=corruption-memoire) on a provided program |
| **Rev** | Reverse engineering ([disassembler/debugger](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie)): understanding a binary to extract hidden information |
| **Web** | Classic web flaws, see [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10) |
| **Crypto** | Attacking a poorly built cryptographic implementation |
| **Forensics** | Recovering hidden information from a file, a network capture, a disk image |
| **Misc** | Everything that doesn't fit elsewhere (often logic or programming puzzles) |

## The Link With Pentesting and Bug Bounty

A CTF shares the spirit of [pentesting](/?c=cybersecurite&p=tests-et-audit-de-securite) (attacking a system with the techniques of a real attacker) but in an entirely fictional and deliberately vulnerable setting, rather than on a real system under a written mandate: it's the place to practice without having to think about the legal framework at every step, since the framework is already that of the competition itself.

> **Best practice:** start with learning-oriented CTFs (with a detailed write-up available afterward) rather than competitive ones, to progress at your own pace without ranking pressure.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A CTF is a competition where each solved challenge earns a flag. The jeopardy format (independent challenges by category) dominates individual learning; attack-defense (defending your own services, attacking others' in real time) is closer to a team exercise. The classic categories overlap with the chapters in this section (pwn, rev, web, crypto) plus forensics and misc. |
| **Tools you can use** | A training CTF platform with write-ups available to progress after an unsolved challenge. |
| **Pitfalls to avoid** | Jumping into a competitive CTF before practicing the fundamentals of each targeted category. |
| **Best practices** | Read the write-up of an unsolved challenge after the competition instead of giving up: it's often the fastest way to progress. |
