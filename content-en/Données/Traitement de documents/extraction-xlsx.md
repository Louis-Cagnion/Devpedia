---
order: 5
---

# Reading an Excel Workbook (.xlsx) by Script

An **.xlsx** file (Excel workbook) isn't a plain grid of values: every cell containing a formula (`=A1+B1`) stores both that **formula** and its **last calculated value**, cached by Excel at the last save. A library reading this file has to choose which of the two it returns.

## [`openpyxl`](https://openpyxl.readthedocs.io): formula by default, cached value with `data_only`

```python
import openpyxl

workbook = openpyxl.load_workbook("report.xlsx")
sheet = workbook.active   # the default active sheet, the last one open in Excel

for row in sheet.iter_rows(min_row=2, values_only=True):
    print(row)   # returns the FORMULA STRING ("=A1+B1"), not the computed result
```

```python
workbook = openpyxl.load_workbook("report.xlsx", data_only=True)
sheet = workbook.active

for row in sheet.iter_rows(min_row=2, values_only=True):
    print(row)   # now returns the CACHED VALUE, not the formula
```

| | Without `data_only` (default) | With `data_only=True` |
|---|---|---|
| Cell with no formula | The value itself | The value itself (identical) |
| Cell with a formula | The formula string (`"=A1+B1"`) | The last calculated value, cached by Excel |

> **Pitfall:** `data_only=True` NEVER recalculates a formula itself: `openpyxl` is a plain reader of the file as stored on disk, never a calculation engine. If the file was never reopened/resaved in Excel after a change affecting a formula, the cached value can be missing (`None`, formula never evaluated) or stale (reflecting an old calculation).
>
> **Best practice:** if the freshness of the calculated result is critical, make sure the file was actually recalculated/resaved in Excel (or an equivalent tool) before reading it with `data_only=True`; otherwise, recompute the value yourself from raw data rather than trusting the cache.

## Accessing a specific sheet among several

```python
workbook = openpyxl.load_workbook("report.xlsx", data_only=True)
print(workbook.sheetnames)              # list of the workbook's sheet names
sheet = workbook["Sales 2025"]          # access a specific sheet by its name
```

A workbook can hold several sheets (as many tabs as in Excel); `workbook.active` only returns the one that was open last at the last save, not necessarily the first one nor the intended one.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An `.xlsx` file stores both a cell's formula and its last calculated cached value. `openpyxl` returns the formula by default, the cached value with `data_only=True`; it never recalculates anything itself. |
| **Tools you can use** | `openpyxl.load_workbook(path, data_only=True)`, `workbook.sheetnames`, `workbook["Sheet Name"]`, `sheet.iter_rows(min_row=..., values_only=True)`. |
| **Pitfalls to avoid** | Assuming `data_only=True` recalculates a formula changed since the last Excel save. Accessing `workbook.active` assuming it's the first sheet. |
| **Best practices** | Check that the file was resaved in Excel after any formula change, before reading its cached value. Access a sheet by its explicit name rather than by `active` as soon as the workbook holds several. |
