---
order: 6
---

# EXIF metadata and the RAW format: what a photo contains beyond the image

A digital photo isn't just a grid of pixels. Like [any file](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire), it's a sequence of bytes, but that sequence is organized into two distinct parts: the image data itself, and a block of **metadata** (information about the photo, not the photo) tucked into the same file.

## JPEG vs. RAW: two ways to store the image itself

| | JPEG | RAW |
|---|---|---|
| Content | Already **processed** image (white balance, sharpness, contrast applied) and **compressed** (lossy) by the camera | Near-raw sensor data, before any processing, uncompressed or losslessly compressed |
| File size | Small (a few MB) | Large (several dozen MB) |
| Editable afterward | Limited: the camera's decisions (white balance, etc.) are already baked into the pixels | Extensive: every decision remains adjustable in post-processing, with no quality loss |
| Typical extension | `.jpg` | `.cr2` (Canon), `.nef` (Nikon), `.arw` (Sony), or the open format `.dng` ([Adobe DNG](https://helpx.adobe.com/camera-raw/digital-negative.html)) |

> **Analogy:** JPEG is a photo already developed and cropped by the photographer; RAW is the raw film, containing everything the sensor captured, to be developed yourself afterward.

## EXIF: a block of metadata tucked into the file

The **EXIF** format (*Exchangeable Image File Format*, a [technical standard](https://www.cipa.jp/e/std/std-sec.html) common to most cameras and smartphones) defines a block of metadata inserted at the start of the image file (JPEG as well as RAW), in addition to the pixels themselves:

| Typical EXIF field | Example value |
|---|---|
| Camera model | iPhone 15 Pro |
| Date and time of capture | 2026-08-22 14:32:07 |
| Exposure time, aperture, ISO | 1/125s, f/2.8, ISO 100 |
| GPS coordinates (if enabled) | 48.8566° N, 2.3522° E |
| Device orientation | Portrait |

This block can be read by any software that knows how to read it (image viewer, social network, editor), independently of the photo's pixels.

> **Pitfall:** sharing a photo online without knowing it still carries its EXIF GPS coordinates. A photo taken at home and posted publicly can thus reveal a precise address to anyone who inspects the file, even if nothing in the image itself suggests it.
>
> **Best practice:** most social networks automatically strip EXIF from published photos, but a file sent directly (email, messaging, upload to a site) keeps it intact — check this before sending any photo whose location shouldn't be shared, using your operating system's tool or a dedicated EXIF-removal utility.

## 📋 Summary

| | |
|---|---|
| **To remember** | An image file contains two distinct things: the pixels (processed/compressed JPEG, or near-raw RAW) and a block of EXIF metadata (device, settings, date, sometimes GPS), readable independently of the image. |
| **Usable tools** | [Adobe's open DNG format](https://helpx.adobe.com/camera-raw/digital-negative.html) for a RAW readable by several programs; an EXIF-removal utility before sharing a sensitive photo. |
| **Pitfalls to avoid** | Sharing a photo while thinking it only reveals what's visible in the image, forgetting its EXIF metadata (GPS in particular). |
| **Best practices** | Check and strip a photo's EXIF before any direct send (outside social networks, which already do it) if its location or date shouldn't be known. |
