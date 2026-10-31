---
order: 16
---

# Plugin architecture

An application grows: new kinds of display blocks, validation rules and API addresses keep being added to it. If each addition forces you to open the same central file to add one line, that file becomes a point of friction. The **plugin architecture** (a *plugin* is an extension module) solves this problem: the program defines once an **extension point**, then each new feature arrives as an independent class, which the program finds on its own, without its central code being modified.

This chapter builds on the classes, interfaces and namespaces of [object-oriented programming in PHP](/?c=langages&s=php&p=poo), and on the [single responsibility principle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage). Content management systems such as Drupal (PHP software that lets you build and administer a website) are largely organized this way: their display blocks, their validation constraints and their API resources are all plugins. The examples below remain generic and use no code from that software.

## The problem: the `switch` that keeps growing

Without plugins, creating an object from a name is often written as a long series of cases. Each new block forces you to modify this function, which must know **all** the existing classes.

```php
<?php
function createBlock(string $type): object    // receives the name of the requested block
{
    switch ($type) {                          // compares the name with each known case
        case 'welcome':                       // first known block
            return new WelcomeBlock();        // creates an object of this class
        case 'clock':                         // second known block
            return new ClockBlock();          // creates an object of this class
        default:                              // any other name
            throw new InvalidArgumentException("Unknown block: $type");
    }
}
```

| Defect of the central `switch` | Consequence |
|---|---|
| It lists all the classes | Adding a block forces you to modify a file that has nothing to do with that block |
| It is shared by the whole team | Frequent merge conflicts, risk of forgetting a line |
| It cannot be extended from outside | An extension shipped separately cannot add itself to it |

## The idea: declare, discover, instantiate

The plugin reverses responsibility: it is no longer the central code that knows the classes, but each class that **declares itself** to it. Three steps follow one another.

```
   Project classes                   Plugin manager
  +-----------------+     1. discover      +---------------------------+
  | #[Plugin(...)]  |  ------------------> |  catalog (id => class)    |
  | WelcomeBlock    |     read the label   |  welcome => WelcomeBlock
  +-----------------+                      |  clock   => ClockBlock    |
  | #[Plugin(...)]  |                      +---------------------------+
  | ClockBlock      |                                  |
  +-----------------+          2. choose by identifier ('clock')
  | (no label)      |                                  |
  | ignored         |                      3. instantiate (new ClockBlock)
  +-----------------+                                  v
                                            ready-to-use object
```

| Step | Role | Question it answers |
|---|---|---|
| Declaration | A label attached to the class gives its identifier and its information | "Who am I?" |
| Discovery | The manager goes through the candidate classes and reads their labels | "Which plugins exist?" |
| Instantiation | The manager creates the object on demand from its identifier | "Give me the `clock` plugin" |

The three ingredients to provide are therefore: a **contract** (an interface), a **label** (the declaration) and a **manager** (the conductor).

