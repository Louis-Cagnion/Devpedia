---
order: 17
---

# Subprocesses and Redirecting Standard Streams

A Python program can just as well launch ANOTHER program (`subprocess`) as change its own display behavior (`sys.stdout`/`sys.stderr`): this chapter covers both of these uses of the standard `sys` module.

## Launching an external program: `subprocess`

```python
import subprocess

result = subprocess.run(["ls", "-la"], capture_output=True, text=True)  # BLOCKING
print(result.returncode)                                                # 0 = success, any other value = failure
print(result.stdout)                                                    # what the program printed
```

`subprocess.run()` waits for the launched process to finish before continuing.

```python
process = subprocess.Popen(["ls", "-la"])  # NON-BLOCKING: returns IMMEDIATELY, the process runs alongside
# ... do something else while "process" is running ...
process.wait()  # explicitly wait for it to finish, if needed
process.poll()  # None if still running, otherwise the return code
```

`subprocess.run()` (the most common) launches a process and WAITS for it to finish before continuing; `subprocess.Popen()` launches a process and immediately returns an object representing it, useful for launching SEVERAL processes in parallel (one per site, one per file...) without waiting for each one before starting the next.

> **Pitfall:** with `Popen()`, never calling `.wait()` nor checking `.poll()` anywhere in the program can leave "zombie" processes running unreaped, if the main program ends before they do.

## `sys.executable`: the path of the running interpreter

```python
import sys

sys.executable  # "/usr/bin/python3.12" or "C:\...\python.exe" -> ABSOLUTE path of the interpreter running THIS code

subprocess.run([sys.executable, "other_script.py"])  # relaunches a script with the SAME interpreter/environment
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
sys.stderr = DualStream(sys.stderr, log)  # replaces the module object with the dual one, without touching the rest of the code

print("Error", file=sys.stderr)  # shows on screen AND is written to execution.log
```

`sys.stdout`/`sys.stderr` are plain objects, replaceable like any other module variable: assigning them an object that exposes `.write()`/`.flush()` silently intercepts everything already written elsewhere with `print(..., file=sys.stderr)`. The name **Tee** comes from the Unix `tee` command (already seen in [Bash](/?c=shells&s=bash&p=redirections-et-pipes)/[PowerShell](/?c=shells&s=powershell&p=powershell)), which duplicates a stream to several destinations at once.

> **Pitfall:** replacing `sys.stderr` changes its behavior for the WHOLE program, including third-party code that writes to it; restoring the original object (`sys.stderr = dual_stream.original`) at the end of the program avoids a lingering side effect if the script is later imported as a module elsewhere.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `subprocess.run()` launches an external process and waits for it to finish; `subprocess.Popen()` launches it without waiting, for parallelism. `sys.executable` gives the path of the running interpreter. `sys.stdout`/`sys.stderr` are replaceable objects, which allows duplicating an output (Tee pattern). |
| **Tools you can use** | `subprocess.run()`/`Popen()`, `.wait()`/`.poll()`/`.returncode`, `sys.executable`, a `write()`/`flush()` class assigned to `sys.stdout`/`sys.stderr`. |
| **Pitfalls to avoid** | A `Popen()` never waited on can leave zombie processes. Replacing `sys.stderr` without restoring it affects all code run afterward in the same program. |
| **Best practices** | Use `sys.executable` rather than a hardcoded `"python"` to relaunch a script. Restore the original `sys.stderr`/`sys.stdout` at the end of the program after a Tee. |
