import { appState } from "./state.js";
import {
    onStatusChange,
    getReaderStatus,
    resumeReading,
    pauseReading,
    continueAfterCode,
    nextParagraph,
    previousParagraph,
} from "./reader.js";
import { logEvent } from "./reader-debug.js";

/* Bluetooth headset media buttons (play/pause/next/previous), synced both ways with the reader
   control: a Bluetooth press drives the same actions as the on-screen buttons, and any on-screen
   change (including a manual chapter change) updates what the OS shows as the playback state. */
if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
        logEvent("mediaSession:play");
        const status = getReaderStatus();
        if (status.isPausedAtCode) continueAfterCode();
        else if (status.isPaused) resumeReading();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        logEvent("mediaSession:pause");
        if (getReaderStatus().isPlaying) pauseReading();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        logEvent("mediaSession:nexttrack");
        nextParagraph();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        logEvent("mediaSession:previoustrack");
        previousParagraph();
    });
    let lastMetadataTitle = null;
    onStatusChange(status => {
        navigator.mediaSession.playbackState = status.isPlaying ? "playing"
            : (status.isPaused || status.isPausedAtCode) ? "paused"
            : "none";
        /* Without metadata, iOS never recognizes this as a real "Now Playing" session -- Bluetooth
           play/pause falls through to whatever app it considers active instead (e.g. Musique),
           confirmed on a real iPhone (Louis, 2026-08-22). */
        const title = document.querySelector(`.${appState.curPageId}Div .pageTitle`)?.textContent;
        if (title && title !== lastMetadataTitle) {
            /* Without artwork, iOS's lock-screen widget falls back to its own generic seek-±10s
               buttons instead of the previoustrack/nexttrack ones registered above (Louis, 23/08/2026:
               only saw skip-10s, play/pause, and the audio output picker -- no previous/next). */
            navigator.mediaSession.metadata = new MediaMetadata({
                title,
                artist: "Devpedia",
                artwork: [
                    { src: "./icons/icon-192.png", sizes: "192x192", type: "image/png" },
                    { src: "./icons/icon-512.png", sizes: "512x512", type: "image/png" },
                ],
            });
            lastMetadataTitle = title;
        }
    });
}
