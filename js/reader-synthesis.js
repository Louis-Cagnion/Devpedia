import { setActiveWord, wordIndexAtChar, calibrateRate, scheduleEstimatedWords } from "./reader-highlight.js";
import { logEvent } from "./reader-debug.js";

const synth = "speechSynthesis" in window ? window.speechSynthesis : null;

/* Chrome silently drops a speak() call made in quick succession after the previous utterance's
   onend (e.g. a table row's several short entries chained back to back): neither onstart nor
   onend ever fires, freezing playback with nothing queued and no error (Louis, 29/08/2026, "Par
   où commencer ?" table). speakViaSynthesis()'s watchdog below detects this (no onstart within
   this delay) and recovers by retrying once, then skipping the entry rather than hanging forever. */
const SYNTHESIS_WATCHDOG_MS = 3000;

/* cancel() doesn't unstick the engine if the very next speak() follows immediately -- confirmed
   empirically (Louis, 29/08/2026): only a real gap after cancel() lets a fresh speak() take. */
const SYNTHESIS_RECOVERY_DELAY_MS = 300;

/**
 * @brief Speaks `entry` through the Web Speech API, the live-synthesis counterpart to
 * js/reader.js's speakNextViaAudio() -- today's only path for a chapter with no matching
 * pre-generated audio (cf. fetchPregenAudio()). Word highlighting follows the engine's own
 * boundary events, with an estimated-rate fallback for engines that don't fire them.
 *
 * @param {Object} entry a "speak" plan entry
 * @param {number} rate playback speed, one of READER_RATES
 * @param {() => boolean} isStale whether playback was reset since this call, silencing every
 *   late callback of an interrupted utterance
 * @param {() => void} onFinished called once when the entry ended, failed or was given up on
 * @param {boolean} [isRetry] whether this is already the one watchdog-triggered retry
 */
export function speakViaSynthesis(entry, rate, isStale, onFinished, isRetry = false) {
    const utterance = new SpeechSynthesisUtterance(entry.text);
    utterance.lang = entry.lang;
    utterance.rate = rate;
    let started = false;
    const watchdog = setTimeout(() => {
        if (isStale() || started) return;
        logEvent("synthesis:silent-drop", isRetry ? "giving up, skipping entry" : "retrying once");
        synth.cancel();
        setTimeout(() => {
            if (isStale()) return;
            if (isRetry) onFinished();
            else speakViaSynthesis(entry, rate, isStale, onFinished, true);
        }, SYNTHESIS_RECOVERY_DELAY_MS);
    }, SYNTHESIS_WATCHDOG_MS);
    utterance.onboundary = event => {
        if (isStale()) return;
        setActiveWord(wordIndexAtChar(entry.text, event.charIndex));
    };
    let startedAt = null;
    // Anchored on onstart, not on speak(): the queueing gap would otherwise inflate short entries.
    utterance.onstart = () => {
        if (isStale()) return;
        started = true;
        clearTimeout(watchdog);
        startedAt = Date.now();
    };
    scheduleEstimatedWords(entry, () => !isStale());
    utterance.onend = utterance.onerror = () => {
        if (isStale()) return;
        clearTimeout(watchdog);
        const elapsedSeconds = startedAt === null ? 0 : (Date.now() - startedAt) / 1000;
        if (entry.words.length && elapsedSeconds > 0.1) calibrateRate(entry.text.length / elapsedSeconds);
        onFinished();
    };
    synth.speak(utterance);
}
