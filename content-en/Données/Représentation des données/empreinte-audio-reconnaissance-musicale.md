---
order: 8
---

# Audio fingerprinting: recognizing a song in a few seconds

[Perceptual hashing](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduces an image to a small fingerprint robust to small variations (recompression, cropping). The same principle applies to sound: recognizing a song from a few seconds of audio, recorded on a phone's microphone in a noisy bar, by comparing it against a database of tens of millions of tracks, in under a second. This is the problem solved by **audio fingerprinting** (popularized by Shazam).

## Step 1: turning sound into an image (the spectrogram)

Sound is a wave that varies over time, but that single dimension (volume at each instant) isn't enough to recognize it: you also need to know which **frequencies** (low, high) are present at each instant. A **spectrogram** turns audio into a kind of image:

```text
Frequency (high)
      ▲
      │   ░░  ▓▓        ░░
      │  ░▓▓  ░░  ▓▓░░
      │  ▓▓░      ░▓▓  ░░
      └──────────────────────► Time
      (low)

Horizontal axis: time
Vertical axis:   frequency (low at the bottom, high at the top)
Intensity (░/▓): the volume of that frequency at that instant
```

This image contains far more information than a simple volume curve: it shows precisely which notes/frequencies are sounding at which moment.

## Step 2: keep only the most prominent peaks

A full spectrogram remains sensitive to ambient noise (conversations, background sound): comparing two spectrograms pixel by pixel would fail as soon as any stray noise is added to the signal. Shazam's solution keeps only the most **intense** points of the spectrogram (the peaks that clearly stand out from their surroundings): a few dozen points per second, chosen to remain visible even through ambient noise, audio compression, or a poor-quality microphone.

```text
Full spectrogram                Keep only the peaks
(sensitive to noise)             (robust to noise)

  ░▓▓░░▓░░▓▓░░░▓░░        →        •      •
  ░░▓░▓▓░░░▓▓░▓░░                    •  •
  ▓░░▓░░▓▓░░░▓░▓▓░                •        •
```

## Step 3: hash pairs of peaks, then search a gigantic database

Each peak is paired with a neighboring peak, and the pair (frequency of the first, frequency of the second, time gap between the two) is turned into a compact fingerprint, exactly as [perceptual hashing](/?c=donnees&s=representation-des-donnees&p=hachage-perceptuel-similarite-dimages) reduces an image to a sequence of bits. These fingerprints are precomputed for tens of millions of tracks and stored in a huge index:

```text
Recorded clip → peaks → fingerprints → search in the index
                                              ↓
If many fingerprints match the same track,
with a consistent time offset → track identified
```

The requirement of a **consistent time offset** across all matching fingerprints is what eliminates false positives: a few fingerprints can coincide by chance with any track, but dozens of them coinciding with the same time offset can only come from the same recording.

> **Pitfall:** expecting this technique to recognize a tune hummed or sung by the user themselves. Audio fingerprinting identifies a **specific recording** (the same frequency peaks as the original): a cover, a live version, or a hummed tune produce a spectrogram different from the studio recording, and therefore different fingerprints, even if a human immediately recognizes "the same song."
>
> **Best practice:** use a clip of the original recording, even brief and noisy (a few seconds are enough, the algorithm only needs a few dozen reliable peaks); to recognize a hummed tune, a different technique is needed (comparing the melody itself, independent of the recording's exact timbre), outside the scope of classic audio fingerprinting.

## 📋 Summary

| | |
|---|---|
| **To remember** | Audio fingerprinting turns sound into a spectrogram, keeps only its most prominent frequency peaks (robust to noise), then hashes pairs of peaks to find them in a huge index, requiring a consistent time offset across matches. |
| **Usable tools** | The principle (constellation of peaks + pair hashing), published by Avery Wang (Shazam co-founder), is used by most music recognition services. |
| **Pitfalls to avoid** | Expecting recognition from a hummed tune or a cover different from the original recording. |
| **Best practices** | Use a clip of the original recording, even short and noisy; use a dedicated technique (melody comparison) for a hummed tune. |
