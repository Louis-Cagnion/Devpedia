---
order: 10
---

# Text and Object Processing

Where Bash relies on [specialized text tools](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`), PowerShell does the same job with generic cmdlets that filter, transform, and select **objects** — text is just a special case, the one where the object being handled is a string.

## `Select-String`: searching text (the equivalent of `grep`)

```powershell
Select-String "error" file.log            # displays lines containing "error"
Select-String -CaseSensitive "Error" file.log   # case-sensitive (the opposite of the default)
Select-String -NotMatch "error" file.log   # inverted: lines that do NOT contain "error"
Select-String "TODO" -Path .\* -Recurse         # recursive search across every file in a folder
Select-String "error" file.log | Measure-Object   # counts matching lines
Select-String -Pattern "error|warning" file.log   # pattern = an actual .NET regex by default
```

> **Note:** unlike `grep` where `-E` must be added to enable extended regex, `Select-String` interprets its pattern as a regex **by default** — use `-SimpleMatch` to fall back to a literal text search, the opposite of Bash's convention.

Each result is an object with directly usable properties, rather than a plain line of text to re-parse:

```powershell
Select-String "error" file.log | Select-Object LineNumber, Line
```

## `-replace`: search and replace (the equivalent of `sed`)

```powershell
(Get-Content file.txt) -replace "old", "new"          # replaces all occurrences per line
(Get-Content file.txt) -replace "old", "new" | Set-Content file.txt   # modifies the file
```

> **Note:** `-replace` replaces **all** occurrences by default (the opposite of `sed 's///'` with no `g`, which only replaces the first) — there's no flag equivalent to `sed`'s `g` to add, this is the default behavior.

To only process certain lines (the equivalent of a `sed '2,4s///'` address), you filter explicitly by index:

```powershell
(Get-Content file.txt)[1..3] -replace "old", "new"   # lines 2 through 4 (0-based index)
```

## `ConvertFrom-Csv`, `ConvertFrom-Json`: processing structured data (the equivalent of `awk`)

Where `awk` manually splits a line into fields (`$1`, `$2`...), PowerShell directly converts a structured format into typed objects:

```powershell
Import-Csv data.csv | Select-Object Name, Age    # columns accessible by name, not by position
Get-Content data.json | ConvertFrom-Json | Select-Object -ExpandProperty user
```

For unstructured text closer to how `awk` is used (splitting on spaces), `-split` is still available:

```powershell
("John Smith 25" -split " ")[0]     # John -> first field
```

## `Sort-Object` and `Get-Unique`/`-Unique`: sorting and deduplicating

```powershell
Get-Content file.txt | Sort-Object                     # alphabetical sort
Get-Content numbers.txt | Sort-Object { [int]$_ }        # explicit numeric sort
Get-Content file.txt | Sort-Object -Descending          # descending sort
Get-Content file.txt | Sort-Object -Unique               # sorts AND deduplicates in a single step
Get-Content file.txt | Group-Object | Sort-Object Count -Descending   # counts occurrences
```

> **Note:** unlike `uniq` in Bash (which only detects **adjacent** duplicates, hence the need to sort first), `Sort-Object -Unique` and `Group-Object` work on the whole collection, regardless of the initial order — no need to sort beforehand to deduplicate correctly.

## `Measure-Object`: counting (the equivalent of `wc`)

```powershell
(Get-Content file.txt | Measure-Object -Line).Lines    # number of lines
(Get-Content file.txt | Measure-Object -Word).Words     # number of words
(Get-Content file.txt | Measure-Object -Character).Characters   # number of characters
```

## Combining these tools

```powershell
Select-String "404" access.log |
    ForEach-Object { ($_.Line -split " ")[0] } |
    Group-Object |
    Sort-Object Count -Descending
# 1) keeps 404 error lines
# 2) extracts the IP address (1st field of each line)
# 3) groups identical IPs together
# 4) sorts by descending occurrence count -> the most frequent IPs first
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PowerShell treats text as a special case of object: `Select-String` (grep), `-replace` (sed), `ConvertFrom-Csv`/`Json` (awk on structured data) handle typed objects, not just lines. |
| **Tools you can use** | `Select-String`, `-replace`, `-split`, `Sort-Object -Unique`, `Group-Object`, `Measure-Object`. |
| **Pitfalls to avoid** | Forgetting that `Select-String` interprets its pattern as a regex by default (unlike `grep`, which requires `-E`). |
| **Best practices** | Use `Sort-Object -Unique`/`Group-Object` rather than a manual sort followed by deduplication — they work on the whole collection, with no prior order required. |
