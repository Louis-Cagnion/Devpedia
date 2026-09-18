---
order: 13
---

# XML

**XML** (*eXtensible Markup Language*) is, like [HTML](/?c=langages&s=html&p=html), a markup language: data organized into nested tags, each of which can carry attributes. Unlike HTML, whose tags (`<p>`, `<div>`...) have a meaning fixed in advance by the browser, XML imposes no particular tags: each XML-based format defines its own tag names, according to the data it describes.

```xml
<listing>
    <reference>REF-001</reference>
    <vehicle brand="Renault">
        <model>Clio</model>
    </vehicle>
</listing>
```

| Term | What it means |
|---|---|
| Element | An opening/closing tag and everything it contains (`<reference>REF-001</reference>`) |
| Attribute | A key="value" pair inside an opening tag (`brand="Renault"`) |
| Well-formed document | Every opened tag is properly closed, in the right order, with no overlap (`<a><b></a></b>` is invalid) |

> **Note:** XML and [JSON](/?c=langages&s=php&p=http) answer the same need (exchanging structured data between systems), but XML remains common in older feeds (supplier catalogs, business exports) set up before JSON became widespread.

## Reading an XML file: DOM vs streaming

Two ways of reading an XML file differ in how much memory they use:

| Approach | Principle | Memory used | Typical use |
|---|---|---|---|
| **DOM** (*Document Object Model*) | Loads the whole file into a navigable tree, in memory | Proportional to the entire file's size | Small file, need to jump back and forth between several parts of the document |
| **Streaming** (e.g. `XMLReader` in PHP) | Reads the file sequentially, one node at a time, never loading it all | Constant, regardless of file size | Large file (tens of thousands of entries), processed once, in order |

```php
<?php
$reader = new XMLReader();
$reader->open('catalog.xml');

while ($reader->read()) {
    if ($reader->nodeType === XMLReader::ELEMENT && $reader->localName === 'listing') {
        $node = $reader->expand();          // expands THIS element into a local mini-DOM
        $doc  = new DOMDocument();
        $doc->appendChild($doc->importNode($node, true));
        // ... extract data from $doc, then move on to the next listing
    }
}
$reader->close();
?>
```

`expand()` combines both approaches: the whole file is still read as a stream (constant memory), but each individual element becomes a small classic DOM tree, simpler to query (`getElementsByTagName()`...) than a manual node-by-node walk.

> **Best practice:** streaming for a large file processed once in order (a catalog import, for example); DOM for a small file or a need for free navigation across its parts (going back up to an ancestor, comparing two distant branches).

## The XXE flaw (*XML External Entity*)

The XML format allows declaring an **external entity**: a shortcut that, once used in the document, is replaced with the content of an external resource (a local file, a URL) at parse time:

```xml
<?xml version="1.0"?>
<!DOCTYPE listing [
  <!ENTITY leak SYSTEM "file:///etc/passwd">
]>
<listing>
    <reference>&leak;</reference>
</listing>
```

If an XML parser resolves this entity without restriction, `&leak;` is replaced with the content of the `/etc/passwd` file (on a Unix system), which then ends up in the extracted data: this is the **XXE** flaw. Any service that accepts XML supplied by a third party (a file import, an API) is concerned, as soon as the XML content isn't guaranteed 100% trustworthy.

> **Pitfall:** thinking a simple text-content check ("the file looks like a valid listing") is enough to rule out XXE. The `<!DOCTYPE ...>` declaration can sit anywhere at the top of the document, without changing anything about the appearance of the useful data that follows.

### Protecting against it: disabling external entity resolution

```php
<?php
libxml_set_external_entity_loader(fn () => null);

$reader = new XMLReader();
$reader->open('file_supplied_by_a_third_party.xml');
?>
```

`libxml_set_external_entity_loader()` replaces, for the entire PHP process, the mechanism that fetches an external entity's content with a function that never returns anything (`null`): every external entity declared in the document is therefore ignored, rather than resolved.

> **Best practice:** call this function before reading any XML document whose origin isn't 100% guaranteed (supplied by a partner, uploaded by a user...), even if the expected format normally declares no external entity: the protection costs nothing for a legitimate document, which simply declares none.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | XML organizes data into nested tags with free-form names and attributes. Reading an XML file is done either via DOM (everything in memory, free navigation) or streaming (constant memory, sequential reading); `expand()` combines both. A poorly controlled XML external entity allows reading an arbitrary file on the server (the XXE flaw). |
| **Tools you can use** | `XMLReader` (streaming) and `DOMDocument` (full tree) in PHP, `expand()` to combine both, `libxml_set_external_entity_loader()` to disable external entities. |
| **Pitfalls to avoid** | Loading a very large XML file entirely into DOM (memory proportional to the file). Thinking a text-content check is enough to rule out XXE. |
| **Best practices** | Streaming for sequential processing of large volumes, DOM for a need for free navigation. Systematically disable external entity resolution before reading an XML document of unguaranteed origin. |
