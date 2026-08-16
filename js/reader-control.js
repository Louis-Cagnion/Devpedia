import { createTag } from "./tags.js";
import { t } from "./i18n.js";
import {
    SPEECH_SUPPORTED,
    hasUsableVoice,
    startReading,
    startFromVisible,
    replayParagraph,
    previousParagraph,
    nextParagraph,
    triggerPrimaryAction,
    onStatusChange,
} from "./reader.js";

/**
 * Builds one instance of the read-aloud control. Exactly one of two button pairs shows at a time
 * (cf. applyStatus() below), rather than stacking every action whether or not it currently means
 * anything (requested by Louis on 2026-08-16, "pour éviter la surcharge de boutons") --
 * readerListenButton + readerRestartButton while nothing is playing, or readerPrimaryButton
 * (its own label switching between "Pause"/"Reprendre"/"Continuer" depending on exactly which of
 * reader.js's isPlaying/isPaused/isPausedAtCode is set) + readerReplayButton + readerPreviousButton +
 * readerNextButton once reading is in progress in any of those three ways. Call once per place it
 * needs to appear (the desktop right sidebar, the mobile floating bar) -- every instance shares
 * the same underlying playback state (reader.js's own module state) and stays in sync with the
 * others via onStatusChange().
 *
 * A browser can have the Web Speech API present (cf. SPEECH_SUPPORTED) but no voice actually
 * able to speak with it -- confirmed for Brave on Linux (cf. hasUsableVoice()'s own comment in
 * reader.js). Once that's confirmed (asynchronously: unlike SPEECH_SUPPORTED, it can't be known
 * synchronously at build time), every button here is replaced with a short explanation instead of
 * sitting there looking broken -- requested by Louis on 2026-08-16.
 *
 * @returns {HTMLElement|null} null if the browser has no Web Speech API at all, so callers show
 *   nothing rather than a control that can never work
 */
export function createReaderControl() {
    if (!SPEECH_SUPPORTED) return null;

    const wrapper = createTag("div", { class: "readerControl" });
    hasUsableVoice().then(usable => {
        if (!usable) {
            wrapper.replaceChildren(
                createTag("p", { class: "readerUnavailableNotice" }, { textContent: t("readerUnavailable") })
            );
        }
    });
    const listenButton = createTag(
        "button",
        { class: "returnButton readerListenButton" },
        { textContent: t("readerListen") }
    );
    const restartButton = createTag(
        "button",
        { class: "returnButton readerRestartButton" },
        { textContent: t("readerRestart") }
    );
    const primaryButton = createTag("button", { class: "returnButton readerPrimaryButton" });
    const replayButton = createTag(
        "button",
        { class: "returnButton readerReplayButton" },
        { textContent: t("readerReplay") }
    );
    const previousButton = createTag(
        "button",
        { class: "returnButton readerPreviousButton" },
        { textContent: t("readerPreviousParagraph") }
    );
    const nextButton = createTag(
        "button",
        { class: "returnButton readerNextButton" },
        { textContent: t("readerNextParagraph") }
    );
    listenButton.addEventListener("click", startFromVisible);
    restartButton.addEventListener("click", startReading);
    primaryButton.addEventListener("click", triggerPrimaryAction);
    replayButton.addEventListener("click", replayParagraph);
    previousButton.addEventListener("click", previousParagraph);
    nextButton.addEventListener("click", nextParagraph);
    // In-progress order requested by Louis on 2026-08-16: previous, pause/resume, next, replay.
    wrapper.append(listenButton, restartButton, previousButton, primaryButton, nextButton, replayButton);

    const applyStatus = status => {
        const inProgress = status.isPlaying || status.isPaused || status.isPausedAtCode;
        listenButton.classList.toggle("visible", !inProgress);
        restartButton.classList.toggle("visible", !inProgress);
        listenButton.disabled = restartButton.disabled = !status.hasPlan;
        primaryButton.classList.toggle("visible", inProgress);
        primaryButton.textContent = status.isPausedAtCode ? t("readerContinue")
            : status.isPlaying ? t("readerPause")
            : t("readerResume");
        replayButton.classList.toggle("visible", inProgress);
        previousButton.classList.toggle("visible", inProgress);
        nextButton.classList.toggle("visible", inProgress);
    };
    onStatusChange(applyStatus);

    return wrapper;
}
