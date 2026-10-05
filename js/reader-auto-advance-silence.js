import { logEvent } from "./reader-debug.js";

/* A silent clip (generated once with `ffmpeg -f lavfi -i anullsrc=r=22050:cl=mono -t 5 -codec:a
   libmp3lame -b:a 32k -ac 1 -ar 22050`, matching scripts/generate-audio.mjs's own encoding)
   played through reader.js's audioEl to bridge router.js's auto-advance countdown before a chapter
   change: a JS setTimeout doesn't fire reliably once iOS suspends timers on a locked screen, but
   this element's own "ended" event still does (Louis, 23/08/2026: wanted auto-advance to survive a
   locked phone too). Fetched once, lazily, the first time it's actually needed rather than at
   module load (most sessions never reach a chapter's end, cf. Performance's own
   no-recompute-what-isn't-needed principle). */
const AUTO_ADVANCE_SILENCE_PATH = "./audio/silence-5s.mp3";
export const AUTO_ADVANCE_SILENCE_SECONDS = 5;
let silenceObjectUrlPromise = null;

/**
 * @brief Plays AUTO_ADVANCE_SILENCE_PATH once through `audioEl` and calls `onEnded` when it
 * finishes -- router.js's lock-survivable stand-in for a setTimeout-based auto-advance delay.
 * A fetch failure degrades to calling `onEnded` immediately rather than never auto-advancing.
 *
 * @param {HTMLAudioElement} audioEl reader.js's shared audio element
 * @param {() => void} onEnded
 * @param {(secondsRemaining: number) => void} [onTick] called once up front with
 *   AUTO_ADVANCE_SILENCE_SECONDS, then again on every audioEl "timeupdate" -- driven off the
 *   audio's own clock, so it keeps ticking under the same iOS-lock conditions `onEnded` itself
 *   already survives, unlike a plain setInterval.
 *
 * @returns {Promise<(() => void)|null>} a function that detaches `onEnded` and `onTick` without
 *   calling them, or null if `onEnded` already ran because the clip couldn't be fetched
 */
export async function playSilenceClip(audioEl, onEnded, onTick) {
    if (!silenceObjectUrlPromise) {
        silenceObjectUrlPromise = fetch(AUTO_ADVANCE_SILENCE_PATH)
            .then(response => response.blob())
            .then(blob => URL.createObjectURL(blob))
            .catch(() => null);
    }
    const objectUrl = await silenceObjectUrlPromise;
    if (!objectUrl) {
        onEnded();
        return null;
    }
    const abortController = new AbortController();
    audioEl.src = objectUrl;
    audioEl.currentTime = 0;
    audioEl.addEventListener("ended", onEnded, { once: true, signal: abortController.signal });
    if (onTick) {
        onTick(AUTO_ADVANCE_SILENCE_SECONDS);
        audioEl.addEventListener("timeupdate", () => {
            onTick(Math.max(1, AUTO_ADVANCE_SILENCE_SECONDS - Math.floor(audioEl.currentTime)));
        }, { signal: abortController.signal });
    }
    audioEl.play().catch(err => logEvent("audioEl:play-rejected", err.message));
    return () => abortController.abort();
}
