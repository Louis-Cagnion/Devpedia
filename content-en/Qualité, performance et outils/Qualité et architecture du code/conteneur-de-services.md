---
order: 15
---

# The service container and service providers

In an application, most classes need other classes: sending an email needs a logger, a logger needs a file, and so on. Someone has to build all these objects, in the right order, only once when that is useful, and allow them to be replaced. This chapter presents the tool that does it: the **service container**, and the way to declare objects in it (the **service providers**) so they can be injected, replaced or decorated, including those of a framework's **kernel** (a **framework** is a base library that imposes the structure of the application and calls the project's code; its **kernel** is the central part supplied with it, which the project does not write).

It assumes you already know [classes and basic dependency injection](/?c=langages&s=php&p=poo) (receiving one's dependencies as constructor parameters instead of creating them with `new`), [anonymous functions](/?c=langages&s=php&p=methodes) (a function without a name, stored in a variable) and [class autoloading](/?c=langages&s=php&p=autoloading). The reason for loose coupling is in [single responsibility and loose coupling](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage), and the direction of a dependency in [checking the direction of dependencies](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser). These notions are not repeated here. The examples are in PHP, with a JavaScript example at the end; [Drupal](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection) and [Symfony](https://symfony.com/doc/current/service_container.html) (two PHP frameworks) are cited only as examples of the same idea.

## The problem: who builds the objects?

Without a container, each class creates its own dependencies, or the calling code assembles them by hand at each place.

```php
<?php
// Notifier: a class that sends a message to someone
class Notifier
{
    // property: the property that holds the logger used by the class
    private FileLogger $logger;

    // the constructor runs at each "new Notifier()"
    public function __construct()
    {
        // new: the class builds its own dependency itself, hard-coded
        $this->logger = new FileLogger('/var/log/app.log');
    }
}
```

To test `Notifier`, a real file in `/var/log` is needed; to change the logger, the class must be modified. The **service container** solves this: it is a single object that knows the recipe of each shared object and builds it on demand.

| Term | Definition | Example |
|---|---|---|
| **Service** | An object that provides a technical service to the rest of the application without representing business data: it acts (send, log, compute), it does not describe (an order, a customer) | A logger, an email sender, a database access |
| **Identifier** | The unique name under which a service is stored in the container | `logger`, `notifier` |
| **Factory** | The function that knows how to build a service, with its own dependencies | `fn($c) => new Notifier($c->get('logger'))` |
| **Container** | The object that stores the factories, builds a service on first request and keeps it | `$container->get('logger')` |
| **Service provider** | A block of code (or configuration) that declares a group of services in the container | The kernel declares its own, each module declares its own |
| **Injection** | Giving an object its dependencies from outside, instead of letting it create them | `new Notifier($logger)` |

## A minimal container

To understand what framework containers do, we write one of fewer than forty lines. First, two **interfaces** (an interface is a contract: the list of methods that a class must provide, without their code) and the classes that use them. The classes do not know the container.

```php
<?php
// Logger: the contract that every logger must respect
interface Logger
{
    // write: takes a text, returns nothing (void)
    public function write(string $message): void;
}

// ScreenLogger: a logger that displays each message on screen
class ScreenLogger implements Logger
{
    // implements: this class respects the Logger contract
    public function write(string $message): void
    {
        // echo: displays the text; "\n" ends the line
        echo "[logger] $message\n";
    }
}

// Notifier: receives a Logger, without knowing which one
class Notifier
{
    // private Logger $logger: creates and fills the property (constructor promotion)
    public function __construct(private Logger $logger)
    {
    }

    // send: simulates the sending and notes it in the logger
    public function send(string $recipient): void
    {
        // $this->logger: the logger received at construction
        $this->logger->write("Message sent to $recipient");
    }
}
```

The container itself: three arrays (the recipes, the objects already built, the objects being built) and three methods.

```php
<?php
// Container: stores recipes and builds services on demand
class Container
{
    // factories: identifier => function that builds the service
    private array $factories = [];
    // shared: identifier => true if the service must be built only once
    private array $shared = [];
    // instances: identifier => service already built
    private array $instances = [];
    // inProgress: identifiers being built (to detect a cycle)
    private array $inProgress = [];

    // define: adds or replaces the recipe of a service
    public function define(string $id, callable $factory, bool $shared = true): void
    {
        // the new recipe takes the place of the old one
        $this->factories[$id] = $factory;
        // we note whether the service is shared
        $this->shared[$id] = $shared;
        // an instance already built with the old recipe is forgotten
        unset($this->instances[$id]);
    }

    // decorate: wraps the service $id in another one, without touching its code
    public function decorate(string $id, callable $decorator): void
    {
        // the old recipe is kept: it provides the wrapped service
        $inner = $this->factories[$id] ?? throw new RuntimeException("Unknown: $id");
        // the new recipe calls the old one, then passes the result to the decorator
        $wrapper = fn(self $c) => $decorator($inner($c), $c);
        $this->define($id, $wrapper, $this->shared[$id]);
    }

    // get: returns the service, building it if needed
    public function get(string $id): object
    {
        // already built and shared: we return the same object
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }
        // no recipe under this identifier: clear error
        if (!isset($this->factories[$id])) {
            throw new RuntimeException("Unknown service: $id");
        }
        // the identifier is already being built: A needs B which needs A
        if (isset($this->inProgress[$id])) {
            $path = implode(' -> ', array_keys($this->inProgress)) . " -> $id";
            throw new RuntimeException("Circular dependency: $path");
        }
        // we mark the identifier as in progress
        $this->inProgress[$id] = true;
        try {
            // we call the factory, giving it the container for its dependencies
            $service = ($this->factories[$id])($this);
        } finally {
            // whatever happens, we remove the mark
            unset($this->inProgress[$id]);
        }
        // shared service: we keep it; otherwise we return it without keeping it
        if ($this->shared[$id]) {
            $this->instances[$id] = $service;
        }
        return $service;
    }
}
```

## Declaring a service and injecting it

**Declaring** a service means registering its recipe under an identifier. **Injecting** it means that the recipe of another service passes this service to its constructor. Only factories know the container.

```php
<?php
// we create the empty container
$container = new Container();
// declaration: the "logger" service is a ScreenLogger (fn: arrow function)
$container->define('logger', fn() => new ScreenLogger());
// declaration: the "notifier" asks the container for the "logger" and gets it as a parameter
$container->define('notifier', fn(Container $c) => new Notifier($c->get('logger')));
// first request: the container builds the logger, then the notifier
$container->get('notifier')->send('alice@example.org');
// second request for the logger: it is the same object (=== compares object identity)
var_dump($container->get('logger') === $container->get('logger'));
```

Actual result:

```
[logger] Message sent to alice@example.org
bool(true)
```

```
get('notifier')
  |-- recipe of notifier: calls get('logger')
  |     |-- recipe of logger: new ScreenLogger()   --> stored in instances
  |     '-- returns the logger
  '-- new Notifier($logger)                        --> stored in instances
```

The construction order is never written by the developer: it is deduced from the nested `get` calls. A real framework does the same, but reads the dependencies from a declaration instead of a function.

| How to get a dependency | Who builds it | Testable without a real service | Verdict |
|---|---|---|---|
| `new FileLogger(...)` in the class | The class itself | No | To avoid for a service |
| Injection through the constructor | The container (through its factory) | Yes: we pass a fake | The default rule |
| Calling `$container->get('logger')` in the class | The class, through the container | With difficulty | A last resort (see the pitfalls) |

## Service providers: grouping declarations

A real project has hundreds of services. Each part (the kernel, a module, a plugin) declares them in its own **service provider**: an object to which the container is handed so that it can register its recipes. The application starts by calling each provider, in a specific order.

```php
<?php
// ServiceProvider: the contract of a block of declarations
interface ServiceProvider
{
    // register: receives the container and declares its services in it
    public function register(Container $c): void;
}

// KernelProvider: the basic services, supplied with the framework
class KernelProvider implements ServiceProvider
{
    public function register(Container $c): void
    {
        // the kernel declares a logger that writes to the screen
        $c->define('logger', fn() => new ScreenLogger());
        // and a notifier that depends on this logger
        $c->define('notifier', fn(Container $c) => new Notifier($c->get('logger')));
    }
}

// Application: calls each provider in the given order
function start(array $providers): Container
{
    // a new container for this run
    $container = new Container();
    // each provider declares its services (the last one written wins)
    foreach ($providers as $provider) {
        $provider->register($container);
    }
    return $container;
}
```

| Question | Answer in the example | In a real framework |
|---|---|---|
| Where is the declaration? | PHP code (`define`) | Often a configuration file (YAML): class, arguments, tags |
| Who calls it? | The `start` function | The framework, at startup, or when the container is compiled |
| In what order? | The order of the list | The kernel first, then the modules (often by priority) |
| What happens at the end? | The container is ready | The container is often **compiled** (turned into an optimized PHP class) and cached |

## Replacing a core service

To change a behavior of the kernel, we do not edit the kernel (updates would erase the change): a project provider **re-declares the same identifier**. Since the last one written wins, all the services that ask for `logger` receive the new version, without a single line of `Notifier` changing.

```php
<?php
// MemoryLogger: keeps the messages in an array, useful for tests
class MemoryLogger implements Logger
{
    // messages: everything that has been written, in order
    public array $messages = [];

    public function write(string $message): void
    {
        // [] = appends at the end of the array
        $this->messages[] = $message;
    }
}

// ProjectProvider: the project's provider, called after the kernel's
class ProjectProvider implements ServiceProvider
{
    public function register(Container $c): void
    {
        // same identifier "logger": the kernel's recipe is replaced
        $c->define('logger', fn() => new MemoryLogger());
    }
}

// kernel only: the logger writes to the screen
start([new KernelProvider()])->get('notifier')->send('bob@example.org');
// kernel then project: the logger is replaced, nothing is displayed
$app = start([new KernelProvider(), new ProjectProvider()]);
// we send a message with the replaced logger
$app->get('notifier')->send('bob@example.org');
// the message is in the memory of the new logger
print_r($app->get('logger')->messages);
```

Actual result:

```
[logger] Message sent to bob@example.org
Array
(
    [0] => Message sent to bob@example.org
)
```

The replacement must respect **the same contract** (here `Logger`): otherwise the services that use it crash at runtime. In a framework, this is called redefining a service definition; the Drupal example is a module provider class that modifies the kernel's definition before compilation (see [the Drupal documentation on services](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection)).

## Decorating a service: enriching it instead of replacing it

Replacing throws away the old service. A **decorator** (a design pattern) is an object that **wraps** the old service, respects the same contract, delegates the work to it and adds something before or after. The kernel and the project each keep their share of the behavior.

```php
<?php
// NumberedLogger: wraps another Logger and numbers the messages
class NumberedLogger implements Logger
{
    // counter: the number of the next message
    private int $counter = 1;

    // $inner: the wrapped logger, to which we delegate
    public function __construct(private Logger $inner)
    {
    }

    public function write(string $message): void
    {
        // we add the number, then let the old logger do its work
        $this->inner->write('#' . $this->counter++ . ' ' . $message);
    }
}

// we start again from the kernel alone
$app = start([new KernelProvider()]);
// decorate: the "logger" becomes NumberedLogger($old_logger)
$app->decorate('logger', fn(Logger $inner) => new NumberedLogger($inner));
// the kernel's notifier receives the decorated logger, without knowing it
$app->get('notifier')->send('carole@example.org');
$app->get('notifier')->send('dave@example.org');
```

Actual result:

```
[logger] #1 Message sent to carole@example.org
[logger] #2 Message sent to dave@example.org
```

If two providers decorate the same service, the decorators stack like Russian dolls: the last one declared is the outermost. In frameworks, this is written in configuration with a `decorates` key (Symfony and Drupal know it) instead of code.

| Technique | What it does | When to choose it | Risk |
|---|---|---|---|
| **Replace** | Re-declares the identifier with another class | The kernel's behavior no longer fits at all | Losing functions that other modules expected; another replacement overwrites it |
| **Decorate** | Wraps the old service, which stays in the chain | We want to add something (cache, log, measure) without losing what exists | The order of the decorators matters; the interface must be respected in full |
| **Alias** | Gives a second identifier to an existing service | Several names designate the same service (`logger` and `log`) | The service is shared: replacing it changes all the names |
| **Extend the class** (`extends`) | A child class re-declared under the old identifier | A small change in one method | Fragile: depends on the internal details of the parent class |

## Shared or new on each request

By default, a service is **shared**: the container builds it only once and returns the same object afterwards (as `===` shows above). This is intended for a logger or a database connection. But an object that keeps state specific to one operation (a cart, a form in progress) must not be shared: otherwise two operations get mixed up in it.

```php
<?php
// non-shared service: the third argument false asks for a new object on each get
$container = new Container();
$container->define('logger', fn() => new MemoryLogger(), false);
// two requests: two different objects (!== compares identity)
var_dump($container->get('logger') !== $container->get('logger'));
```

Actual result: `bool(true)`.

| Mode | How many objects | Suited to | Danger |
|---|---|---|---|
| Shared (default) | One for the whole application | Logger, configuration, connection | State kept inside leaks from one operation to another |
| Not shared | One per request | A working object, for single use | Repeated construction cost; cannot serve as a common tuning point |

## Testing: replacing a service with a fake

This is the most concrete benefit of the container: a test declares, in place of the real logger, a fake that records what is sent to it.

```php
<?php
// we build a normal application
$app = start([new KernelProvider()]);
// the test replaces the logger with a fake that keeps the messages in memory
$fake = new MemoryLogger();
$app->define('logger', fn() => $fake);
// we run the behavior to test
$app->get('notifier')->send('test@example.org');
// we check what the notifier wrote: true if the messages are the expected ones
var_dump($fake->messages === ['Message sent to test@example.org']);
```

Actual result: `bool(true)`. The principle of automated tests is explained in [unit tests](/?c=tests&p=tests-unitaires); the advantage here is that the test depends on no file and no network.

## Errors the container detects

Two services that ask for each other form a **circular dependency**: building one requires the other, endlessly. Our container detects it thanks to `inProgress` and names the path.

```php
<?php
// "a" needs "b", and "b" needs "a"
$c = new Container();
$c->define('a', fn(Container $c) => $c->get('b'));
$c->define('b', fn(Container $c) => $c->get('a'));
// try / catch: we catch the error to display it
try {
    $c->get('a');
} catch (RuntimeException $e) {
    // getMessage: the text of the error
    echo $e->getMessage(), "\n";
}
```

Actual result: `Circular dependency: a -> b -> a`. The real fix is not in the container: a cycle signals two badly split classes (see [single responsibility and loose coupling](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)). We extract the common part into a third service, on which both depend.

## The same idea in JavaScript

Nothing in the principle is specific to PHP. In JavaScript, a `Map` (a dictionary: key/value pairs) stands in for the table of recipes.

```javascript
// Container: same principle as in PHP, in ten lines
class Container {
    // factories: identifier => function that builds the service
    #factories = new Map();
    // instances: identifier => service already built
    #instances = new Map();

    // define: adds or replaces a recipe
    define(id, factory) {
        // the new recipe replaces the old one
        this.#factories.set(id, factory);
        // the instance possibly built is forgotten
        this.#instances.delete(id);
    }

    // get: returns the service, built on first request
    get(id) {
        // already built: we return it
        if (this.#instances.has(id)) return this.#instances.get(id);
        // no recipe: clear error
        if (!this.#factories.has(id)) throw new Error(`Unknown service: ${id}`);
        // we build it, passing the container to the factory, then we keep it
        const service = this.#factories.get(id)(this);
        this.#instances.set(id, service);
        return service;
    }
}

// declaration of a logger, then of a notifier that receives it
const c = new Container();
c.define("logger", () => ({ write: (m) => console.log(`[logger] ${m}`) }));
c.define("notifier", (cont) => ({ send: (d) => cont.get("logger").write(d) }));
// usage: the construction is lazy, in the wanted order
c.get("notifier").send("erwan@example.org");
```

Actual result: `[logger] erwan@example.org`. ES modules and injection libraries (for example [InversifyJS](https://inversify.io/) or [tsyringe](https://github.com/microsoft/tsyringe)) add the same features as those described here; the documentation of the [PSR-11](https://www.php-fig.org/psr/psr-11/) standard sets, on the PHP side, the minimal interface of a container (`get` and `has`).

## In a real framework

Frameworks reuse this mechanism and declare it in configuration. The table links each notion of this chapter to its usual equivalent (the details vary from one framework to another: the [Symfony container page](https://symfony.com/doc/current/service_container.html) gives a complete example).

| Notion in this chapter | Common equivalent in a framework |
|---|---|
| `define('id', factory)` | An entry in a `services.yml` file: identifier, class, list of arguments |
| `$c->get('logger')` in a factory | An argument written `@logger` in the declaration: the framework resolves it |
| Service provider | A declaration file per module, plus a PHP class for dynamic cases |
| `decorate` | A `decorates` key in the declaration |
| Replace | A module provider class that modifies the definition before compilation |
| Cycle detected | An error when the container is compiled |

## Pitfalls

| Pitfall | Why it is a problem | Fix |
|---|---|---|
| Passing the whole container to a class (`__construct(Container $c)` then `$c->get(...)` everywhere): this is called the **service locator** | The real dependencies of the class become invisible; a test must fill a whole container; the container is everywhere | Inject each dependency, one per parameter; reserve the container for factories only |
| Replacing a core service with a class that does not respect its whole contract | Another kernel service calls a missing method: the error surfaces far from the cause | Type on the interface and implement all its methods; or decorate rather than replace |
| Two modules replace the same identifier | The last one called wins, with no warning: the result depends on the order | Decorate rather than replace; check the order of the providers |
| Shared service that keeps state specific to one operation | Two operations share the same state (one user's data appearing in another's) | Non-shared service, or state passed as a method parameter |
| Circular dependency between two services | Construction is impossible, or bypassed by a late injection that hides a bad split | Extract the common part into a third service |
| Changing a declaration without rebuilding the compiled container cache | The framework keeps using the old version | Clear the framework cache after each change to a declaration |
| Building many heavy things in the constructor (connection, file reading) | The service is built as soon as another one depends on it, even if it is not used | Lightweight constructor, work done at the first method call |
| Depending on an identifier written as a string (`'logger'`) without checking it | A typo only shows up at runtime | A constant or the class name as the identifier; a test that builds each service |

## Best practices

| Best practice | Why |
|---|---|
| Inject through the constructor, never with `new` inside the class, for any service | The class declares its needs and can be tested with fakes |
| Type each dependency on an interface (`Logger`), not on a concrete class | Replacing or decorating breaks nothing |
| One service provider per module, which declares only its own services | Each module stays independent and removable |
| Prefer **decorating** to **replacing** when you want to add behavior | We keep the work of the kernel and that of the other modules |
| Document in the project every replaced kernel service, and why | A kernel update can break a replacement without anything signaling it |
| Pass the container only to factories, never to business classes | The dependencies stay visible in the signatures |
| Keep services stateless, otherwise declare them non-shared | No data leak between operations |
| Test a full startup: build each declared service | A cycle, a missing class or an identifier typo is detected before going live |

## Key Takeaways

| | |
|---|---|
| **Key takeaway** | A service container stores recipes (factories) under identifiers and builds each object on demand, once if it is shared. A service provider groups the declarations of one part of the application. Injecting means that a factory passes its dependencies to the constructor. To change a kernel service without editing the kernel: re-declare it under the same identifier (replace) or wrap it (decorate, which keeps the old behavior). The replacement or the decorator respects the same contract. A test replaces a service with a fake. A cycle between services is fixed by splitting things differently. |
| **Pitfalls to avoid** | The service locator (container passed to classes); a replacement that does not respect the whole contract; two replacements of the same identifier; a shared service that keeps state; a circular dependency; a forgotten container cache; a heavy constructor; an unchecked string identifier. |
| **Best practices** | Inject through the constructor; type on an interface; one provider per module; decorate rather than replace; document kernel replacements; container reserved for factories; stateless services; a test that builds each service. |

Two neighboring topics are not covered here: inversion of control and hooks (the framework calls the project's code at planned points) and plugin architecture (classes discovered by the framework through an annotation or an attribute).
