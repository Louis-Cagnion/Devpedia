---
order: 15
---

# The Web Speech API: Speech Recognition and Synthesis in the Browser

The **Web Speech API** is an API of the **browser itself** (not a third-party library to install): it directly exposes in JavaScript **speech recognition** (turning voice captured by the microphone into text) and **speech synthesis** (turning text into voice), without going through an external service.

| | Speech recognition | Speech synthesis |
|---|---|---|
| Role | Voice → text | Text → voice |
| JavaScript interface | `SpeechRecognition` (`webkitSpeechRecognition` on some browsers) | `speechSynthesis` |
| Example use | Typing a search query by voice | Reading a text aloud (this site's reading feature, for example, relies on `speechSynthesis` as a fallback) |

## Speech recognition: an event-driven model

Unlike the [Promise-based model seen in asynchronous programming](/?c=langages&s=javascript&p=asynchrone), speech recognition doesn't return a single result awaited with `await`: it fires **events**, potentially several times, as it picks things up.

```javascript
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!Recognition) {
    // Mandatory fallback: the API doesn't exist on this browser
    showClassicSearchBox();
} else {
    const recognition = new Recognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        runSearch(text);
    };

    recognition.onerror = (event) => {
        console.log("Recognition error:", event.error);
        showClassicSearchBox();   // fallback on failure (mic denied, etc.)
    };

    recognition.start();
}
```

| Callback | Fired when |
|---|---|
| `onresult` | A result (transcribed text) is available |
| `onerror` | An error occurs (mic denied, network, unsupported language...) |
| `onend` | The listening session ends, with or without a result |

## Speech synthesis: a queue of utterances

```javascript
const utterance = new SpeechSynthesisUtterance("Hello, this is a test.");
utterance.lang = "en-US";
utterance.rate = 1.2;   // reading speed

speechSynthesis.speak(utterance);   // adds the utterance to the queue and reads it
```

`speechSynthesis.speak()` stacks the utterance into an internal browser **queue**: calling `speak()` several times in a row doesn't read them all at once, but one after another.

## Uneven browser support

> **Pitfall:** using `SpeechRecognition` without checking for its presence (`window.SpeechRecognition || window.webkitSpeechRecognition`). Some browsers only expose the API under the prefixed name `webkitSpeechRecognition`, others don't expose it at all: without a check, the script silently crashes (`undefined is not a constructor`) on unsupported browsers.
>
> **Best practice:** always check for the API's presence before using it, and provide a functional fallback (a plain text search field) rather than making the voice feature mandatory.

---

## 📋 Key Takeaways

| | |
|---|---|
| **Key Points** | The Web Speech API exposes speech recognition (`SpeechRecognition`) and synthesis (`speechSynthesis`) directly in the browser. Recognition works through events (`onresult`, `onerror`), not a Promise. |
| **Available Tools** | `SpeechRecognition`/`webkitSpeechRecognition`, `SpeechSynthesisUtterance`, `speechSynthesis.speak()`. |
| **Pitfalls to Avoid** | Using the API without checking for its presence (the `webkit` prefix, or total absence on some browsers); ignoring `onerror`. |
| **Best Practices** | Always provide a functional fallback if the API is absent or fails; explicitly handle `onerror`, not just the success case. |
