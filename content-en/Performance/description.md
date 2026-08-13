# Description

Optimizing a program starts with understanding where its time actually goes, and it's rarely where you'd think. This section gathers performance principles that don't depend on any particular language: they apply just as well to a Python script as to a web page or a database access.

The throughline is a distinction that keeps coming up: the time your program **wastes on its own** (fixed waits, redone work, unnecessary round trips) and the time it **spends waiting on someone else** (the network, a disk, a remote service). The first can be eliminated with no trade-off. The second can sometimes be worked around, but that often costs something elsewhere, and that's where trade-offs begin.

The numbers used as examples come from a real case: optimizing a browser automation program, cut from 61 to 14 seconds for the same work, with no change to what it produces.

You'll find the different topics below:
