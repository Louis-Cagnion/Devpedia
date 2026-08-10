---
order: 10
---

# Text Processing (grep, sed, awk...)

A large part of the Unix terminal's power comes from a handful of tools specialized in text processing, designed to be combined with each other via [pipes](/?c=shells&s=bash&p=redirections-et-pipes). This chapter presents the ones used most often day to day.

## `grep`: searching text

```bash
grep "error" file.log         # displays lines containing "error"
grep -i "error" file.log      # case-insensitive (-i)
grep -v "error" file.log      # inverted: displays lines that do NOT contain "error"
grep -r "TODO" .              # recursive search across every file in a folder
grep -n "error" file.log      # also displays the line number
grep -c "error" file.log      # counts the number of matching lines, without displaying them
grep -E "error|warning" file.log  # -E enables extended regex (see the regex chapter)
grep -l "TODO" *.md           # displays only the NAMES of files containing the pattern
grep -q "TODO" *.md           # displays nothing: only used to test for presence (see below)
```

Like many Unix commands, these flags are initials of English words rather than arbitrary letters: `-i` = *ignore case*, `-v` = *invert*, `-r` = *recursive*, `-n` = *line number*, `-c` = *count*, `-E` = *extended (regex)*, `-l` = *files with matches (list)*, `-q` = *quiet*. Once you know these words, remembering the flag comes naturally — this pattern comes up in most of the commands in this chapter and the next.

Flags combine, sometimes with interactions worth knowing: `grep -rln "pattern" *.md` stacks recursive + list of files + line number, but `-l` **overrides `-n`** (you can't display a line number when only file names are shown). The ignored flag triggers no warning.

### Searching for several patterns: `\|` or `-E`

`grep` uses **basic** regex (BRE) by default, where alternation must be escaped. With `-E` (extended regex), it's written naturally:

```bash
grep "error\|warning" file.log    # BRE: alternation is written \|
grep -E "error|warning" file.log  # ERE: more readable, preferred
```

An unescaped `|` with no `-E` is searched for **literally**: `grep "a|b"` looks for the string `a|b`, and so finds nothing most of the time — with no error or warning. This is a classic pitfall. See the [Regex](/?c=domain-specific-languages-dsl&p=regex) chapter for the BRE/ERE difference.

### `grep`'s return code

`grep` isn't just for displaying: its **exit code** answers the question "did you find something?".

| Code | Meaning |
|---|---|
| `0` | at least one match found |
| `1` | no match (this is **not** an error) |
| `2` | an actual error (unreadable file, invalid pattern) |

This is what allows chaining it with `&&` or `||` (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
grep -rl "pattern" *.md || echo "not found"   # fallback message if nothing is found
grep -q "pattern" f.txt && process f.txt   # only processes the file if it contains the pattern
```

With `-q`, `grep` stops at the first match and displays nothing: this is the form to prefer when only the test result matters, especially on large files.

> This `1` return code explains a confusing behavior under `set -e`: a `grep` that finds nothing makes an entire script fail. The usual workaround is `grep pattern file || true`.

> **`grep` vs. `pgrep`**: despite the similar name, these are two independent commands that don't search the same thing. `grep` searches for a pattern in **text** (a file, a command's output...). `pgrep` (*process grep*, see [Process Management](/?c=shells&s=bash&p=gestion-des-processus)) searches for a pattern in the **list of running processes** and returns PIDs, not lines of text — `ps aux | grep pattern` and `pgrep pattern` actually answer roughly the same question, via two different routes.

## `sed`: search and replace

`sed` (*stream editor*) reads text **one line at a time** and applies one or more editing commands to each, never loading the whole file into memory. By default, it changes nothing on disk: it displays the result on standard output, line by line, as it goes.

A `sed` command breaks down into two parts: an optional **address** (which lines to target) and a **command** to apply to them.

```bash
sed 's/old/new/' file.txt         # no address -> the command applies to ALL lines
sed '3s/old/new/' file.txt        # address "3" -> only line 3
sed '2,4s/old/new/' file.txt       # address "2,4" -> only lines 2 through 4
```

The most used command is `s/pattern/replacement/` (the "s" for *substitute*): it searches for `pattern` (a [regex](/?c=domain-specific-languages-dsl&p=regex)) and replaces it with `replacement`. By default, `sed` only replaces the **first** occurrence found on each line — hence the `g` flag to also handle the following ones:

```bash
sed 's/old/new/' file.txt        # replaces the 1st occurrence per line, displays the result
sed 's/old/new/g' file.txt        # 'g' (global): replaces ALL occurrences on each line
sed -i 's/old/new/g' file.txt     # -i: modifies the file directly (in place), displays nothing
```

The other common command is `p` (*print*), which explicitly displays a line — combined with `-n` (which disables the automatic display of every processed line), it makes it possible to display only certain lines rather than the whole file:

```bash
sed -n '2,4p' file.txt   # -n: displays NOTHING by default; '2,4p': explicitly displays lines 2 through 4
```

> **Note:** without `-n`, `sed '2,4p'` would display every line of the file once (default behavior), and lines 2 through 4 a second time (because of the `p`) — `-n` and `p` almost always work as a pair.

## `awk`: processing text in columns

`awk` automatically splits each line into fields (`$1`, `$2`...), separated by default by spaces/tabs:

```bash
echo "John Smith 25" | awk '{ print $1 }'        # John -> first field
echo "John Smith 25" | awk '{ print $3, $1 }'    # 25 John

awk -F ',' '{ print $2 }' data.csv    # -F ',': changes the field separator to a comma
```

`$0` refers to the whole line, `$NF` to the **last** field of the line (`NF` = *Number of Fields*):

```bash
awk '{ print $NF }' file.txt   # displays the last word of each line
```

## `cut`: extracting columns simply

More limited than `awk`, but enough for simple cases:

```bash
cut -d ',' -f 2 data.csv         # -d: separator, -f: number of the field to extract
cut -c 1-5 file.txt               # extracts characters 1 through 5 of each line
```

## `sort` and `uniq`: sorting and deduplicating

```bash
sort file.txt                  # alphabetical sort
sort -n numbers.txt              # numeric sort (essential for numbers, otherwise sorted as strings)
sort -r file.txt                 # descending sort
sort file.txt | uniq            # removes CONSECUTIVE duplicate lines only
sort file.txt | uniq -c          # counts the occurrences of each line
```

> **Note:** `uniq` only detects **adjacent** duplicates — that's why it's almost always combined with `sort` beforehand, which groups identical lines together.

## `wc`: counting

```bash
wc -l file.txt   # number of lines
wc -w file.txt    # number of words
wc -c file.txt    # number of bytes
```

## Combining these tools

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) keeps 404 error lines
# 2) extracts the IP address (1st field)
# 3) sorts to group identical IPs together
# 4) counts the occurrences of each IP
# 5) sorts by descending occurrence count -> the most frequent IPs first
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `grep` searches, `sed` replaces, `awk` processes by columns — designed to be combined via pipes rather than used in isolation. |
| **Tools you can use** | `grep -i`/`-v`/`-r`/`-E`, `sed 's/.../.../'`, `awk '{ print $1 }'`, `cut`, `sort`/`uniq`, `wc`. |
| **Pitfalls to avoid** | An unescaped `\|` with no `-E` in `grep` is searched for literally, with no error or warning; `uniq` with no prior `sort` only detects adjacent duplicates. |
| **Best practices** | Combine `sort` before `uniq` to deduplicate correctly; use `grep -q` rather than plain `grep` when only the test result (found/not found) matters. |
