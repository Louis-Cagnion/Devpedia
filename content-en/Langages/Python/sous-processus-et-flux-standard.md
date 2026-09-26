---
order: 17
---

# Subprocesses and Redirecting Standard Streams

A Python program can just as well launch ANOTHER program (`subprocess`) as change its own display behavior (`sys.stdout`/`sys.stderr`): this chapter covers both of these uses of the standard `sys` module.

## Launching an external program: `subprocess`

```python
import subprocess

result = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOCKING
# 0 = success, any other value = failure
print(result.returncode)
# what the program printed
print(result.stdout)
```

`subprocess.run()` waits for the launched process to finish before continuing.

```python
# NON-BLOCKING: returns IMMEDIATELY, the process runs alongside
process = subprocess.Popen(["ls", "-la"])
# ... do something else while "process" is running ...
process.wait()  # explicitly wait for it to finish, if needed
process.poll()  # None if still running, otherwise the return code
```

`subprocess.run()` (the most common) launches a process and WAITS for it to finish before continuing; `subprocess.Popen()` launches a process and immediately returns an object representing it, useful for launching SEVERAL processes in parallel (one per site, one per file...) without waiting for each one before starting the next.

> **Pitfall:** with `Popen()`, never calling `.wait()` nor checking `.poll()` anywhere in the program can leave "zombie" processes running unreaped, if the main program ends before they do.

## `sys.executable`: the path of the running interpreter

```python
import sys

# "/usr/bin/python3.12" or "C:\...\python.exe" -> ABSOLUTE path of the interpreter running THIS
# code
sys.executable

# relaunches a script with the SAME interpreter/environment
subprocess.run([sys.executable, "other_script.py"])
```

> **Best practice:** use `sys.executable` rather than a plain hardcoded `"python"` to relaunch a Python script: `"python"` could point to a completely different install (wrong version, wrong [virtual environment](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) depending on the machine.

## Redirecting `sys.stdout`/`sys.stderr`: the "Tee" pattern

```python
import sys

class DualStream:  # duplicates every write to two destinations
    def __init__(self, original, log_file):
        self.original = original
        self.log_file = log_file

    def write(self, text):
        self.original.write(text)   # still writes to the screen, as before
        self.log_file.write(text)   # AND into the log file

    def flush(self):
        self.original.flush()
        self.log_file.flush()

log = open("execution.log", "a", encoding="utf-8")
# replaces the module object with the dual one, without touching the rest of the code
sys.stderr = DualStream(sys.stderr, log)

print("Error", file=sys.stderr)  # shows on screen AND is written to execution.log
```

`sys.stdout`/`sys.stderr` are plain objects, replaceable like any other module variable: assigning them an object that exposes `.write()`/`.flush()` silently intercepts everything already written elsewhere with `print(..., file=sys.stderr)`. The name **Tee** comes from the Unix `tee` command (already seen in [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), which duplicates a stream to several destinations at once.

> **Pitfall:** replacing `sys.stderr` changes its behavior for the WHOLE program, including third-party code that writes to it; restoring the original object (`sys.stderr = dual_stream.original`) at the end of the program avoids a lingering side effect if the script is later imported as a module elsewhere.

## Running Several Programs in Parallel, with a Time Budget

To time an external program on many cases (a benchmark), two needs come back: **stopping** a case that exceeds its budget, and **running several at once**.

| Need | Tool |
|---|---|
| Stop a program that runs too long | `subprocess.run(..., timeout=seconds)`: past that, the program is killed and the `subprocess.TimeoutExpired` exception is raised |
| Run several programs at the same time | `concurrent.futures.ThreadPoolExecutor`: a group of threads that each run a function |
| Time | `time.perf_counter()`, a clock that never goes backwards |

**Threads** are enough here, even though Python runs only one thread of Python code at a time (the [GIL](https://docs.python.org/3/glossary.html#term-global-interpreter-lock), the interpreter's global lock): while the external program runs, the thread only waits, and waiting does not hold the GIL. For a computation done in Python itself, you would need processes (see [Parallelism](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

```python
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

def run_one(duration):
    """Runs `sleep duration` with a 1 s budget; returns (duration, real time, status)."""
    start = time.perf_counter()
    try:
        subprocess.run(["sleep", str(duration)], timeout=1, check=True)
        status = "OK"
    except subprocess.TimeoutExpired:
        status = "TOO LONG"                  # sleep was killed after one second
    return duration, time.perf_counter() - start, status

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=4) as pool:
    for duration, elapsed, status in pool.map(run_one, [0.5, 2, 0.2, 0.8]):
        print(f"sleep {duration}: {elapsed:.1f} s {status}")
print(f"total: {time.perf_counter() - start:.1f} s")
```

Measured output: the four commands run at the same time, the total is 1.0 s, and `pool.map` returns the results **in the order of the inputs**, whatever order the commands finish in:

```
sleep 0.5: 0.5 s OK
sleep 2: 1.0 s TOO LONG
sleep 0.2: 0.2 s OK
sleep 0.8: 0.8 s OK
total: 1.0 s
```

> **Pitfall:** when the timeout expires, `subprocess.run` only kills the program it started, **not the processes that program created itself**. For a program that starts subprocesses, you must group them (`start_new_session=True` with `subprocess.Popen`) and kill the whole group (`os.killpg`).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `subprocess.run()` launches an external process and waits for it to finish; `subprocess.Popen()` launches it without waiting, for parallelism. `sys.executable` gives the path of the running interpreter. `sys.stdout`/`sys.stderr` are replaceable objects, which allows duplicating an output (Tee pattern). |
| **Tools you can use** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, a `write()`/`flush()` class assigned to `sys.stdout`/`sys.stderr`; `timeout` and `subprocess.TimeoutExpired`; `ThreadPoolExecutor` to run several programs at once. |
| **Pitfalls to avoid** | A `Popen()` never waited on can leave zombie processes. Replacing `sys.stderr` without restoring it affects all code run afterward in the same program. |
| **Best practices** | Use `sys.executable` rather than a hardcoded `"python"` to relaunch a script. Restore the original `sys.stderr`/`sys.stdout` at the end of the program after a Tee. |
