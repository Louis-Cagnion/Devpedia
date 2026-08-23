---
order: 1
---

# What does a computer execute?

Before we talk about terminals, code editors, or any specific programming language, there’s one key question: What does a computer actually do when we say it’s “executing” something? This chapter lays that foundation: the rest of the site will build upon it.

## A computer follows instructions without understanding them

A computer does not “think” and never guesses at an intention. It does one thing only, very quickly and without asking questions: it reads a list of instructions, in order, and executes them one by one, exactly as they are written.

```text
Instruction 1  →  executed exactly as written
Instruction 2  →  executed exactly as written
Instruction 3  →  executed exactly as written
```

> **Analogy:** It’s like following a recipe to the letter, without ever improvising. If the recipe says “crack 2 eggs,” you crack 2 (no more, no less) and you don’t ask why.

**Why it's important:** Just about everything that might seem “smart” about a computer (such as correcting a typo or guessing what you meant to do) actually comes from instructions written in advance by a human for that specific case, never from the machine’s own understanding of the problem.

> **Pitfall:** believing that an imprecise instruction will be “reasonably understood.” The computer always chooses a precise interpretation (often the most literal one possible), not necessarily the one intended when writing the code; see the chapter on [bugs](/?c=bases-de-l-informatique&p=le-bug) for what this actually results in.
>
> **Best practice:** Write instructions that are as precise as possible, leaving nothing for the machine to “guess.”

## Code: a list of instructions written by a human

**Code** (or **source code**) is the text that contains these instructions. It is written by a person in a **programming language**, one of the many “languages” that a computer can understand, each with its own grammar (Python, [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C...).

```text
display "Hello"    → displays "Hello" on the screen
display "Goodbye"  → displays "Goodbye" on the screen right after
```

> **Note:** The block above is not a real programming language: it is **pseudocode**, a simplified way of writing instructions without the precise syntax of an actual language. It serves only to illustrate the concept of a sequence of instructions before choosing a real one.

Devpedia provides in-depth coverage of several programming languages, each in its own chapter (for example, [Python](/?c=langages-de-programmation&s=python&p=python) or [C](/?c=langages-de-programmation&s=c&p=c)). This chapter does not cover any of them specifically; it focuses solely on the principles common to all of them.

> **Pitfall:** Do not try to run the pseudocode above as-is in an actual programming language: it will not work, as it is only a simplified illustration, not actual syntax.
>
> **Best practice:** Always verify the exact syntax required by the chosen language (see the dedicated chapter) before writing code intended to be actually executed.

## The file: where the code is stored

A **file** is a unit of data stored on a computer's hard drive, identified by a **name** and an **extension**, the part after the period, which indicates the type of content.

| File extension | Content type | Example name |
|---|---|---|
| `.txt` | Plain text, no formatting | `notes.txt` |
| `.py` | Source code in Python | `program.py` |
| `.js` | Source code in JavaScript | `script.js` |
| `.md` | Text in Markdown format (as on this page) | `README.md` |

> **Analogy:** A file is like a sheet of paper stored in a binder (the **folder**), with a name written on the tab so you can find it.

Source code is almost always written in a text file; you need to understand what a “file” is before you can navigate a folder tree or open anything in an editor, which will be covered in the next two chapters.

> **Pitfall:** believing that renaming a file changes its contents: renaming `notes.txt` to `notes.py` does not transform arbitrary text into valid Python code. The file extension is merely a **cue** for humans and tools (which editor to open, which syntax highlighting to apply); what truly determines the nature of a file is what opens and interprets it, never its name.
>
> **Best practice:** Choose the file extension that matches the actual content of the file, not the other way around.

## Program: what the computer actually executes

Code written by a human is not always what the processor executes directly. There are two approaches:

| | Interpreted | Compiled |
|---|---|---|
| What happens | Another program, **the interpreter**, reads the code and executes it directly, line by line | A program, the **compiler**, first converts all the code into a form that the processor natively understands |
| When execution begins | Immediately | Only after the transformation (**compilation**) is complete |
| Example languages | Python, JavaScript | C, [C++](/?c=langages-de-programmation&s=cpp&p=cpp) |

> **Further reading:** This chapter focuses on this fundamental distinction; the details of what happens during compilation (steps, possible errors) are covered in [The Compilation Process](/?c=langages-de-programmation&s=c&p=compilation).

> **Pitfall:** believing that a compiled program will run anywhere as-is. An executable compiled for Windows will not run on Linux or macOS: compilation produces code specific to the target system, so you must recompile for each target system.
>
> **Best practice:** For an interpreted program, verify that the interpreter for the correct language is installed on the target machine; for a compiled program, recompile it for each target system rather than assuming that a single executable will work everywhere.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A computer executes instructions to the letter, without understanding their meaning. **Code** is a list of instructions, written in a **programming language** and stored in a **file**. A program is either **interpreted** (executed directly) or **compiled** (transformed before execution). |
| **Tools You Can Use** | None for now: the terminal and code editor, which you’ll use to write and run your own code, will be covered in the next two chapters. |
| **Pitfalls to Avoid** | Believing that the computer “understands” what you want to do, or that it can guess an intention not explicitly written in the code. Confusing any file with a program: a file named `.txt` is never executed, while a file named `.py` is executed only through a Python interpreter. |
| **Best Practices** | When faced with a problem, always distinguish between “what the code says to do” and “what I wanted it to do”: most beginner errors stem from an instruction that was executed to the letter but poorly written. |
