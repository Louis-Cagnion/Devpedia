---
order: 12
---

# SSRF: Bypassing the Allowlist

[Securing your data](/?c=langages&s=php&p=securite) introduces SSRF (forcing the server to request an internal destination on the attacker's behalf) and its reference defense: validating the target host against an explicit allowlist rather than trusting a URL supplied by the client. This chapter covers two ways in which that allowlist, although in place, can be bypassed.

## Bypassing the Allowlist Through an HTTP Redirect

A validation that only checks the STARTING URL supplied by the user, without re-checking where an HTTP redirect then leads, leaves a door open: the attacker hosts a redirect to their real target themselves.

```text
1. Allowlist: only "images.example.com"

2. The attacker supplies: http://images.example.com/redirect-to-target
   -> passes validation: the starting host IS images.example.com

3. The server follows the request... which actually answers with an HTTP redirect:
   HTTP/1.1 302 Found
   Location: http://169.254.169.254/latest/meta-data/

4. If the code making the request automatically FOLLOWS this redirect
   (the default behavior of most HTTP libraries), it reaches
   the real internal target, never re-checked against the allowlist
```

| | |
|---|---|
| **Pitfall** | Validating the host only once, before sending the request, assuming the destination stays the same throughout the exchange |
| **Best practice** | Disable automatic redirect following for any outgoing request built from user data, or re-validate the destination host at EACH redirect followed, not only on the initial request |

## SSRF Through a Document Generator (HTML to PDF)

A tool that turns HTML into PDF (downloadable invoice, report export) is, technically, a mini-browser: it loads and displays resources the way Chrome or Firefox would, including images or `iframe` elements referenced by a URL. If the HTML content to convert includes unfiltered user data, this feature becomes exposed to the same SSRF risk as an explicit HTTP call.

```html
<!-- Content inserted by the user in a field meant to show only a profile picture -->
<img src="http://169.254.169.254/latest/meta-data/iam/security-credentials/">
<!-- or, depending on the rendering engine, a LOCAL file path instead of a URL -->
<img src="file:///etc/passwd">
```

If the rendering engine actually displays the result of this request in the generated PDF (or returns it in an exploitable way), the content of an internal resource or of a local file ends up exposed in a document the attacker can then download.

| | |
|---|---|
| **Pitfall** | Treating a PDF generator as a mere formatting tool, without realizing that it makes network/file requests like a browser to resolve every resource referenced in the HTML |
| **Best practice** | In the rendering engine's configuration, disable loading external resources and access to the local file system; failing that, apply the same host allowlist as for a classic SSRF call to every URL inserted into the content to convert |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A host allowlist protects against a direct SSRF, but can still be bypassed by an HTTP redirect that is not re-validated, or by a document generator (HTML→PDF) that loads resources like a browser without it looking like a "network request". |
| **Tools you can use** | An HTTP library's option to disable redirect following; a PDF rendering engine's option to disable loading external resources/local files. |
| **Pitfalls to avoid** | Validating the host only on the initial request, never after a followed redirect. Treating a PDF generator as unable to make network requests. |
| **Best practices** | Disable automatic redirect following or re-validate at each hop. Restrict the resources a document rendering engine can load to what is strictly necessary. |
