---
order: 3
---

# Représentation des données

A program never manipulates numbers or text "as such": it manipulates their **encoding** in memory, over a finite number of bits. This physical constraint produces behaviors often wrongly blamed on the language being used, when they're actually common to all of them: `0.1 + 0.2` isn't exactly `0.3` in [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), but it isn't in [C](/?c=langages-de-programmation&s=c&p=c), [Python](/?c=langages-de-programmation&s=python&p=python), or [PHP](/?c=langages-de-programmation&s=php&p=php) either.

This section explains these mechanisms once and for all, independently of any language. The language chapters point back here for the "why", and focus on what's specific to them: available types, comparison functions, special values.

You'll find the different topics below:
