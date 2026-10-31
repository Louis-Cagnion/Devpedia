---
order: 14
---

# Inversion of control and extension points: hooks, events, optional dependency

In a small program, your code decides everything: it starts, calls functions, then stops. In an application built on a **framework** (a large, already-written code base that provides the skeleton of the application: receiving requests, displaying pages, saving data), it is the other way around. You only write pieces, and the framework decides when to run them. This reversal is called **inversion of control**. This chapter explains it with small programs you can copy, then shows how to create your own hook points and how to depend on another module without breaking the application when that module is missing.

## The idea: stop calling, get called

A **library** is a set of functions that you call when you need them. A framework, on the other hand, calls your code. This is often summed up by the phrase "don't call us, we'll call you".

| | Library | Framework |
|---|---|---|
| Who starts the program | Your code | The framework |
| Who decides the order of calls | You | The framework |
| What you write | Function calls | Pieces that the framework calls back |
| Analogy | You cook with utensils | You hand a recipe to a restaurant, and the kitchen carries it out when an order comes in |

```text
Without inversion of control         With inversion of control

  your code ──calls──> tool            framework ──calls──> your code
  (you decide when)                    (it decides when, you declare what)
```

The gain: the framework can add, replace or remove pieces without changing the others. The cost: for the framework to know your code, you must **declare** it to the framework.

## What you declare: route, hook, service, plugin

A **declaration** is information given to the framework (in a configuration file or through a naming convention) that says "when this situation happens, call this".

| What you declare | Situation that triggers the call | Generic example |
|---|---|---|
| A **route** | An address is requested by a visitor | `/hello` calls the function `showHello` |
| A **hook** | The framework reaches a precise moment in its work | "before displaying a page", "every night" |
| An **event subscriber** | An event is announced by another piece of code | "an order has just been created" |
| A **service** | A piece of code needs a shared feature | An e-mail sending service |
| A **plugin** | The framework looks for a brick of a precise type | A new type of display block |

Services (and the container that builds them) and plugin architectures each have their own chapter: here, we only cover routes, hooks, events and the dependency between modules. The mechanism of [dependency injection](/?c=langages&s=php&p=poo) (receiving an object from outside instead of creating it yourself) is the same idea applied to objects.

## First example: a declared route

This small kernel stores routes (a **route** associates an address with the function that answers it) and calls the right function. The PHP syntax elements used are described just after.

```php
<?php
final class Kernel
{
    private array $routes = [];  // registry: address => function to call

    public function route(string $address, callable $action): void
    {
        $this->routes[$address] = $action;  // the project declares, the kernel stores
    }

    public function handle(string $address): string
    {
        $action = $this->routes[$address] ?? fn() => 'Error 404';  // fallback if unknown
        return $action();  // it is the kernel that calls the project's code
    }
}

$kernel = new Kernel();
$kernel->route('/hello', fn() => 'Hello world');  // declaration on the project side
echo $kernel->handle('/hello'), "\n";  // the kernel finds and calls the function
echo $kernel->handle('/missing'), "\n";  // no declaration: 404 fallback
```

Output obtained when running it:

```text
Hello world
Error 404
```

| PHP syntax | Meaning |
|---|---|
| `final class` | Class that no other class can extend (see [OOP in PHP](/?c=langages&s=php&p=poo)) |
| `private array $routes = []` | Property hidden from outside, of array type, empty at the start |
| `callable` | Type of a value that can be called like a function |
| `fn() => 'text'` | Short anonymous function: it has no name and returns the value after the arrow |
| `$a ?? $b` | Equals `$a` if it exists, otherwise `$b` |
| `$action()` | Calls the function stored in the variable `$action` |

The project contains no `handle()`: it only calls `route()`. The call of its function is entirely decided by the kernel.

## The hook: a naming convention

A **hook** is a precise point in the framework's work where each module can plug in. In the simplest style, the framework looks for functions whose name follows a rule: `<module name>_<hook name>`. A **module** is here a package of code that you enable or disable.

