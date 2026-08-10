# Description

A program never manipulates numbers or text "as such": it manipulates their **encoding** in memory, over a finite number of bits. This physical constraint produces behaviors often wrongly blamed on the language being used, when they're actually common to all of them: `0.1 + 0.2` isn't exactly `0.3` in JavaScript, but it isn't in C, Python, or PHP either.

This section explains these mechanisms once and for all, independently of any language. The language chapters point back here for the "why", and focus on what's specific to them: available types, comparison functions, special values.

You'll find the different topics below:
