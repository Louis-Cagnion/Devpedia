---
order: 7
---

# Perceptual hashing: recognizing similar images, not identical ones

A [cryptographic hash function](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage) has a precise property: changing a single pixel of an image completely changes its result. Perfect for detecting that a file has been altered down to the bit, useless for answering a different question: "do these two photos show the same thing, even if one has been cropped, recompressed, or slightly edited?" That's the role of **perceptual hashing** (often abbreviated pHash): a hash function designed to produce **close** results when images are visually close, the opposite of a cryptographic function or a classic [hash table](/?c=langages&s=c&p=tables-de-hachage).

| | Cryptographic hashing | Perceptual hashing |
|---|---|---|
| Purpose | Detect the slightest alteration | Detect a visual resemblance |
| One pixel changes | Completely different result | Nearly identical result |
| Two visually close images | Unrelated results | Close results (few differing bits) |
| Typical use | Verify a file's integrity | Detect duplicates, an image already seen elsewhere |

## The principle, simplified version: average hash (aHash)

One of the simplest methods reduces an image to a 64-bit fingerprint in four steps:

```text
1. Shrink the image to a tiny grid (8x8 pixels), in grayscale
2. Compute the average brightness of these 64 pixels
3. For each pixel: 1 if lighter than the average, 0 if darker
4. Concatenate these 64 bits: this is the image's perceptual fingerprint
```

Shrinking the image to such a coarse grid deliberately eliminates fine detail (compression, slight cropping, a color filter) while preserving the image's overall light/dark structure: two photos of the same subject then produce a nearly identical fingerprint, even after these changes.

## Comparing two fingerprints: the Hamming distance

Two perceptual fingerprints are compared by counting the number of differing bits between them (the **Hamming distance**):

```text
Image A: 1 0 1 1 0 0 1 0 ...
Image B: 1 0 1 1 0 1 1 0 ...
                    ↑
         only 1 differing bit → near-identical images

Image C: 0 1 0 0 1 1 0 1 ...
         → almost all bits differ → unrelated images
```

The lower the distance, the visually closer the two images are; a threshold (say, fewer than 10 differing bits out of 64) lets you automatically decide whether two images count as "the same," without ever comparing them pixel by pixel.

## What it's used for

| Use | Explanation |
|---|---|
| Duplicate detection | Finding photos already present in a library, even recompressed or resized |
| Reverse image search | Tracing the origin of an image found online |
| Content moderation | Automatically blocking an image already flagged, even reposted in a slightly different format |

> **Pitfall:** using perceptual hashing as a security mechanism (authentication, proof of integrity). It's designed to tolerate small variations, not to resist deliberate manipulation: someone who knows the algorithm can slightly alter an image to make it produce a different fingerprint (or conversely make two different images' fingerprints match), something a cryptographic hash makes infeasible by design.
>
> **Best practice:** reserve perceptual hashing for similarity and deduplication uses, never for security; to verify that a file hasn't been altered, use a cryptographic hash like SHA-256, which answers a different need.

## 📋 Summary

| | |
|---|---|
| **To remember** | Perceptual hashing produces close fingerprints for visually close images, the opposite of a cryptographic hash, which changes radically at the slightest pixel modification. The Hamming distance between two fingerprints measures their resemblance. |
| **Usable tools** | Imaging libraries already implement aHash/pHash/dHash, without having to rewrite the algorithm yourself. |
| **Pitfalls to avoid** | Using perceptual hashing as a security mechanism or proof of integrity. |
| **Best practices** | Reserve perceptual hashing for similarity/deduplication; keep a cryptographic hash for integrity. |
