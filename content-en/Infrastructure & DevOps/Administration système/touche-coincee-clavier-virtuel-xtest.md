---
order: 10
---

# Stuck key: the XTEST virtual keyboard and `xdotool`

To test a graphical application (a game, a 3D program like the one in the [chapter on the render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), a script can "press" keys in place of a person: hold an arrow for one second and measure how far the object went, for example. On Linux, the tool that does it relies on a **virtual keyboard**. This chapter explains how it works, the trap that leaves a key **held down for the whole machine**, how to recognize it, and how to protect against it.

## An invisible keyboard: XTEST and `xdotool`

On Linux, the **display server** is the program that manages the screen, the keyboard and the mouse, and hands keyboard and mouse input to windows ([X11](https://www.x.org/wiki/) is the most widespread). It provides **extensions** (optional protocol features that programs use to talk to it). **XTEST** ([specification](https://www.x.org/releases/current/doc/xextproto/xtest.html)) is one: it lets a program **inject events** as if they came from a real keyboard, through a **virtual keyboard**. [`xdotool`](https://github.com/jordansissel/xdotool) is the command that uses it.

A keystroke is made of **two events**: the **press** (*keydown*) then the **release** (*keyup*). As long as the release has not arrived, the server considers the key as **held**.

| Command | Events sent | Effect |
|---|---|---|
| `xdotool key Escape` | press, then release | a complete keystroke |
| `xdotool keydown Left` | press only | the left arrow **stays down** |
| `xdotool keyup Left` | release only | the left arrow is released |

Holding a key for a given time is therefore written in three steps:

```bash
xdotool keydown Left   # the key is down
sleep 1                # the application sees it held for 1 second
xdotool keyup Left     # release: without this line, the key stays down
```

## The trap: a key held down for the whole machine

If the script stops **between** `keydown` and `keyup`, the release is never sent:

```
time   ──────────────────────────────────────────────────────►
script   keydown ─── work ─── ✕ interrupted        keyup (never run)
server   key down ───────────────────────────────────────────────► still down
```

The server then repeats the key **automatically** (**auto-repeat**: a held key produces a series of keystrokes, like when you keep your finger on it) and sends it to the window that has the **focus** (the one receiving the keyboard at that moment). It is no longer the application under test: it is the editor, the terminal, whatever is in the foreground, even after the test is over.

| What interrupts the script | Why the `keyup` is lost |
|---|---|
| `Ctrl-C` | the script receives the **signal** `SIGINT` (a message the system sends to a program) and stops |
| `timeout` | it sends the `SIGTERM` signal at the end of the delay |
| `kill PID` | `SIGTERM` signal |
| `kill -9 PID`, memory exhausted (the system kills the program) | `SIGKILL` signal: the program has **no** chance to react |
| Script crash or syntax error between the two lines | the `keyup` line is never reached |

## Recognizing a stuck key

The symptoms: a letter or an arrow that repeats endlessly in an unrelated window, characters typing themselves. Two ways to check:

| Method | What it shows |
|---|---|
| `xinput query-state ID` | **`xinput`** lists (`xinput list`) and queries input devices; on the virtual keyboard (named "Virtual core XTEST keyboard"), a stuck key appears as `key[9]=down` |
| `XQueryKeymap` | **Xlib** function (the C library that talks to the X server): it fills an array of 32 bytes, that is **256 cells of 0 or 1**, one per **key code** (the number the server gives to each physical key; 9 for Escape on a standard keyboard) |

```c
/* Returns 1 if the key with code "keycode" is down according to the X server, 0 otherwise. */
static int key_is_down(Display *display, unsigned int keycode)
{
	char keys[32];                      /* 32 bytes = 256 cells, one per key code */

	XQueryKeymap(display, keys);        /* the server fills the array */
	return ((unsigned char)keys[keycode / 8] >> (keycode % 8)) & 1;   /* byte keycode/8, bit keycode%8 */
}
```

A key's code depends on the keyboard and its layout: ask Xlib for it (`XKeysymToKeycode`, which converts a key's **symbol**, for example Escape's, into a code) rather than hard-coding it.

## Releasing it

The simplest way, by hand: `xdotool keyup Escape`. In a C program, the same event is sent through XTEST:

```c
/* Releases the key if it is stuck. Returns 1 if it was, 0 if not, -1 on error. */
int release_if_stuck(unsigned int keycode)
{
	Display *display = XOpenDisplay(NULL);   /* NULL: server designated by the DISPLAY variable */
	const char *shown = getenv("DISPLAY");   /* only for the error message */
	int stuck;

	if (!display)
	{
		fprintf(stderr, "X server unreachable (DISPLAY variable: %s)\n", shown ? shown : "unset");
		return -1;
	}
	stuck = key_is_down(display, keycode);
	if (stuck && !XTestFakeKeyEvent(display, keycode, 0, 0))   /* 0: release (keyup) */
	{
		fprintf(stderr, "XTEST extension unavailable: key %u not released\n", keycode);
		XCloseDisplay(display);
		return -1;
	}
	XFlush(display);                         /* sends the order without waiting */
	XCloseDisplay(display);
	return stuck;
}
```

Tested under **Xvfb** (an X server with no screen, which allows testing without a real display): before the press, `key_is_down` returns 0; after a lone `keydown`, 1; `release_if_stuck` then returns 1 and, right after, the key is back to 0; a second call returns 0 (nothing to do).

## Guaranteeing the release: `trap`

The remedy is to plan the release **before** pressing. The `trap` command ([see the chapter on processes](/?c=shells&s=bash&p=gestion-des-processus)) registers an action that the script will run when it exits, whatever the reason:

```bash
release() { xdotool keyup Left; }   # harmless if the key is already released
trap release EXIT                   # EXIT: on every exit of the script, normal or caused by a signal

xdotool keydown Left
sleep 30 &                          # the long command (here sleep, in practice the application under test)...
wait $!                             # ...is awaited by "wait" ($!: number of the last process launched)
```

Tested with the release replaced by a line written to a file (`xdotool` is not installed on the test machine):

| Interruption | Result with `trap release EXIT` |
|---|---|
| `kill` (`SIGTERM` signal) | released **once**, within 1 s |
| `timeout 2 command` | released **once** |
| `kill -9` (`SIGKILL` signal) | **never** released |

> **Pitfall (the `trap` is delayed):** bash only runs the `trap` **after the current command has finished**. With a plain `sleep 30` instead of `sleep 30 & wait $!`, every test waited the full 30 seconds before releasing (the whole series took more than 4 minutes). `wait`, on the other hand, is interrupted immediately by a signal: so launch the long command in the background, then wait for it with `wait`.

> **Pitfall (run twice):** `trap release EXIT INT TERM` releases **twice** on a `SIGTERM` (once for the signal, once for the exit that follows). `trap release EXIT` is enough, and the handler must stay **harmless if it runs twice** (releasing an already released key does nothing).

> **Pitfall (`SIGKILL`):** no `trap` catches `kill -9` or a forced stop due to lack of memory. Never kill a test this way while a key is down; and **at the start** of the next test, call `release_if_stuck` (above) or `xdotool keyup` on every key used, to repair a previous brutal stop.

## Sending a key to the right window: a safe protocol

With the tested version of `xdotool`, a keystroke aimed at a window that **already has the focus** is not delivered to that particular window: it goes through the XTEST virtual keyboard, so to **whichever window has the focus at that instant**. If the user switched windows in the meantime, the keystroke (Escape, for example) lands in the editor or the terminal.

Three `xdotool` commands let you check the target before acting. A window is designated by its **identifier** (a number the X server assigns to each window); the **PID** is the number of the process that owns the window.

| Command | Question asked |
|---|---|
| `xdotool getwindowname ID` | does the window still exist? (fails otherwise) |
| `xdotool getwindowfocus` | which window has the focus? (must be `ID`) |
| `xdotool getwindowpid ID` | which process does it belong to? (must be the PID of the application under test) |

```bash
# Sends Escape to window $1 of the application with PID $2, once, after three checks.
send_escape_once() {
	local win=$1 pid=$2 focus owner

	xdotool getwindowname "$win" > /dev/null 2>&1 \
		|| { echo "window $win not found" >&2; return 1; }
	focus=$(xdotool getwindowfocus)
	[ "$focus" = "$win" ] \
		|| { echo "window $win does not have the focus (focus: $focus)" >&2; return 1; }
	owner=$(xdotool getwindowpid "$win")
	[ "$owner" = "$pid" ] \
		|| { echo "window $win has PID $owner, expected $pid" >&2; return 1; }
	xdotool key --window "$win" Escape
}
```

Rules of the protocol:

- **One single keystroke**, never a second attempt if a check fails or if the application does not react: a keystroke repeated at random is the same danger as the stuck key. On failure, **stop the application with a signal** (`kill PID`) rather than retrying.
- Each check has **its own message**, naming the window, the value found and the value expected.

**Proving what the virtual keyboard really sent.** `xinput test-xi2 --root` displays live every keyboard event, all windows combined. Start it in the background into a file during the test, then count:

| What to count in the file | Expected result for a correct keystroke |
|---|---|
| presses (`RawKeyPress`) | 1 |
| releases (`RawKeyRelease`) | 1 |
| extra presses (auto-repeat) | 0 |

A press without a release, or several presses in a row, signals a stuck or repeated key.

## Measuring what the application displays: capture and pixels

To know whether the object moved after the keystroke, **capture the screen** and measure the pixels. `ffmpeg` (the audio and video conversion tool) can read an X server's screen with `-f x11grab`:

```bash
ffmpeg -f x11grab -draw_mouse 0 -video_size 800x600 -i :99 -frames:v 1 shot.ppm
```

| Option | Role |
|---|---|
| `-f x11grab` | reads the X server's screen instead of a file |
| `-draw_mouse 0` | **does not draw the mouse cursor** in the image |
| `-video_size 800x600` | size of the captured area, in pixels |
| `-i :99` | X server to read (value of `DISPLAY`) |
| `-frames:v 1` | a single image, saved in **PPM** format (raw image: a small header, then 3 red-green-blue bytes per pixel) |

> **Pitfall (the cursor skews the measurement):** by default, `x11grab` draws the cursor in the capture. Its white arrow adds to the measured object and enlarges its **bounding box** (the smallest rectangle containing all the object's pixels), hence a position or size measurement. `-draw_mouse 0` excludes it.

The measurement then reads the PPM: on a black background, the bounding box is that of the pixels that are not black.

```python
import re
import sys


def read_ppm(path):
    """Returns (width, height, RGB bytes) of a binary P6 PPM with 255 levels."""
    with open(path, "rb") as file:
        data = file.read()
    header = re.match(rb"P6\s+(\d+)\s+(\d+)\s+255\s", data)   # header: P6, width, height, 255
    if not header:
        sys.exit(f"{path}: binary P6 PPM with 255 levels expected")
    width, height = int(header.group(1)), int(header.group(2))
    pixels = data[header.end():]
    if len(pixels) != width * height * 3:
        sys.exit(f"{path}: {len(pixels)} pixel bytes, {width * height * 3} expected")
    return width, height, pixels


def bounding_box(path):
    """Returns (x_min, y_min, x_max, y_max) of the non-black pixels, None if all black."""
    width, height, pixels = read_ppm(path)
    xs, ys = [], []
    for index in range(0, len(pixels), 3):
        if pixels[index:index + 3] != b"\x00\x00\x00":    # one pixel = 3 bytes
            xs.append((index // 3) % width)               # pixel column
            ys.append((index // 3) // width)              # pixel row
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None
```

Tested on synthetic images: a white 3 × 2 pixel rectangle gives `(3, 2, 5, 3)`, an all-black image `None`, a truncated file or one of another format a message naming the file. The header is read with a regular expression rather than by splitting the file on spaces: a first pixel whose byte is 10 (line feed) would otherwise be swallowed as a separator.

If the application **pulses** (a [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), a program run by the graphics card, whose brightness varies with time), compare two captures **after normalizing the brightness** (divide each capture by its own mean brightness), otherwise two identical renderings look different.

## On other machines

| Situation | Behavior |
|---|---|
| X11 server (the common case) | `xdotool` and XTEST work |
| Wayland (another display server, increasingly common) | `xdotool` only reaches applications launched through **XWayland** (the X11 compatibility layer); the others need another tool |
| Machine with no screen (server, container, continuous integration) | `xvfb-run command` starts a virtual X server (Xvfb) for the duration of the command |
| `DISPLAY` variable missing or wrong | `xdotool` and `XOpenDisplay` fail: the message must name the variable, as in `release_if_stuck` |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `xdotool` injects keys through the X server's XTEST extension, via a virtual keyboard. A keystroke is a press then a release; if the script stops between the two, the key stays down for the whole machine and repeats in the window that has the focus. It is recognized with `xinput query-state` or `XQueryKeymap`, and released with `xdotool keyup` or `XTestFakeKeyEvent`. |
| **Usable tools** | `xdotool key`/`keydown`/`keyup`, `xinput list`/`query-state`, `XQueryKeymap`, `XTestFakeKeyEvent`, `trap`, `wait`, `timeout`, `xvfb-run`. |
| **Pitfalls to avoid** | A `keydown` without a guaranteed `keyup`. A `trap` delayed by a long command launched in the foreground. A `trap` on `EXIT INT TERM` that runs twice. `kill -9` on a test holding a key. A hard-coded key code. An unreported missing `DISPLAY` variable. |
| **Good practices** | Set `trap release EXIT` before the `keydown`; launch the long command in the background, then `wait $!`. Release every key used at the start of the next test. Ask Xlib for the key code. Test under Xvfb rather than on the working screen. |
