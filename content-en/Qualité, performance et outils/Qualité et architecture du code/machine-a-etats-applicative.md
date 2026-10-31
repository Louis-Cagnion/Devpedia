---
order: 17
---

# The application state machine

An article goes through several steps: someone writes it, someone else reviews it, it is published, and one day it is archived. This step is recorded in a field, often called **status**. If any piece of code can write any value into it, the application ends up with "published" articles that nobody reviewed, or "archived" ones that were never online. An **application state machine** solves this problem: you declare once, in a table, which statuses exist and which moves from one to another are allowed, and a single place in the code applies that table.

This chapter builds on [exceptions in PHP](/?c=langages&s=php&p=exceptions) and on [classes and methods](/?c=langages&s=php&p=poo). The same principle is used to analyze a text step by step, as shown in [incremental parsing with a state machine](/?c=langages&s=domain-specific-languages-dsl&p=parsing-incremental-machine-a-etats); here, the machine does not read a text but protects the life of a record. Content management systems such as Drupal (PHP software that lets you build and run a website) work this way for their publication status. The examples below stay generic and use no code from that software.

## Words to know

| Word | Meaning | Example |
|---|---|---|
| State (or status) | The situation of an object at a given moment, only one at a time | `draft` |
| Transition | The move from one state to another | from `draft` to `in_review` |
| Allowed transition | A move that the business rule permits | `in_review` to `published` |
| Forbidden transition | A move that the rule refuses | `draft` to `published` |
| Final state | A state you never leave | `archived` |
| Effect | An action triggered by one precise transition | record the publication date |

## The status diagram

Each arrow is an allowed transition. Anything not drawn is forbidden.

```text
              +--------------+
              |    draft     |<-----------+
              +------+-------+            |
                     |                    |
                     v                    |
              +--------------+            |
              |  in_review   |------------+
              +------+-------+   (sent back for correction)
                     |
                     v
              +--------------+
              |  published   |
              +------+-------+
                     |
                     v
              +--------------+
              |   archived   |   (final state)
              +--------------+
```

## The problem: a free status, without a guard

Without a state machine, the status is a plain string that every part of the code changes as it likes.

```php
<?php
$article = ['title' => 'The statuses', 'status' => 'draft']; // a brand new article
$article['status'] = 'published';          // skips the review: nobody stops it
$article['status'] = 'publised ';          // a spelling mistake is accepted too
$article['status'] = 'archived';           // and we can archive what never existed
```

Each line is accepted without any check. The **guard** (the check placed before the change, which refuses or allows it) is missing.

## Impossible states

Another common mistake replaces a single status with several checkboxes (booleans, values true or false). Two checkboxes give four combinations, some of which make no sense.

| `is_published` | `is_archived` | Meaning |
|---|---|---|
| false | false | Draft or in review, we don't know which |
| true | false | Published |
| false | true | Archived, but never published? Ambiguous case |
| true | true | Published and archived at the same time: impossible state |

A single field that can only take the values of the table makes these combinations **impossible to represent**: you cannot write what does not exist. It is the same principle as [one mechanism per piece of information](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-seul-mecanisme-par-information).

## Scattered `if`s

Another slippery slope: checking the rule by hand, in every place that changes the status.

```php
<?php
function publishButton(array $article): void       // called by the edit page
{
    if ($article['status'] === 'in_review') {     // rule written a first time
        echo "Publish";                           // displays the button
    }
}

function importArticle(array $row): array          // called by a file import
{
    if ($row['status'] === 'published') {         // rule rewritten, already different
        $row['date'] = date('Y-m-d');             // forgets the review check
    }
    return $row;                                  // returns the row, never refused
}
```

Each of these two functions applies its own version of the rule. The day you add a status, you have to find every `if`, and one is always forgotten. The solution is the one described by [avoiding repetition with indexed structures](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees): a data table, walked by a single piece of code.

## The transition table

An **associative array** (a list where each value is found by a name, its key) gives, for each status, the list of allowed next statuses. A **constant** (`const`) is a named value that can no longer be changed after its declaration.

