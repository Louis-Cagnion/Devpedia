---
order: 12
---

# Fingerprinting: recognizing a device without storing anything on it

A site usually recognizes a visitor by dropping an identifier into a [cookie](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) on their device, then reading it back on every visit. **Fingerprinting** achieves a similar goal (recognizing the same device from one visit to the next) but without storing anything at all: it combines a series of technical details the browser already exposes to form a near-unique signature.

## The principle: combining innocuous details, individually not very unique

Taken separately, none of the details below identifies anyone: millions of people share the same screen resolution, or the same time zone. But their **combination** quickly becomes unique:

| Detail collected | Example value |
|---|---|
| Screen resolution | 1920×1080 |
| Time zone | Europe/Paris |
| Browser language | en-US |
| Browser and OS version | Chrome 128 on Windows 11 |
| Installed fonts | List of 340 detected fonts |
| Graphics rendering (Canvas/WebGL) | Pixel fingerprint specific to the graphics card |

```text
Resolution + Time zone + Language + Browser + Fonts + Graphics rendering
        ↓ (combined and reduced to a single value, by hashing)
                    near-unique "fingerprint" of the device
```

> **Analogy:** none of a person's measurements (height, shoe size, eye color) identifies them alone among millions of individuals, but their precise combination narrows the field down to very few people. Fingerprinting does the same thing with technical browser characteristics.

## Canvas fingerprinting: a concrete example

A widely used technique has the browser draw, in an invisible element of the page, a specific text or geometric shape, then reads back the resulting pixels. The exact result depends on the graphics card, driver, and font-rendering engine installed, so much so that two different machines almost always produce a slightly different result, even from the same code:

```text
1. The site asks the browser: "draw this text in a hidden area"
2. The browser draws it, using its graphics card and fonts
3. The site reads back the resulting pixels, pixel by pixel
4. These pixels are reduced to a single fingerprint (hashing)
5. This fingerprint identifies the machine, without having stored anything on it
```

## Why this technique exists

| Use | Explanation |
|---|---|
| Fraud prevention | Recognizing an already-banned device even after its cookies are deleted or it switches to private browsing |
| Bot detection | A real browser produces a consistent, stable fingerprint; an automation bot often produces an inconsistent or missing one |
| Targeted advertising | Continuing to track a visitor from one site to another, even if they refuse or delete cookies |

> **Pitfall:** believing that refusing cookies or browsing in private mode prevents all tracking. Fingerprinting doesn't depend on any cookie: it stores nothing on the device, so there's nothing to delete or refuse via a simple cookie-consent banner.
>
> **Best practice (developer):** reserve fingerprinting for justified, documented defensive uses (anti-fraud, anti-bot), never as a quiet workaround for a tracking refusal expressed elsewhere (cookies declined). A disguised advertising use exposes you to the same legal framework as cookie tracking, with a trail far harder to justify after the fact to a user or a regulator.
>
> **Best practice (user):** some browsers (Firefox, Safari) actively reduce the precision of the available fingerprint (slightly randomized canvas results, fewer details exposed by default); a fingerprint-blocking extension can supplement this protection.

## 📋 Summary

| | |
|---|---|
| **To remember** | Fingerprinting recognizes a device by combining technical details the browser already exposes (screen, time zone, fonts, graphics rendering), without storing anything on it, unlike a cookie. |
| **Usable tools** | The anti-fingerprinting protections built into Firefox/Safari, or a dedicated extension. |
| **Pitfalls to avoid** | Believing that deleting your cookies or browsing privately prevents all tracking. |
| **Best practices** | Reserve fingerprinting for justified defensive uses (fraud, bots) rather than as a quiet workaround for a tracking refusal. |
