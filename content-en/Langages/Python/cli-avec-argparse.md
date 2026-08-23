---
order: 14
---

# Building a CLI with `argparse`

A **CLI** (*Command-Line Interface*) is a program you control entirely through commands typed into a [terminal](/?c=bases-de-l-informatique&p=le-terminal), rather than clicks in a graphical interface: `git`, `ls`, or this chapter's `pdf_parser process report.pdf --brand peugeot` script are examples. A Python script launched this way receives its arguments in `sys.argv` (a plain list of strings), exactly like `$1`/`$2` in [Bash](/?c=shells&s=bash&p=scripts-et-shebang). Reading them one by one by hand quickly becomes tedious as soon as you need to handle options, default values, or produce a proper help message. **`argparse`** (a standard library module) builds all of that from a declarative description of the expected arguments.

## Positional and optional arguments

```python
import argparse

parser = argparse.ArgumentParser(prog="converter")
parser.add_argument("file", help="Path of the file to convert")           # positional: required, identified by position
parser.add_argument("--format", default="json", help="Output format")    # optional: identified by name, "--" in front

args = parser.parse_args()
print(args.file, args.format)
```

```bash
python converter.py report.csv               # file="report.csv", format="json" (default value)
python converter.py report.csv --format=xml  # file="report.csv", format="xml"
```

| | Positional | Optional |
|---|---|---|
| Declaration syntax | `add_argument("name")` | `add_argument("--name")` |
| Identified by | Its position in the command | Its name, prefixed with `--` |
| Required by default? | Yes | No, unless `required=True` is set explicitly |
| Access in `args` | `args.name` | `args.name` (the `--` doesn't appear in the attribute name) |

## Types, default values, boolean flags

```python
parser.add_argument("--repeats", type=int, default=1)  # automatically converts the received string to an int
parser.add_argument("--verbose", action="store_true")  # boolean flag: present -> True, absent -> False

args = parser.parse_args(["--repeats", "3", "--verbose"])
print(args.repeats, args.verbose)   # 3 True
```

> **Pitfall:** without `type=int`, `args.repeats` stays a **string** (`"3"`), even though it "looks" like a number: `args.repeats * 2` would give `"33"` (string repetition), not `6`.
>
> **Best practice:** always specify `type=` as soon as an argument expects something other than a plain string; `argparse` itself raises a clear error if the conversion fails (e.g. `--repeats abc`), rather than letting a manual conversion fail further down the program with a confusing message.

## Automatically generated help

`argparse` builds `--help` with no extra code, from the `help=` provided for each argument:

```bash
python converter.py --help
# usage: converter [-h] [--format FORMAT] file
#
# positional arguments:
#   file             Path of the file to convert
#
# options:
#   -h, --help       show this help message and exit
#   --format FORMAT  Output format
```

> **Best practice:** always provide `help=` on every argument, including ones that seem obvious while writing them: this is the text that will show up for a user discovering the tool months later, without the context the author had in mind.

## Subcommands: several actions in a single program

A tool that offers several distinct actions (`git commit`, `git push`, [`docker run`](/?c=docker&p=commandes-essentielles)...) groups them into **subcommands**, each with its own arguments. `add_subparsers` builds this split:

```python
import argparse

parser = argparse.ArgumentParser(prog="pdf_parser")
subcommands = parser.add_subparsers(dest="command", required=True)

process_parser = subcommands.add_parser("process", help="Process a PDF")
process_parser.add_argument("pdf_path", help="Path to the PDF to process")
process_parser.add_argument("--brand", required=True, help="Brand identifier")

args = parser.parse_args()

if args.command == "process":
    print(f"Processing {args.pdf_path} for brand {args.brand}")
```

```bash
pdf_parser process report.pdf --brand peugeot
# Processing report.pdf for brand peugeot

pdf_parser process report.pdf
# error: the following arguments are required: --brand
```

- `dest="command"` names the attribute (`args.command`) that will hold the name of the subcommand actually used (`"process"` here), so it can later be tested with an `if`.
- Each subcommand created by `add_parser(...)` is a full `ArgumentParser` in its own right: it has its own arguments, independent of the other subcommands'.

> **Pitfall:** omitting `required=True` on `add_subparsers()`. A program launched with no subcommand at all then leaves `args.command` as `None`, with no error raised by `argparse` itself: the program keeps running, potentially all the way to a point much later where the missing command ends up causing a confusing failure.
>
> **Best practice:** consistently declare `required=True` on `add_subparsers()` as soon as at least one subcommand is required for the program to make sense; `argparse` then refuses to start without a command specified, with an explicit error message rather than a silent failure further down.

## Making a CLI testable: never read `sys.argv` directly

`parser.parse_args()` with no argument reads `sys.argv` directly: convenient for real-world use, but impossible to unit test without launching a real subprocess. The fix: accept the arguments as a parameter, defaulting to `None` to fall back on `sys.argv` only in real usage:

```python
import sys

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pdf_parser")
    # ... argument declarations ...
    args = parser.parse_args(argv)   # argv=None -> argparse reads sys.argv itself; otherwise, uses the given list
    # ... program logic ...
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

A test can then call `main(["process", "test.pdf", "--brand", "peugeot"])` directly, without ever invoking a real terminal, and check the returned integer (`0` = success, any other value = failure), exactly like a [Bash](/?c=shells&s=bash&p=bash) script's [exit code](/?c=shells&s=bash&p=scripts-et-shebang).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `argparse` builds an argument parser (positional, optional, typed) from a declarative description, with `--help` generated automatically. `add_subparsers` groups several distinct actions into a single program. |
| **Tools you can use** | `add_argument` (`type=`, `default=`, `action="store_true"`, `required=`), `add_subparsers(dest=..., required=True)`. |
| **Pitfalls to avoid** | Forgetting `type=` on a numeric argument (stays a string). Omitting `required=True` on `add_subparsers()`: `args.command` can stay `None` with no immediate error. |
| **Best practices** | Always provide `help=` on every argument. Make `main()` testable by accepting `argv` as a parameter rather than reading `sys.argv` directly. |