| Current status | Allowed transitions |
|---|---|
| `draft` | `in_review` |
| `in_review` | `draft`, `published` |
| `published` | `archived` |
| `archived` | none |

```php
<?php
const TRANSITIONS = [                          // the table: a single source of truth
    'draft'     => ['in_review'],              // a draft goes to review
    'in_review' => ['draft', 'published'],     // review either corrects or publishes
    'published' => ['archived'],               // a published article ends up archived
    'archived'  => [],                         // final state: no way out
];
```

Adding a status means adding a line to this table, and nowhere else. This is the [single source of truth](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite).

## Refusing an illegal transition, with a clear message

A single function, `changerStatut`, is the only entrance. It checks the table and throws an **exception** (an error signal that the calling code can catch, see the chapter on [exceptions](/?c=langages&s=php&p=exceptions)) whose message names the cause. The principle is that of [one error message for each cause](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=un-message-d-erreur-par-cause): the message says which status, which target, and what was allowed.

```php
<?php
class TransitionInterdite extends DomainException {}   // an error type dedicated to this case

function changerStatut(array $article, string $target): array
{
    $current = $article['status'] ?? '';                // reads the status, empty if missing
    if (!array_key_exists($current, TRANSITIONS)) {     // is the current status known?
        throw new TransitionInterdite(                  // otherwise, refuses with the cause
            "Unknown current status: '$current'."
        );
    }
    if (!array_key_exists($target, TRANSITIONS)) {      // does the target exist?
        throw new TransitionInterdite(                  // otherwise, refuses with the cause
            "Unknown target status: '$target'."
        );
    }
    $allowed = TRANSITIONS[$current];                   // the targets allowed from here
    if (!in_array($target, $allowed, true)) {           // is the target in the list?
        $list = $allowed ? implode(', ', $allowed) : 'none';   // text of the list
        throw new TransitionInterdite(                  // refuses, naming the choices
            "Moving from '$current' to '$target' is not allowed. Allowed: $list."
        );
    }
    $article['status'] = $target;                       // only line that writes the status
    return $article;                                    // returns the modified article
}
```

| Tested case | Result |
|---|---|
| `draft` to `in_review` | accepted |
| `draft` to `published` | refused, message: allowed `in_review` |
| `archived` to `draft` | refused, message: allowed `none` |
| `published` to `Published` (capitalization mistake) | refused, unknown target status |

The third argument `true` of `in_array` requires a strict comparison: without it, PHP may consider values of different types equal.

## Effects tied to a transition

Some actions only make sense for one precise move: recording the date at the time of publication, notifying the author when the article goes back to draft, removing the article from the site when it is archived. They are stored in a second table, indexed by the pair `from>to`. Each effect is an **anonymous function** (a function without a name, written directly where it is stored, here with the short form `fn`).

| Transition | Effect |
|---|---|
| `draft>in_review` | record the date of the review request |
| `in_review>published` | record the publication date |
| `published>archived` | record the archiving date |

```php
<?php
const FORMAT_DATE = 'Y-m-d';                              // format of the stored dates

function effets(): array                                  // the table of effects
{
    return [
        'draft>in_review' => fn(array $a): array          // when review is requested
            => $a + ['review_on' => date(FORMAT_DATE)],
        'in_review>published' => fn(array $a): array      // when published
            => $a + ['published_on' => date(FORMAT_DATE)],
        'published>archived' => fn(array $a): array       // when archived
            => $a + ['archived_on' => date(FORMAT_DATE)],
    ];
}

function transiter(array $article, string $target): array
{
    $from = $article['status'] ?? '';                     // remembers the starting status
    $article = changerStatut($article, $target);          // validates, throws if forbidden
    $key = "$from>$target";                               // key of the effects table
    $effect = effets()[$key] ?? null;                     // looks for an effect for this move
    return $effect ? $effect($article) : $article;        // runs it if it exists
}
```

The order matters: validation comes **before** the effects. A refused transition throws the exception at the `changerStatut` line, and the line that runs the effect is never reached. The `+` operator between two arrays adds the missing keys without changing the existing ones.

Effects that extend a transition (sending an email, clearing a cache) can also go through extension points that other modules plug in, as in a neighboring chapter on hooks and events; this chapter keeps the table, which is simpler as long as there are few effects.

## Seeing the machine run

```php
<?php
$article = ['title' => 'The statuses', 'status' => 'draft'];      // starting point
$article = transiter($article, 'in_review');                      // allowed transition
$article = transiter($article, 'published');                      // allowed transition
echo $article['status'], ' on ', $article['published_on'], "\n";  // shows the final state
try {
    transiter($article, 'draft');                                 // published to draft
} catch (TransitionInterdite $e) {                                // catches the refusal
    echo $e->getMessage(), "\n";                                  // shows the cause
}
```

The output of the last block looks like:

```text
published on 2026-10-31
Moving from 'published' to 'draft' is not allowed. Allowed: archived.
```

## Testing the table itself

A table can contain a typo: a target that does not exist, or a state you can no longer leave by mistake. A [unit test](/?c=tests&p=tests-unitaires) checks it in a few lines.

```php
<?php
function verifierTable(array $table): array               // returns the list of anomalies
{
    $anomalies = [];                                      // empty list at the start
    foreach ($table as $from => $targets) {               // walks through each status
        foreach ($targets as $target) {                   // walks through its targets
            if (!array_key_exists($target, $table)) {     // does the target have an entry?
                $anomalies[] = "$from leads to $target, unknown";   // notes the anomaly
            }
        }
    }
    return $anomalies;                                    // empty if the table is sound
}
```

The function above performs the first check of the following table; the other two are written the same way, by walking through the table.

| Check | What it detects |
|---|---|
| Every target is also a key | Typo in a target |
| At least one final state | Possible endless machine |
| Every state is reachable from the first one | Status added but connected to nothing |

## Free status, scattered `if`s or table

| Criterion | Free status | Scattered `if`s | Transition table |
|---|---|---|---|
| Invalid value accepted | yes | sometimes | no |
| Rule written in one place only | no | no | yes |
| Adding a status | nothing guides you | find all the `if`s | one line in the table |
| Clear error message | none | different everywhere | a single one, names the cause |
| Rule readable at a glance | no | no | yes |

## Pitfalls

| Pitfall | Why it is a problem | Reflex |
|---|---|---|
| Free status without a guard | Any value is accepted, including a typo | A single function writes the status and validates first |
| Several checkboxes instead of one status | Impossible states become representable | A single field whose values are listed |
| Rule copied into several `if`s | The copies diverge, and one gets forgotten | A table read by a single piece of code |
| Writing the status directly in the database, outside the function | Bypasses the guard, for example in an import | Make every path, import included, go through `transiter` |
| Effect run before validation | A refused transition already had consequences | Validate first, apply afterwards |
| Two users change the status at the same time | Each validates against an already outdated status | Write with a condition on the old status, see [databases](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) |
| Vague message ("status error") | The user does not know what to do | Name the starting point, the target and the allowed choices |
| Statuses renamed later on | Old stored values become unknown | Plan a data migration before renaming |

## Best practices

| Practice | Reason |
|---|---|
| Declare states and transitions in a data table | A single source of truth, readable at a glance |
| A single function allowed to write the status | No path bypasses the guard |
| Validate before applying the effects | A refusal leaves no trace |
| An error message that names the state, the target and the choices | Debugging takes one reading |
| A stable state identifier, in lowercase, without spaces | Already stored data stays valid |
| A test that checks the table itself | Detects an unknown target before going live |
| Keep effects in a table while there are few of them | Simpler than an extension point system |

Official reference documentation: [PHP arrays](https://www.php.net/manual/en/language.types.array.php) and [PHP exceptions](https://www.php.net/manual/en/language.exceptions.php).

## Key Takeaways

| Notion | What to remember |
|---|---|
| State machine | A field with listed values and a table of allowed moves |
| Transition | A move from one state to another, allowed or forbidden by the table |
| Guard | The check placed before the change, which refuses with a clear exception |
| Effect | An action tied to one precise transition, run after validation |
| Single entry point | A single function writes the status, import and interface included |
| Impossible state | Avoided by replacing several booleans with a single status |
| Main pitfall | A free status, or a rule scattered across `if`s that diverge |