| Ingredient | Definition | Example in this chapter |
|---|---|---|
| Contract | An [interface](https://www.php.net/manual/fr/language.oop5.interfaces.php): the list of methods that any class signing it must offer | `BlockPlugin` with the method `render()` |
| Label | A piece of information attached to the class itself, readable by another program | `#[Plugin(id: 'clock', ...)]` |
| Manager | An object that holds the catalog of plugins and creates them | `PluginManager` |

## The contract and the label in PHP

An **attribute** is, since PHP 8, a label written between `#[` and `]` just before a class, a method or a property. It does nothing by itself: it carries information that another piece of code will read later, thanks to **reflection** ([Reflection](https://www.php.net/manual/fr/book.reflection.php)), that is, a program's ability to examine its own classes while it runs.

```php
<?php
// Contract: every block plugin knows how to produce its text
interface BlockPlugin                         // declares the interface (the contract)
{
    public function render(): string;         // required method, returns a text
}

#[Attribute(Attribute::TARGET_CLASS)]         // this attribute can only be placed on a class
final class Plugin                            // the class that represents the label
{
    public function __construct(              // the values given in parentheses
        public readonly string $id,           // unique identifier of the plugin, read-only
        public readonly string $label,        // readable name for an admin screen
    ) {
    }
}

#[Plugin(id: 'welcome', label: 'Welcome message')]  // the label of the plugin
final class WelcomeBlock implements BlockPlugin     // signs the contract
{
    public function render(): string          // implements the required method
    {
        return 'Hello and welcome!';          // the text produced by this block
    }
}

#[Plugin(id: 'clock', label: 'Server time')]        // the label of the second plugin
final class ClockBlock implements BlockPlugin       // signs the same contract
{
    public function render(): string          // implements the required method
    {
        return 'It is ' . date('H:i');        // the current time, in hours:minutes format
    }
}

// This class has no label: the manager will ignore it
final class ClassWithoutLabel implements BlockPlugin
{
    public function render(): string          // the contract is respected
    {
        return 'invisible';                   // but nobody will discover it
    }
}
```

`final` forbids inheriting from a class, `readonly` forbids modifying a property after its creation: these two keywords make plugins more predictable. The name `Plugin` of the attribute is an example choice, nothing requires this word.

## The plugin manager

The manager does two things: it **discovers** (it reads the labels to fill a catalog, a table that associates each identifier with its class) then it **instantiates** (it creates an object from a class). It also checks that each labeled class respects the expected contract.

```php
<?php
final class PluginManager
{
    /** @var array<string, array{class: class-string, label: string}> */
    private array $catalog = [];              // the catalog: identifier => information

    /** @param class-string $contract interface that each plugin must respect */
    public function __construct(private readonly string $contract)  // keeps the contract
    {
    }

    /** @param list<class-string> $classes candidate classes to examine */
    public function discover(array $classes): void
    {
        foreach ($classes as $class) {            // examines each candidate class
            $labels = (new ReflectionClass($class))   // opens the class in reflection
                ->getAttributes(Plugin::class);       // retrieves its Plugin attributes
            if ($labels === [] || !is_subclass_of($class, $this->contract)) {
                continue;                     // no label or wrong contract: skip it
            }
            $definition = $labels[0]->newInstance();       // creates the Plugin object read
            $this->catalog[$definition->id] = [            // records it in the catalog
                'class' => $class,            // the class to instantiate later
                'label' => $definition->label,             // the readable name
            ];
        }
    }

    /** @return array<string, string> identifier => label */
    public function definitions(): array
    {
        return array_map(                     // transforms each entry of the catalog
            static fn (array $entry): string => $entry['label'],  // keeps the label
            $this->catalog,                   // the array to transform
        );
    }

    public function create(string $id): object
    {
        if (!isset($this->catalog[$id])) {    // the identifier is not in the catalog
            throw new InvalidArgumentException("Unknown plugin: $id");  // clear error
        }
        return new $this->catalog[$id]['class']();   // creates the object of the class found
    }
}
```

An [exception](/?c=langages&s=php&p=exceptions) is thrown for an unknown identifier: without it, the program would crash later with an obscure message. Using the manager takes a few lines:

```php
<?php
$manager = new PluginManager(BlockPlugin::class);  // a manager for blocks
$manager->discover([                          // gives the list of classes to examine
    WelcomeBlock::class,                      // labeled plugin
    ClockBlock::class,                        // labeled plugin
    ClassWithoutLabel::class,                 // ignored for lack of a label
]);

print_r($manager->definitions());             // displays the catalog: 2 entries
echo $manager->create('welcome')->render(), "\n";   // creates the block, then displays it
try {                                         // tries to create a nonexistent plugin
    $manager->create('missing');              // the identifier does not exist
} catch (InvalidArgumentException $error) {   // catches the announced error
    echo $error->getMessage(), "\n";          // displays "Unknown plugin: missing"
}
```

Result obtained at runtime: the catalog contains `welcome` and `clock` (the class without a label is absent), then `Hello and welcome!`, then `Unknown plugin: missing`.

## Where to look for plugins: discovery strategies

The manager here receives a list of classes written by hand, which reproduces the defect of the `switch`. In practice, the search is automated.

| Strategy | Principle | Advantage | Limit |
|---|---|---|---|
| Explicit list | The code provides the class names | Simple, fast | You have to remember to update it |
| Folder scan | The manager loads all the files of an agreed folder | Dropping a file is enough | Loading every file takes time |
| Matching with [autoloading](/?c=langages&s=php&p=autoloading) | A namespace is associated with a folder, and classes load on demand | No `require` to write | Depends on naming conventions |
| Configuration file | A file (YAML, JSON) lists the plugins | Readable without reading the code | Two places to keep in sync |

Here is the folder scan, tested with a file dropped into a `plugs/` folder:

```php
<?php
function classesInFolder(string $folder): array     // returns the classes of a folder
{
    $before = get_declared_classes();         // snapshot of the classes already known
    foreach (glob($folder . '/*.php') as $file) {   // each .php file of the folder
        require_once $file;                   // loads it only once
    }
    return array_values(array_diff(get_declared_classes(), $before));  // new classes
}
```

Calling `$manager->discover(classesInFolder(__DIR__ . '/plugs'))` is then enough: adding a plugin amounts to dropping a file into the folder, without changing a single line of the central code.

## Annotation or attribute

Before PHP 8, there was no native label: libraries read special comments (**annotations**), for example `@Block(id="clock")` in a documentation comment. An attribute is the native version of this idea.

| Criterion | Annotation (comment) | Attribute (`#[...]`) |
|---|---|---|
| Nature | Text inside a comment | Code recognized by the language |
| Reading | A library must parse the text | PHP's reflection provides it directly |
| Typo | Silent: the comment is ignored | Detected at runtime (attribute class not found) |
| Tools | Limited completion | Full completion and static analysis |
| Versions concerned | Old codebases | Recent code |

Attributes are read at runtime: to avoid reading them again on every request, a serious manager keeps its catalog in a **cache** (a copy kept so as not to recalculate it), otherwise reading hundreds of classes by reflection slows down every page.

## The same mechanism in JavaScript

JavaScript classes have no native attributes of this kind. A static property (a value attached to the class itself, not to its objects) then plays the role of the label. See [JavaScript classes](/?c=langages&s=javascript&p=poo).

```javascript
// Each class carries its declaration in a static property
class UsersResource {
  static definition = { id: 'users', path: '/api/users' }; // the label

  list() {                                    // method expected of every resource
    return ['Alice', 'Bruno'];                // the data returned
  }
}

class ArticlesResource {
  static definition = { id: 'articles', path: '/api/articles' };         // the label

  list() {                                    // same method, other data
    return ['First article'];                 // the data returned
  }
}

class PluginManager {
  #catalog = new Map();                       // private dictionary: identifier => class

  discover(classes) {
    for (const cls of classes) {              // examines each candidate class
      const definition = cls.definition;      // reads the label, absent if not declared
      if (definition === undefined) continue; // without a label: the class is ignored
      this.#catalog.set(definition.id, cls);  // records it in the catalog
    }
  }

  create(id) {
    const cls = this.#catalog.get(id);        // looks up the class by identifier
    if (cls === undefined) throw new Error(`Unknown plugin: ${id}`); // unknown: error
    return new cls();                         // creates the object
  }
}

const manager = new PluginManager();          // creates the manager
manager.discover([UsersResource, ArticlesResource, class Other {}]);
console.log(manager.create('articles').list());   // displays [ 'First article' ]
try {
  manager.create('missing');                  // unknown identifier
} catch (error) {
  console.log(error.message);                 // displays "Unknown plugin: missing"
}
```

## One manager, several kinds of plugins

The manager depends only on a contract: for another kind of plugin, you change the interface. Here is a validation constraint (a rule that an entered value must respect), with the same `Plugin` and `PluginManager` classes.

```php
<?php
// A second kind of plugin: a validation constraint
interface Constraint                          // the contract of a constraint
{
    public function validate(string $value): bool;  // true if the value is accepted
}

#[Plugin(id: 'not_empty', label: 'Required value')]              // its label
final class NotEmpty implements Constraint    // signs the Constraint contract
{
    public function validate(string $value): bool
    {
        return trim($value) !== '';           // refuses an empty or blank-only string
    }
}

#[Plugin(id: 'max_length_5', label: 'Five characters at most')]  // its label
final class MaxLength5 implements Constraint  // signs the Constraint contract
{
    public function validate(string $value): bool
    {
        return mb_strlen($value) <= 5;        // counts characters, accents included
    }
}

// The same manager, another contract
$constraints = new PluginManager(Constraint::class);  // manager of constraints
$constraints->discover([NotEmpty::class, MaxLength5::class, ClockBlock::class]);

// The identifiers come from a configuration (here a simple array)
foreach (['not_empty', 'max_length_5'] as $id) {     // constraints requested by the config
    $result = $constraints->create($id)->validate('Welcome') ? 'ok' : 'refused';
    echo "$id: $result\n";                    // displays the verdict of each constraint
}
print_r(array_keys($constraints->definitions()));    // ClockBlock is not listed here
```

At runtime, `not_empty: ok`, `max_length_5: refused` (`Welcome` has seven characters), and the catalog contains only the two constraints: `ClockBlock`, although labeled, does not sign the `Constraint` contract and is set aside.

| Kind of plugin | Typical contract | What the plugin provides | Where the identifier is used |
|---|---|---|---|
| Display block | `render()` returns content | A reusable piece of a page | A layout configuration |
| Validation constraint | `validate($value)` returns true or false | A control rule for a field | The rules of a form |
| API resource | One method per HTTP verb (`get`, `post`) | The responses of an API address | The routing table of the API |

## What the plugin is not

Several neighboring mechanisms are easily confused with it. The notions of inversion of control and hooks, as well as the service container that supplies objects with their dependencies, belong to other chapters: here we stick to the difference in nature.

| Mechanism | What it does | Difference from the plugin |
|---|---|---|
| Plugin | Several variants of the same role, chosen by identifier | One class per variant, instantiated on demand |
| Inheritance | A parent class specialized by child classes | Ties the variants to a parent class, without catalog or discovery |
| Central `switch` | Lists the variants in a single file | Must be modified for each addition |
| Hook or event | Calls all the registered functions, one after the other | Runs everyone, whereas a plugin chooses one |

## Pitfalls

| Pitfall | Why it is a problem | Reflex |
|---|---|---|
| Two plugins with the same identifier | The second one silently overwrites the first one in the catalog | Refuse the duplicate with an exception at discovery time |
| Forgetting the contract's interface | The plugin is discovered, then crashes when a missing method is called | Check the contract at discovery, like `is_subclass_of` above |
| Reading reflection on every request | Slowness proportional to the number of classes | Cache the catalog and invalidate it at deployment |
| Loading all the files of a folder | One broken class makes the whole discovery fail | Catch the error per file and report the faulty plugin |
| A plugin that creates its own dependencies | The plugin is hard to test and coupled to a technical detail | Provide its dependencies from outside, see [dependency injection](/?c=langages&s=php&p=poo#dependency-injection) |
| An identifier typed by hand everywhere | A typo is only revealed at runtime | A centralized constant or configuration, see the [single source of truth](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite) |
| A plugin system for only two variants | An unnecessarily heavy mechanism | Start with a `switch` and move to plugins when the variants multiply |

## Best practices

| Practice | Reason |
|---|---|
| A clear and small contract per kind of plugin | The manager stays simple and the plugin stays easy to write |
| A stable identifier, in lowercase, never renamed | Saved configurations point to it |
| One class per plugin, one responsibility per class | [Single responsibility principle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) |
| One manager per kind of plugin | Each catalog stays consistent, with one contract per catalog |
| An error message that names the faulty identifier | Debugging takes a single reading |
| A test that discovers all the plugins and checks their contract | Detects a badly declared plugin before it goes live |
| Official reference documentation | [PHP attributes](https://www.php.net/manual/fr/language.attributes.overview.php) and [documentation of a plugin system](https://www.drupal.org/docs/drupal-apis/plugin-api) |

## Key Takeaways

| Notion | What to remember |
|---|---|
| Plugin | An independent class that declares itself, instead of being listed in a central file |
| Contract | An interface that describes what every plugin of a kind must be able to do |
| Label | A PHP `#[...]` attribute (or an annotation in a comment) carries the plugin's identifier |
| Manager | Discovers the labeled classes, fills a catalog, instantiates on demand |
| Discovery | A list, a folder or autoloading; a cache avoids reading reflection on every request |
| Benefit | Adding a feature without touching the central code |
| Main pitfall | Duplicate identifiers and an unchecked contract, to detect at discovery |
