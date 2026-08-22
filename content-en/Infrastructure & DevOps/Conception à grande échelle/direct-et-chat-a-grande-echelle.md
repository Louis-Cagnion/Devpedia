---
order: 5
---

# Large-scale live streaming and chat

The [CDN and adaptive streaming](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative) chapter covers a video that already exists in full before being watched (a Netflix movie, encoded and stored in advance). A live stream (Twitch, but the principle applies to any live streaming) raises a different problem: the video doesn't exist yet when the viewer requests it, it's being produced **right now**, and must reach tens of thousands of viewers just a few seconds after being filmed.

## The path of a live stream: ingestion, transcoding, delivery

```text
Streamer (capture software)
   |  sends a continuous video stream
   v
Ingest server (as close as possible to the streamer)
   |  transcodes live, into several qualities
   v
CDN network (same nodes as for on-demand video)
   |  adaptive streaming, as seen in the previous chapter
   v
Viewers (tens of thousands, each choosing their own quality)
```

The difference from on-demand video plays out in the first two steps: an **ingest server** continuously receives the raw stream sent by the streamer, and **transcoding** (re-encoding into several qualities, just like Netflix) has to happen in a few seconds, continuously, rather than once in advance on an already-complete file.

## The price of live: an unavoidable delay

Every step (transcoding, splitting into segments, propagating to the CDN node closest to the viewer) takes a bit of time. Added together, these steps create a **stream delay** of several seconds between the real-world moment and what the viewer sees, even under the best conditions.

> **Pitfall:** expecting zero latency from a live stream, on par with a face-to-face conversation. Going through transcoding and the CDN, essential to serve tens of thousands of viewers at once, mechanically adds several seconds of delay: that's why a chat message can seem to react to an event "before" the viewer even sees it on screen themselves.
>
> **Best practice:** for an interaction that requires minimal latency between a small number of participants (two players in the same match, for example), use a direct [WebSocket](/?c=infrastructure-devops&s=infrastructure&p=websocket-et-temps-reel) connection rather than the video pipeline, without trying to eliminate the video's own delay, which is structurally unavoidable at this scale.

## Chat: broadcasting the same message to everyone, not a personalized feed

The [news feed](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=fil-dactualite-fan-out) builds content that's **different for each user** (the posts of the accounts they follow). A live stream's chat solves the opposite problem: hundreds of thousands of messages per second, but **every viewer of the same channel must receive exactly the same messages**, in the same order, at the same time.

```text
Viewer 1 ─┐
Viewer 2 ─┼── all subscribed to the same channel
Viewer 3 ─┘

Message sent -> published once -> broadcast to all channel subscribers simultaneously
```

This model is called **publish/subscribe** (or *pub/sub*): each viewer subscribes to the channel of the stream they're watching, and each message is processed only once by the server and then forwarded to all subscribers, rather than being recomputed individually for each one.

| | News feed (fan-out) | Live stream chat (pub/sub) |
|---|---|---|
| Content received | Different for each user (depending on who they follow) | Identical for all subscribers of the same channel |
| What varies | The list of followed accounts | Nothing: everyone receives everything |

## 📋 Summary

| | |
|---|---|
| **To remember** | A live stream adds an ingestion step and continuous transcoding before joining the same CDN as an on-demand video, which creates an unavoidable stream delay of a few seconds. Its chat broadcasts the same message to every channel subscriber (pub/sub), unlike a news feed, which personalizes content per user (fan-out). |
| **Usable tools** | A WebSocket for an interaction that requires minimal latency, independent of the video delay. |
| **Pitfalls to avoid** | Expecting zero latency from a live stream broadcast at large scale. |
| **Best practices** | Separate low-latency interactions (direct WebSocket) from the video pipeline, without trying to reduce the latter's structural delay. |
