---
order: 7
---

# Advanced Fuzzing Tools

[Security Testing and Auditing](/?c=cybersecurite&p=tests-et-audit-de-securite) introduced the principle of **fuzzing**: bombarding a program with unexpected input to trigger a crash that reveals a flaw. This chapter goes further, on the actual tooling side: how a modern fuzzer (AFL, libFuzzer) does far better than simply trying inputs at random.

## Coverage-Guided Fuzzing

A purely random fuzzer generates inputs with no feedback on their effect: most of them only ever test the very first paths of the program (e.g. a format check that rejects the input before it even reaches the interesting code). A **coverage-guided** fuzzer instruments the program to know, on every run, which lines of code were reached, then favors mutations that explore new paths never reached before.

```text
1. The fuzzer keeps a set of "interesting" inputs (the corpus), minimal at the start
2. It mutates an input from the corpus (changes a byte, adds one, removes one...)
3. It runs the program with this mutated input, measuring the code coverage reached
4. If this mutation reaches code never covered before -> added to the corpus, will in turn
   become a basis for future mutations
5. If the program crashes -> the exact input responsible is saved for analysis
```

This loop explains why a coverage-guided fuzzer finds, in a few hours, paths that a purely random fuzzer would never reach in several years: each useful discovery becomes the starting point for the next one, instead of starting over from scratch every time.

## Sanitizers: Detecting Corruption Even Without a Crash

A [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire) that only overwrites a neighboring byte without crashing the program stays invisible to a fuzzer that only watches for crashes. A **sanitizer** (e.g. *AddressSanitizer*, ASan) recompiles the program with extra checks that detect this kind of invalid memory access the moment it happens, even if it wouldn't otherwise have caused any visible crash:

| Without a sanitizer | With a sanitizer |
|---|---|
| The overflow silently overwrites neighboring data, the program continues normally | The overflow is detected immediately, the program stops with a precise report (file, line, error type) |

## Triage: Telling a Real Bug From a Duplicate

A fuzzing campaign can generate thousands of crashes in a few hours, many of which actually share the same root cause. **Triage** consists of grouping these crashes by their actual cause (often via the call stack at the time of the crash, see [How a Program Actually Executes](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)), so each distinct bug is only handled once instead of as thousands of occurrences of the same problem.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A coverage-guided fuzzer favors mutations that explore code never reached before, far more effective than a purely random attempt. A sanitizer detects memory corruption even without a visible crash. Triage groups discovered crashes by actual cause instead of handling them one by one. |
| **Tools you can use** | AFL or libFuzzer for coverage-guided fuzzing; AddressSanitizer to detect silent corruption. |
| **Pitfalls to avoid** | Fuzzing without a sanitizer enabled: most memory corruption doesn't cause any immediate crash and goes unnoticed. |
| **Best practices** | Start a fuzzing campaign with a relevant initial corpus (real valid inputs) rather than an empty one, to reach useful code faster. |
