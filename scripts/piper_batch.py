#!/usr/bin/env python3
"""Synthesizes many texts with one Piper voice loaded once, instead of once per text (avoids
reloading the ~60MB ONNX model per entry, the dominant cost of a one-process-per-clause approach).
Reads a JSON array of {"index": str, "text": str} from stdin, writes "<output_dir>/<index>.wav"
for each, and prints one JSON line per entry to stdout: {"index": str, "durationMs": int}.
Called from scripts/generate-audio.mjs, once per (chapter, distinct voice actually used in it).

Usage: piper_batch.py <model.onnx> <config.json> <output_dir>
"""
import json
import sys
import wave

from piper import PiperVoice


def main():
    model_path, config_path, output_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    voice = PiperVoice.load(model_path, config_path)
    entries = json.loads(sys.stdin.read())

    for entry in entries:
        wav_path = f"{output_dir}/{entry['index']}.wav"
        with wave.open(wav_path, "wb") as wav_file:
            voice.synthesize_wav(entry["text"], wav_file)
        with wave.open(wav_path, "rb") as wav_file:
            duration_ms = round(wav_file.getnframes() / wav_file.getframerate() * 1000)
        print(json.dumps({"index": entry["index"], "durationMs": duration_ms}), flush=True)


if __name__ == "__main__":
    main()