```php
<?php
function blog_cron(): string { return 'blog: purge drafts'; }
function stats_cron(): string { return 'stats: compute the report'; }

$modules = ['blog', 'stats', 'galerie'];  // enabled modules (galerie has no cron)
foreach ($modules as $module) {
    $hook = $module . '_cron';  // built name: module + '_' + hook name
    if (function_exists($hook)) {  // did the module write this function?
        echo $hook(), "\n";  // calls the function whose name is in $hook
    }
}
```

Output:

```text
blog: purge drafts
stats: compute the report
```

The `cron` hook (a task run at regular intervals, see [automation](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow)) is called for `blog` and `stats`. The `galerie` module wrote nothing: `function_exists` (which answers `true` if a function with that name exists) avoids the error and the module is ignored. No declaration was needed: the function name is enough.

The same principle, applied to artificial intelligence assistants, is described in [the hooks of an LLM agent](/?c=ia&s=configuration-de-llms&p=hooks).

## The event subscriber and its priority

An **event** is the announcement "something has just happened" (an order is created). Pieces of code that are interested **subscribe**: they provide a function, called at each announcement. In a web page, `addEventListener` plays this role (see [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements)). When several subscribers listen to the same event, the order matters: it is set with a **priority**, an integer. The largest runs first.

```js
class Dispatcher {
  constructor() {
    this.listeners = new Map();  // event name => list of subscribers
  }

  subscribe(event, listener, priority = 0) {
    const list = this.listeners.get(event) ?? [];  // existing list or empty
    list.push({ listener, priority });  // we add the subscriber with its priority
    list.sort((a, b) => b.priority - a.priority);  // highest priority first
    this.listeners.set(event, list);  // we store the sorted list
  }

  dispatch(event, payload) {
    for (const { listener } of this.listeners.get(event) ?? []) {
      if (listener(payload) === false) {  // a subscriber returns false: we stop
        return false;
      }
    }
    return true;  // all subscribers have run
  }
}

const dispatcher = new Dispatcher();
dispatcher.subscribe('order.created', (c) => console.log('log:', c.id), -10);
dispatcher.subscribe('order.created', (c) => console.log('email to', c.client));
dispatcher.subscribe('order.created', (c) => c.client !== 'banned', 100);

console.log(dispatcher.dispatch('order.created', { id: 1, client: 'Alice' }));
console.log(dispatcher.dispatch('order.created', { id: 2, client: 'banned' }));
```

Output:

```text
email to Alice
log: 1
true
false
```

| JavaScript term | Meaning |
|---|---|
| `Map` | Dictionary: associates a key (here the event name) with a value |
| `payload` | Payload: the data attached to the announcement (here the order) |
| `list.sort((a, b) => ...)` | Sorts the list; the function compares two elements, `b - a` gives descending order |
| `for (const { listener } of ...)` | Goes through the list, extracting the `listener` field of each element |

For Alice, the subscriber with priority 100 (the check) returns `true`, then the one with priority 0 sends the e-mail, then the one with priority -10 writes the log. For the banned client, the check returns `false`: the two others are never called. Two subscribers with the same priority run in subscription order, because JavaScript's sort is stable (it does not reorder equal elements).

## Hook or event: which to choose

| | Hook (naming convention) | Event subscriber |
|---|---|---|
| How the code is found | The framework looks for the name `module_hook` | The code subscribes explicitly |
| Order of execution | Order of the modules (often a configurable weight) | Priority set at subscription |
| Stopping the rest | Rarely possible | Possible (the propagation stops) |
| What is passed | The function's arguments | An event object, which can be modified |
| Typical form | Procedural functions | Classes or anonymous functions |

Both serve the same idea. An older framework often uses hooks, a recent one favors events, and many offer both.

## Creating your own extension point: `invokeAll` and `alter`

A framework does not have a monopoly on hook points: your own module can declare some, so that other modules can plug into them without modifying it. Two very common forms:

| Form | Role | Returned value |
|---|---|---|
| `invokeAll(hook, args)` | Calls **all** the implementations of the hook and gathers their answers | An array: one answer per module |
| `alter(hook, data)` | Gives the **already built** data to each module, which may change it | Nothing: the data is changed in place |

`invokeAll` is used to **collect** (each module contributes menu links). `alter` is used to **adjust** the final result (one module removes one).

```php
<?php
function blog_menu_links(): array { return ['home' => '/', 'blog' => '/blog']; }
function stats_menu_links(): array { return ['stats' => '/stats']; }
function prive_menu_links_alter(array &$links): void { unset($links['stats']); }

final class ModuleManager
{
    public function __construct(private array $modules) {}  // enabled modules

    public function invokeAll(string $hook, array $args = []): array
    {
        $results = [];
        foreach ($this->modules as $module) {
            $func = $module . '_' . $hook;  // e.g. blog_menu_links
            if (function_exists($func)) {
                $results[$module] = $func(...$args);  // ...: unpacks $args
            }
        }
        return $results;
    }

    public function alter(string $hook, array &$data): void
    {
        foreach ($this->modules as $module) {
            $func = $module . '_' . $hook . '_alter';  // e.g. prive_menu_links_alter
            if (function_exists($func)) {
                $func($data);  // the function changes $data in place
            }
        }
    }
}

$manager = new ModuleManager(['blog', 'stats', 'prive']);
$links = array_merge(...array_values($manager->invokeAll('menu_links')));
$manager->alter('menu_links', $links);  // the modules adjust the result
echo json_encode($links), "\n";
```

Output (the `\/` is simply the way `json_encode` writes `/`):

```text
{"home":"\/","blog":"\/blog"}
```

| PHP syntax | Meaning |
|---|---|
| `array &$links` | The `&` passes a **reference**: the function receives the variable itself, not a copy, so its changes are visible outside |
| `unset($links['stats'])` | Removes the key `stats` from the array |
| `private array $modules` in the constructor | Shortcut: declares the property and fills it when the object is created |
| `$func(...$args)` | The three dots unpack the array `$args` into separate arguments |
| `array_values`, `array_merge` | The first ignores the keys (here the module names), the second merges arrays |
| `json_encode` | Turns an array into JSON text, convenient for display |

The sequence: `invokeAll` collected the links of `blog` and `stats`, then `alter` let the module `prive` remove the `stats` link. The modules `blog`, `stats` and `prive` do not know each other: only the extension point `menu_links` links them.

```text
  ModuleManager::invokeAll('menu_links')
        │
        ├──> blog_menu_links()   ──> home, blog
        └──> stats_menu_links()  ──> stats
                    │
                    ▼  merged array
  ModuleManager::alter('menu_links', $links)
        └──> prive_menu_links_alter()  ──> removes "stats"
```

## Dependency between modules: declared, optional or hidden

When the module `export` uses a function of the module `stats`, it **depends** on it. Three situations exist.

| Type | Situation | What the framework does |
|---|---|---|
| **Declared required** dependency | `export` does not work without `stats` | Refuses to enable `export` if `stats` is absent |
| **Optional** dependency | `export` works without `stats`, but adds information if it is there | Nothing: `export` checks for the presence itself |
| **Undeclared** dependency | `export` calls `stats` without saying so or checking | Nothing, until the fatal error in production |

A required declaration is usually written in the module's description file. Fictional example:

```yaml
name: Export
requires:
  - core      # without the kernel, nothing works
optional:
  - stats     # use if present (checked in the code)
```

For the optional one, we ask the manager whether the module is enabled. In many frameworks, this method is called `moduleExists`.

```php
<?php
$active = ($argv[1] ?? 'without') === 'with';  // simulates the stats module enabled or not
if ($active) {
    function stats_total(): int { return 340; }  // defined only if stats is enabled
}

final class Modules
{
    public function __construct(private array $actives) {}

    public function moduleExists(string $name): bool
    {
        return in_array($name, $this->actives, true);  // is the module enabled?
    }
}

function cautious_report(Modules $modules): string
{
    $text = '12 articles';
    if ($modules->moduleExists('stats')) {  // optional dependency: we check
        $text .= ', ' . stats_total() . ' visits';
    }
    return $text;
}

function reckless_report(): string
{
    return '12 articles, ' . stats_total() . ' visits';  // undeclared dependency
}

$modules = new Modules($active ? ['export', 'stats'] : ['export']);
echo cautious_report($modules), "\n";
try {
    echo reckless_report(), "\n";
} catch (Error $error) {
    echo 'Error: ', $error->getMessage(), "\n";
}
```

This script runs with `php file.php without` (the `stats` module is disabled) or `php file.php with`. Observed results:

| Run | `cautious_report` | `reckless_report` |
|---|---|---|
| `without` | `12 articles` | `Error: Call to undefined function stats_total()` |
| `with` | `12 articles, 340 visits` | `12 articles, 340 visits` |

The reckless function works as long as `stats` is enabled, which hides the defect: the application breaks on the day someone disables `stats`, often far from the place where the error is. The cautious function adapts to both cases. The new syntax elements: `$argv` contains the words typed after the script name, `in_array(..., true)` looks for a value in an array while also comparing its type, `try` / `catch (Error ...)` catches an error instead of stopping the program (see [exceptions in PHP](/?c=langages&s=php&p=exceptions)), and `.=` appends text to the end of a string.

The direction of the dependency matters too: a base module must never depend on an optional module, otherwise a cycle is created (see [checking the direction of dependencies](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser)).

## What inversion of control changes for your code

| Advantage | Cost |
|---|---|
| Adding a behavior without modifying the existing code | The execution path is harder to follow: we cannot see who calls whom |
| Each module stays small and independent (see [single responsibility](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)) | A forgotten declaration shows up as silence: nothing is called and no error appears |
| The framework can change the order or the timing of calls | The execution order depends on priorities or weights that must be watched |

## Pitfalls

| Pitfall | Why it is a problem | Recommended reaction |
|---|---|---|
| A typo in a hook name (`blog_cron` written `blog_cro`) | The function is never called and no error is reported | Test that the expected effect happens; check the name in the hook's documentation |
| Two subscribers with the same priority whose order matters | The order then depends on the subscription order, which is fragile | Give distinct priorities when the order is important |
| A subscriber that stops the propagation without saying so | The other subscribers no longer run, with no trace | Document every stop and log it |
| An `alter` that changes the shape of the data | The following modules receive an unexpected structure | Keep the same structure, change only the values |
| A hook that does heavy work (network request, loop over the whole database) | It is called at every pass and slows everything down | Hand the heavy work over to a deferred task |
| Calling another module without declaring or checking it | Fatal error on the day that module is disabled | Declare the dependency, or test it with `moduleExists` |
| Modifying the framework's kernel to "add a function" | The change is lost at the next update | Go through a hook, an event or a project service |

## Best practices

| Best practice | Reason |
|---|---|
| Choose a clear hook name and document it next to its declaration | The other modules know what to implement |
| Prefer `invokeAll` to collect and `alter` to adjust | Each form has a precise role, so the behavior stays predictable |
| Declare every required dependency in the module's file | The framework refuses an inconsistent activation instead of breaking later |
| Protect every optional dependency with a check (`moduleExists`) | The application survives the absence of the module |
| Write one test per hook implementation, with and without the optional modules | A hook that is not called produces no error: only a test reveals it |
| Keep subscribers short and free of hidden side effects | Makes debugging an already indirect path easier |

## Key Takeaways

- **Inversion of control** means declaring code (route, hook, subscriber, service, plugin) so that the framework calls it at the right moment, instead of calling it yourself.
- A **hook** is recognized by a naming convention; an **event subscriber** registers explicitly and receives a **priority** that sets the execution order.
- You can create your own extension points: `invokeAll` collects the answers of all the modules, `alter` lets them change data that is already built.
- A **required dependency** is declared, an **optional dependency** is checked in the code (`moduleExists`), and an **undeclared dependency** is a defect that only breaks on the day the module disappears.
- The price of inversion is a less visible execution path: name, document and test every extension point.
