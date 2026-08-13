---
order: 5
---

# Usability Heuristics (Nielsen)

In 1994, usability researcher Jakob Nielsen formulated ten empirical rules for evaluating whether an interface is usable: neither a theoretical framework nor an official checklist, but ten observations drawn from analyzing hundreds of failing interfaces. Thirty years later, they remain the field's most cited reference.

| # | Heuristic | What it requires | Concrete example | Pitfall if ignored |
|---|---|---|---|---|
| 1 | Visibility of system status | Keep the user informed of what's happening, with feedback within a reasonable time | A progress bar during a download, a "Saved" message after saving | The user doesn't know if their action worked: they click several times, or give up |
| 2 | Match between system and the real world | Use the user's words and concepts, not the system's internal jargon | A trash can icon for "delete", rather than a technical error code | The user has to guess or mentally translate a language that isn't theirs |
| 3 | User control and freedom | Provide a clear "emergency exit" for an action triggered by mistake | An "Undo" button after a deletion, a "Back" in a multi-step form | The user feels trapped in a state they can't get out of |
| 4 | Consistency and standards | Never let the same words or elements mean two different things; follow platform conventions | A "Save" button always in the same place from one screen to another | The user has to relearn the interface on every screen instead of reusing what they already know |
| 5 | Error prevention | Design to prevent a problem rather than display a good error message after the fact | Graying out a "Submit" button while a required field is empty; asking for confirmation before a deletion | The user discovers the error only after making it, sometimes too late to undo |
| 6 | Recognition rather than recall | Make objects, actions, and available options visible, without requiring them to be remembered | A history of recent searches offered automatically | The user has to retain information from one screen to another: needless mental load |
| 7 | Flexibility and efficiency of use | Offer shortcuts for the experienced user, invisible and unobtrusive to the beginner | A keyboard shortcut for a frequent action, in addition to the visible button | The interface stays as slow for intensive daily use as for the very first visit |
| 8 | Aesthetic and minimalist design | Only display information that's actually relevant: every superfluous element dilutes the others | A form that only asks for strictly necessary fields | Ties back to [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle): too many elements cancels out the intended hierarchy |
| 9 | Help users recognize, diagnose, and recover from errors | A plain-language error message that states the problem and suggests a solution | "Password must be at least 8 characters" rather than a plain error code | The user knows there's a problem, but not which one or how to fix it |
| 10 | Help and documentation | Help that's easy to find, focused on the user's actual tasks, if the interface isn't self-sufficient | A contextual FAQ accessible from the relevant screen, not just a generic manual | A stuck user has to look for help elsewhere (search engine, forum) rather than on the spot |

> **Current trend (2026):** these ten rules are thirty years old, but they're becoming relevant again in the face of fatigue with purely experimental design: the same return-to-clarity movement already observed for [visual hierarchy](/?c=ui-ux&p=hierarchie-visuelle) and [spacing](/?c=ui-ux&p=espacement-et-grille). An interface that respects these ten points stays readable and usable even without following the visual trend of the moment.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Nielsen's 10 heuristics evaluate an interface's usability: status visibility, familiar language, freedom of control, consistency, error prevention, recognition over recall, flexibility, minimalism, clear error diagnosis, accessible help. |
| **Tools you can use** | No specific tool: these heuristics are used as a manual review checklist for an interface already designed or in progress. |
| **Pitfalls to avoid** | Ignoring one of these rules thinking it only applies to a special case: each comes from repeated observations on real interfaces, not a theoretical preference. |
| **Best practices** | Review a mockup or existing interface against the 10 heuristics before shipping, explicitly noting where each is respected or not. |
