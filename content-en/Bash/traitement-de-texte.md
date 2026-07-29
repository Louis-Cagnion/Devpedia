---
order: 9
---

# Text Processing (grep, sed, awk...)

Much of the power of the Unix terminal comes from a handful of specialized text-processing tools, designed to be combined using pipes (see the chapter on redirection). This chapter introduces the ones most commonly used on a daily basis.

## `grep` : Search for text

```bash
grep "erreur" fichier.log         # displays the lines containing "error"
grep -i "erreur" fichier.log      # case-insensitive (-i)
grep -v "erreur" fichier.log      # reverse: displays the rows that do NOT contain "error"
grep -r "TODO" .                  # Recursive search of all files in a folder
grep -n "erreur" fichier.log      # also displays the line number
grep -c "erreur" fichier.log      # counts the number of matching lines without displaying them
grep -E "erreur|warning" fichier.log  # -E enables extended regular expressions (see the chapter on regular expressions)
```

## `sed` : Find and Replace

```bash
sed 's/ancien/nouveau/' fichier.txt        # Replaces the first occurrence on each line and displays the result
sed 's/ancien/nouveau/g' fichier.txt        # 'g' (global): replaces ALL occurrences on each line
sed -i 's/ancien/nouveau/g' fichier.txt     # -i: modifies the file directly (in place)
sed -n '2,4p' fichier.txt                    # displays only lines 2 through 4
```

> **Note:** `sed` processes the text line by line and uses regular expressions (see the dedicated chapter) for the search pattern—`s/motif/remplacement/` is its most commonly used command ("s" stands for *"substitute"*).

## `awk` : Formatting text in columns

`awk` automatically splits each line into fields (`$1`, `$2`...), separated by spaces or tabs by default:

```bash
echo "Jean Dupont 25" | awk '{ print $1 }'        # Jean -> first field
echo "Jean Dupont 25" | awk '{ print $3, $1 }'    # 25 John

awk -F ',' '{ print $2 }' donnees.csv    # -F ',' : changes the field separator to a comma
```

`$0` refers to the entire row; `$NF` refers to the **last** field in the row (`NF` = *Number of Fields*):

```bash
awk '{ print $NF }' fichier.txt   # displays the last word of each line
```

## `cut` : Easily Extract Columns

More limited than `awk`, but sufficient for simple cases:

```bash
cut -d ',' -f 2 donnees.csv       # -d: separator, -f: number of the field to extract
cut -c 1-5 fichier.txt            # extracts characters 1 through 5 from each line
```

## `sort` and `uniq`: Sort and deduplicate

```bash
sort fichier.txt                  # alphabetical order
sort -n nombres.txt                # numeric sorting (essential for numbers; otherwise, sort by string)
sort -r fichier.txt                 # descending order
sort fichier.txt | uniq            # removes only CONSECUTIVE duplicate lines
sort fichier.txt | uniq -c          # counts the number of occurrences of each line
```

> **Note:** `uniq` only detects **adjacent** duplicates—that's why it's almost always used in combination with `sort` first, which groups identical lines together.

## `wc` : to count

```bash
wc -l fichier.txt   # number of lines
wc -w fichier.txt    # word count
wc -c fichier.txt    # number of bytes
```

## Combining these tools

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) Keep the 404 error lines
# 2) extracts the IP address (first field)
# 3) sorts to group identical IP addresses
# 4) counts the number of occurrences of each IP address
# 5) Sorts by number of occurrences in descending order -> the most frequent IP addresses first
```
