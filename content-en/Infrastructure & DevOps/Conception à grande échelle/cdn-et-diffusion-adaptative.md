---
order: 3
---

# CDN and adaptive streaming: the Netflix case

The [load balancer](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) distributes requests across several servers, but all those servers remain located in the same geographic place: a request sent from another continent still has to travel that whole distance. For content that's large and identical for everyone (a video), a much bigger gain comes from bringing **the content itself** closer to each user, rather than bringing the processing servers closer.

## The CDN: copies of the content, spread around the world

A **CDN** (*Content Delivery Network*) is a network of geographically distributed servers, each keeping a cached copy of the content (a video, an image, a static file) as close as possible to its users:

```text
Without a CDN:                          With a CDN:

User (Tokyo)                            User (Tokyo)
      |                                       |
      | travels the whole route               | served from the nearest CDN node
      v                                       v
Origin server (Paris)                    CDN node (Tokyo) --- synced copy --- Origin server (Paris)
```

| | Without a CDN | With a CDN |
|---|---|---|
| Distance traveled | All the way to the origin server, wherever it is in the world | Only to the nearest CDN node |
| Load on the origin server | Every request, from anywhere in the world | Only to sync the CDN nodes, not every user request |
| Suited to | Personalized content, specific to each user | Content identical for everyone (video, image, static file) |

Netflix goes further than a third-party CDN: the company deploys its own servers ([Open Connect](https://openconnect.netflix.com/)), installed directly inside internet service providers' networks, so the video travels the shortest possible network path before reaching the user.

> **Pitfall:** expecting a CDN to speed up just any content. A CDN can only cache shared content, identical for everyone; genuinely personalized content (a recommendation specific to an account, a balance) has nothing in common to cache, and must keep going through the origin servers, behind the [load balancer](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge).

## Adaptive streaming: adjusting to each person's connection

A video isn't sent as a single file at a fixed quality. It's first encoded at **several quality levels** (different resolutions and bitrates), then split into small segments of a few seconds each:

```text
Source video
   ├── Low quality    (480p segments, low bitrate)
   ├── Medium quality  (720p segments, medium bitrate)
   └── High quality    (1080p segments, high bitrate)
```

The video player, on the user's device, continuously measures the actual download speed and chooses, segment by segment, the best quality it can download in time without interrupting playback:

```text
Connection measured as stable and fast     -> downloads the next segment in high quality
Connection measured as degrading           -> switches to the next segment in lower quality
```

This mechanism (standardized under the [HLS](https://developer.apple.com/streaming/) and [MPEG-DASH](https://www.iso.org/standard/79329.html) protocols) explains why a video playing in high definition can momentarily become blockier if the network degrades (switching wifi, network congestion), without ever cutting off playback: each following segment is simply requested at a different quality, transparently to the user.

## 📋 Summary

| | |
|---|---|
| **To remember** | A CDN brings a copy of shared content closer to each user, reducing the distance a request travels; it isn't suited to personalized content. Adaptive streaming splits a video into segments encoded at several qualities, and the player picks the best quality it can sustain based on the connection measured live. |
| **Usable tools** | A rented (general-purpose) CDN or one deployed in-house (Netflix Open Connect); the HLS and MPEG-DASH protocols for adaptive streaming. |
| **Pitfalls to avoid** | Expecting a CDN to speed up genuinely personalized content, which has nothing in common to cache. |
| **Best practices** | Reserve the CDN for shared, static content; let personalized content go through the origin servers. |
