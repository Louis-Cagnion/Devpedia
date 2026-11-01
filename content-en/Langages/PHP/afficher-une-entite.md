---
order: 17
---

# Displaying an entity: render builder, route and access control (31/10/2026)

An **entity** is a piece of data that the application can identify, store and find again: an article, a user, a comment, an order. It has a **type** ("article"), a **number** (12) and fields (title, text, author). Displaying an entity on a web page seems simple: read the data and write some [HTML](/?c=langages&s=html&p=structure-dun-document) (the language that describes the content of a page). In reality, three separate questions hide behind that action, and mixing them up produces fragile code and security holes. This chapter separates them with a small PHP program that you can run, then shows how a content management system (CMS, software for publishing and managing content) such as [Drupal](https://www.drupal.org/docs/drupal-apis/entity-api) implements them with three tools: a render builder, an entity route and an access control manager.

It requires **PHP 8.1 at minimum** (`enum` enumerations and `readonly` properties do not exist before it; the chapter was tested with PHP 8.3). It assumes that you already know [routing without a framework](/?c=langages&s=php&p=routage) (a route links an address to some code), [OOP in PHP](/?c=langages&s=php&p=poo) (class, constructor, dependency injection) and, for the address parameter turned into an object, [route parameter conversion](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre). The status codes `200`, `403` and `404` are presented in [data exchanges: APIs and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

> In this chapter, Drupal is only an **example**: the principle applies to any framework (a large code base that provides the skeleton of an application, see [inversion of control](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension); for example [Symfony](https://symfony.com/doc/current/index.html) or [Laravel](https://laravel.com/docs)) or to code written by hand. Everything specific to Drupal is mainly grouped in the section "An example: how Drupal 11 implements this principle" (a few "in Drupal" mentions come back in "Lists and queries" and in the summaries); the rest is plain PHP that the chapter really runs.

## The problem: three questions mixed together

When a visitor asks for article 12, the program must answer three questions, in this order.

| Question | It concerns | Example answer | It changes when |
|---|---|---|---|
| What is the data? | The **data** | "Title: Hello, author: 2, status: published" | The content of the article is edited |
| Is the visitor allowed to see it? | The **access right** | "Yes" or "No", depending on the visitor's account | A security rule changes |
| How should it be presented? | The **layout** | A large title, then the text; or only the title in a list | The design of the site changes |

Here is what the reflex of writing everything in the same place gives. Some syntax landmarks for this first block (see [PHP syntax](/?c=langages&s=php&p=syntaxe) and [variables](/?c=langages&s=php&p=variables)): `<?php` opens the PHP code; `function name(...)` defines a function, a reusable block of code; `array` and `string` are the "array" and "text" types; `echo` writes a text on the screen; `.` joins two texts end to end; `!==` means "different (value or type)"; `&&` means "and" between two conditions.

```php
<?php
// file: mixed.php
// one article and two accounts, as associative arrays (key => value pairs)
$article = ['title' => 'Hello', 'status' => 'draft', 'author' => 2];
$author = ['id' => 2];  // the account that wrote the article
$visitor = ['id' => 5]; // another account

// displaying an article, with everything mixed in a single function
function showArticle(array $article, array $account): string
{
    // access rule: a draft is only visible to its author
    if ($article['status'] === 'draft' && $article['author'] !== $account['id']) {
        return 'Access denied';
    }
    // layout: the title is pasted as it is into the HTML
    return '<h2>' . $article['title'] . '</h2>';
}

echo showArticle($article, $author), "\n";  // expected: the title in HTML
echo showArticle($article, $visitor), "\n"; // expected: the refusal
```

Result obtained:

```text
<h2>Hello</h2>
Access denied
```

It works, but three flaws appear as soon as the site grows.

| Flaw | Consequence |
|---|---|
| The access rule is copied into every page that displays an article (list, feed, search) | One page forgets the rule and shows a draft: this is a *broken access control*, the first family of flaws in the [OWASP Top 10](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| The layout is written in the same function as the rule | Changing the design means reopening security code |
| The title is pasted into the HTML without being neutralized | A title containing `<script>` would be run by the browser: an XSS flaw (*Cross-Site Scripting*, see [XSS in detail](/?c=securite&s=cybersecurite&p=xss-en-detail)), see also [securing your data](/?c=langages&s=php&p=securite) |

The solution is that of [single responsibility](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage): one piece per question (the data, the rule, the presentation), and a fourth piece, the route, that chains them together.

```text
  request: /article/12
        |
        v
  ENTITY ROUTE          "this address shows an article, in full mode,
        |                provided the visitor is allowed to see it"
        v
  CONVERSION            "12" becomes the Article object number 12 (otherwise 404)
        |
        v
  ACCESS CONTROL ---- denied ----> 403 response
        |
     allowed
        v
  RENDER BUILDER        data + display mode = render array
        |
        v
  RENDER ENGINE         render array = HTML (text neutralized)
        |
        v
  200 response
```

Each step of the diagram is detailed below. "Render builder" and "render engine" are two different pieces; the first one has nothing to do with the `__construct` of a class.

## The pieces of the mini-example

The rest of the chapter builds these pieces one by one, in plain PHP, in four files, then a test script. To try them, save the five files in the same folder, open a terminal (see [the terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)), go to this folder and type the command indicated at the end.

| Piece | Role | File |
|---|---|---|
| `Article`, `Account` | The data and the person who asks to see it | `data.php` |
| `Access` | The answer of a rule: allowed, forbidden or neutral | `access.php` |
| `AccessRule` and its implementations | Each rule gives its opinion on an article | `access.php` |
| `AccessManager` | Gathers the opinions and gives a single answer | `access.php` |
| `RenderBuilder` | Turns the article into a render array, according to a mode | `render.php` |
| `RenderEngine` | Turns the render array into HTML | `render.php` |
| `EntityTypes` | Registry: for an entity type, gives its handlers | `routes.php` |
| `EntityRouter` | Chains route, conversion, access and rendering | `routes.php` |

## The data: the article and the account

The data is an object that only holds values. It knows nothing about its display or its rights. In the code below, `int`, `string`, `array` and `bool` are **declared types** (integer, text, array, true/false): they say which kind of value a property or a parameter accepts; `: bool` after the parentheses gives the type of the returned value; `public` makes a property readable from everywhere, `private` reserves it for its class; `void` means "returns nothing" (see [OOP in PHP](/?c=langages&s=php&p=poo)).

```php
<?php
// file: data.php

// the data alone: an article has no idea how it is displayed or who may see it
final class Article
{
    // the constructor receives the values and stores them in properties
    public function __construct(
        public readonly int $id,        // number; readonly: never modifiable afterwards
        public readonly string $title,  // title shown
        public readonly string $body,   // text of the article
        public readonly int $author,    // number of the account that wrote it
        public readonly string $status, // "published" or "draft"
    ) {
    }
}

// the person who asks to see it: their number and their permissions
final class Account
{
    public function __construct(
        public readonly int $id,           // account number (0 for an anonymous visitor)
        public readonly array $permissions // list of texts, e.g. ['view articles']
    ) {
    }

    // tells whether the account has a given permission
    public function has(string $permission): bool
    {
        return in_array($permission, $this->permissions, true); // true: strict comparison
    }
}
```

| PHP syntax | Meaning |
|---|---|
| `final class` | Class that no other class can extend (see [OOP in PHP](/?c=langages&s=php&p=poo)) |
| `public readonly int $id` in the constructor list | Creates a public property, readable everywhere, **read-only** (set once at construction, never changed afterwards), and gives it the value received |
| `in_array($x, $list, true)` | Looks for `$x` in `$list`; the `true` forces a strict comparison (without it, PHP sometimes converts texts into numbers: `"1e1"` equals `"10"`, since `1e1` is also written 10; with it, it does not), always use it for texts |

An anonymous visitor is an account like any other, here with number `0` and no permission: the code needs no special case. A **permission** is a named right granted to an account ("view articles"). Who holds which permission is managed elsewhere (see [RBAC and ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac)); here, `Account` simply lists them.

## An access answer with three values

The question "are we allowed?" does not come down to yes or no. A rule can also **have no opinion**: the rule "a draft is visible to its author" has nothing to say about a published article. So three answers are needed.

| Answer | Meaning | Example |
|---|---|---|
| `Allowed` | This rule says yes | The author opens their own draft |
| `Forbidden` | This rule says no, **and this no overrides every yes** | The article is blocked by moderation |
| `Neutral` | This rule has no opinion | The rule on drafts, applied to a published article |

When several rules answer, their answers are combined. To write it in PHP, one uses an **enumeration** (`enum`), which is a type whose only possible values are listed in advance, here the three answers.

```php
<?php
// file: access.php

// an access answer has three possible values, not two: this is an enumeration
enum Access
{
    case Allowed;   // a rule says yes
    case Forbidden; // a rule says no, and this no is final
    case Neutral;   // the rule has no opinion on this case

    // "or": one favorable vote is enough, but a Forbidden always wins
    public function orWith(Access $other): Access
    {
        if ($this === self::Forbidden || $other === self::Forbidden) {
            return self::Forbidden; // a single veto is enough
        }
        if ($this === self::Allowed || $other === self::Allowed) {
            return self::Allowed; // at least one yes, no veto
        }
        return self::Neutral; // nobody has an opinion
    }

    // "and": both must agree; a veto or a silence blocks
    public function andWith(Access $other): Access
    {
        if ($this === self::Forbidden || $other === self::Forbidden) {
            return self::Forbidden; // a veto stays a veto
        }
        if ($this === self::Allowed && $other === self::Allowed) {
            return self::Allowed; // both say yes
        }
        return self::Neutral; // one of the two did not say yes
    }

    // final decision: only Allowed opens the door (Neutral refuses)
    public function isAllowed(): bool
    {
        return $this === self::Allowed;
    }
}
```

| PHP syntax | Meaning |
|---|---|
| `enum Access { case Allowed; ... }` | Declares the type `Access` and its only possible values, called *cases* |
| `self::Forbidden` | The `Forbidden` value of the current enumeration |
| `$this` | The object the method is called on: here, the first of the two compared answers |
| `===` | Strict equality: same value **and** same type |
| `\|\|` and `&&` | "or" and "and" between two conditions (not to be confused with the methods `orWith` and `andWith` of the enumeration, which combine access answers) |
| `if (...) { return ...; }` | If the condition is true, the answer is returned straight away and the rest of the method is not read (see [conditions](/?c=langages&s=php&p=conditions)) |

The `orWith` combination is used when several rules share the decision; `andWith` when two conditions must both hold. Here is what each pair of answers gives, obtained by running `Access::cases()` (the list of the three values):

| Answer A | Answer B | `A->orWith(B)` | `A->andWith(B)` |
|---|---|---|---|
| Allowed | Allowed | Allowed | Allowed |
| Allowed | Forbidden | Forbidden | Forbidden |
| Allowed | Neutral | Allowed | Neutral |
| Forbidden | Allowed | Forbidden | Forbidden |
| Forbidden | Forbidden | Forbidden | Forbidden |
| Forbidden | Neutral | Forbidden | Forbidden |
| Neutral | Allowed | Allowed | Neutral |
| Neutral | Forbidden | Forbidden | Forbidden |
| Neutral | Neutral | Neutral | Neutral |

Two facts to remember: a `Forbidden` always wins, whatever the operator; and the final decision only opens the door for an `Allowed`. A final `Neutral` means "no rule said yes": access is refused. This is the principle of **deny by default**: when no rule is favorable, the door stays closed.

## The access rules and their manager

An **interface** is a contract: it lists the methods that a class promises to offer, without writing their content. All the rules follow the same interface, so the manager can call them without knowing what they do. At the end of `access.php`:

```php
// the contract of an access rule: an opinion on an article, an operation and an account
interface AccessRule
{
    public function check(Article $article, string $operation, Account $account): Access;
}
```

The first rule is the article's own rule.

```php
// the rule specific to articles (only the "view" operation)
final class ArticleAccessRule implements AccessRule
{
    public function check(Article $article, string $operation, Account $account): Access
    {
        if ($operation !== 'view') {
            return Access::Neutral; // unknown operation: no opinion
        }
        if ($account->has('administer articles')) {
            return Access::Allowed; // the administrator sees everything
        }
        if ($article->status === 'draft') {
            // a draft is only visible to its author
            return $article->author === $account->id ? Access::Allowed : Access::Neutral;
        }
        return $account->has('view articles') ? Access::Allowed : Access::Neutral;
    }
}
```

The second rule is added "from the outside". It does not belong to the article's rules: imagine that a **module** (an extension that adds features to the application) for moderation provides it. It never says yes, only no when the article is blocked.

```php
// a rule added "from the outside": it forbids any article whose number is blocked
final class BlockRule implements AccessRule
{
    public function __construct(private array $blockedIds) // numbers of blocked articles
    {
    }

    public function check(Article $article, string $operation, Account $account): Access
    {
        $blocked = in_array($article->id, $this->blockedIds, true); // in the list?
        return $blocked ? Access::Forbidden : Access::Neutral; // blocked: forbidden to all
    }
}
```

The **access control manager** gathers the rules and gives a single answer. The other pieces of the program never call a rule directly: they query the manager.

```php
// the access control manager: it gathers the rules and gives ONE answer
final class AccessManager
{
    public function __construct(private array $rules) // list of AccessRule objects
    {
    }

    public function access(Article $article, string $operation, Account $account): Access
    {
        $answer = Access::Neutral; // we start from silence
        foreach ($this->rules as $rule) {
            // we combine each opinion with "or": a veto wins, one yes is enough
            $answer = $answer->orWith($rule->check($article, $operation, $account));
        }
        return $answer;
    }
}
```

| PHP syntax | Meaning |
|---|---|
| `class X implements Y` | The class `X` promises to offer all the methods of the interface `Y` |
| `condition ? a : b` | Equals `a` if the condition is true, otherwise `b` |
| `private array $rules` in the constructor list | Creates a property hidden from the outside and gives it the value received |
| `foreach ($this->rules as $rule)` | Repeats the block for each element of the array, under the name `$rule` |
| `$answer->orWith(...)` | Calls the `orWith` method of the enumeration on the value held in `$answer` |

Here is what each combination of rules gives for three situations.

| Case | `ArticleAccessRule` | `BlockRule` | Answer of the manager |
|---|---|---|---|
| Published article, reader with the permission | Allowed | Neutral | Allowed |
| Draft, another account | Neutral | Neutral | Neutral (so refused) |
| Blocked article, administrator | Allowed | Forbidden | Forbidden (the veto overrides the administrator) |

## The render builder and the render array

The **render builder** (called *view builder* in Drupal) answers the question "how should this data be presented?". It does not produce HTML yet. It produces a **render array**: a PHP array that describes what to display (which fields, with which values, in which mode). Another component, the **render engine**, will turn it into HTML. This intermediate step is useful: the array can be completed or modified by other pieces of code before being written as HTML, and it can be tested without parsing any text.

A **display mode** is a way of showing the same data: the whole article on its page, or only its title in a list.

| Mode | Fields shown | Where it is seen |
|---|---|---|
| `full` | title and body | The article's page |
| `preview` | title | A line in a list of articles |

```php
<?php
// file: render.php

// the contract of a render builder: from data to a render array
interface RenderBuilder
{
    public function view(Article $article, string $mode = 'full'): array;
}

// render builder for articles: it chooses the fields according to the display mode
final class ArticleRenderBuilder implements RenderBuilder
{
    // for each display mode, the list of fields to show
    private const MODES = [
        'full' => ['title', 'body'], // the article's page
        'preview' => ['title'],      // the line in a list
    ];

    public function view(Article $article, string $mode = 'full'): array
    {
        // throw inside a ??: if the mode does not exist, an error is raised
        $fields = self::MODES[$mode]
            ?? throw new InvalidArgumentException("Unknown mode: $mode");
        // "#" keys: metadata
        $renderArray = ['#mode' => $mode, '#article' => $article->id];
        foreach ($fields as $field) {
            $renderArray[$field] = $article->$field; // property named by $field
        }
        return $renderArray;
    }
}
```

| PHP syntax | Meaning |
|---|---|
| `string $mode = 'full'` | Default value of a parameter: if the caller gives no mode, `$mode` equals `'full'` |
| `"Unknown mode: $mode"` | Text in double quotes: PHP replaces `$mode` with its value |
| `throw new InvalidArgumentException(...)` | Raises an error, here of the class `InvalidArgumentException` ("invalid argument"); see [exceptions in PHP](/?c=langages&s=php&p=exceptions) |
| `private const MODES = [...]` | Class constant, hidden from the outside: the list of known modes |
| `self::MODES[$mode]` | Reads the constant of the current class, at the key `$mode` |
| `$a ?? throw new ...` | If `$a` does not exist, raises an error instead of continuing with an empty value |
| `'#mode'` | Key starting with `#`: by convention, a metadata (information about the array) and not a field to display |
| `$article->$field` | Reads the property whose name is in the variable `$field` |

For an article number 1, with title `T` and body `C`, the builder renders in `full` mode (result of `print_r`, which displays an array):

```text
Array
(
    [#mode] => full
    [#article] => 1
    [title] => T
    [body] => C
)
```

An unknown mode throws an exception (see [exceptions in PHP](/?c=langages&s=php&p=exceptions)) whose message is `Unknown mode: unknown`.

The render engine is added after the contents of `render.php`. It is the only piece that writes HTML, so it is the one that neutralizes the text.

```php
// the render engine: it turns a render array into HTML, and protects the text
final class RenderEngine
{
    public function html(array $renderArray): string
    {
        $html = '<article>'; // opening tag
        foreach (['title' => 'h2', 'body' => 'p'] as $field => $tag) {
            if (isset($renderArray[$field])) { // only the fields present in this mode
                // htmlspecialchars neutralizes < > & and " : the text does not become HTML
                $html .= "<$tag>" . htmlspecialchars($renderArray[$field]) . "</$tag>";
            }
        }
        return $html . '</article>'; // closing tag
    }
}
```

| PHP syntax | Meaning |
|---|---|
| `foreach (['title' => 'h2', ...] as $field => $tag)` | Goes through a list of key => value pairs: at each turn, `$field` receives the key and `$tag` the value |
| `isset($renderArray[$field])` | True if the key exists in the array and is not `null` |
| `$html .= "..."` | Adds the text to the end of `$html` |
| `"<$tag>"` | Text in double quotes: `$tag` is replaced by its value, for example `h2` |
| `htmlspecialchars(...)` | Replaces `<`, `>`, `&` and quotes with codes that the browser displays as they are |

`htmlspecialchars` replaces `<` with `&lt;` (an *HTML entity*, a code that displays as the character): the browser then displays the text `<b>` instead of interpreting it as bold. Writing this protection in the engine, and not in each page, prevents a page from forgetting it.

## The type registry and the entity route

It remains to connect the pieces. The **registry of entity types** links a type ("article") to its handlers: its render builder and its access manager. The router then knows no specific type: it asks the registry.

```php
<?php
// file: routes.php

// registry of entity types: for a type, it provides its handlers
final class EntityTypes
{
    private array $handlers = []; // type => ['render' => ..., 'access' => ...]

    public function declare(string $type, array $handlers): void
    {
        $this->handlers[$type] = $handlers; // the type registers itself
    }

    public function renderBuilder(string $type): RenderBuilder
    {
        return $this->handlers[$type]['render'];
    }

    public function accessControl(string $type): AccessManager
    {
        return $this->handlers[$type]['access'];
    }
}
```

An **entity route** is a route that does not designate a specific piece of code, but an **entity and a display mode**: `article.full` means "the entity of type `article`, in `full` mode". It also designates the operation to allow: `article.view`. The router reads these two texts and looks for the matching handlers in the registry.

```php
// the entity router: it knows NO specific type, only the handlers
final class EntityRouter
{
    public function __construct(
        private EntityTypes $types, // registry of types
        private array $routes,      // address pattern => ['view' => ..., 'access' => ...]
        private array $entities     // [type => [number => object]]: fake in-memory storage
    ) {
    }

    // returns [HTTP code, response body]
    public function respond(string $path, Account $account): array
    {
        foreach ($this->routes as $pattern => $route) {
            // {article} becomes a named capture: (?<article>[^/]+) = anything but "/"
            $capture = preg_replace('#\{(\w+)\}#', '(?<$1>[^/]+)', $pattern);
            $regex = '#^' . $capture . '$#'; // the full regex, from ^ (start) to $ (end)
            if (preg_match($regex, $path, $found) === 1) {
                return $this->handle($route, $found, $account); // first route found
            }
        }
        return [404, 'Unknown page']; // no route matches
    }

    private function handle(array $route, array $found, Account $account): array
    {
        [$type, $mode] = explode('.', $route['view']); // "article.full" -> type and mode
        $number = (int) ($found[$type] ?? 0); // the text of the address becomes a number
        $entity = $this->entities[$type][$number] ?? null; // conversion to an object, or null
        if ($entity === null) {
            return [404, 'Not found']; // the number designates no entity
        }
        [, $operation] = explode('.', $route['access']); // "article.view" -> "view"
        $access = $this->types->accessControl($type)->access($entity, $operation, $account);
        if (!$access->isAllowed()) {
            return [403, 'Access denied']; // Forbidden or Neutral: the door stays closed
        }
        $renderArray = $this->types->renderBuilder($type)->view($entity, $mode);
        return [200, (new RenderEngine())->html($renderArray)];
    }
}
```

| Element of the router | Role |
|---|---|
| `{article}` in `/article/{article}` | A route **parameter**: the part of the address that changes (see [routing](/?c=langages&s=php&p=routage)). Its name is that of the entity type, which tells what to load |
| `preg_replace` and `preg_match` | Turn the pattern into a **regular expression** (a search pattern in text, with a syntax close to [that of the chapter on regexes](/?c=langages&s=domain-specific-languages-dsl&p=regex)) and then test the address |
| Pitfall of the pattern | The address pattern is read as a regex without being escaped: a `.` or a `+` in `/article.html/{article}` would be read as a symbol of the pattern. The patterns of this chapter contain none; otherwise, protect the fixed part with `preg_quote` (a PHP function that escapes these symbols) |
| `(?<article>[^/]+)` | Named capture: "one or more characters that are not `/`", stored under the name `article` |
| `#\{(\w+)\}#` | Pattern that looks for an opening brace, a word (`\w+`: letters, digits and `_`), then a closing brace; the `#` at both ends delimit the pattern, and `$1` in the replacement gives back the word found |
| `'#^' . $capture . '$#'` | `^` means "start of text" and `$` "end of text": the whole address must match, not just a part of it |
| `explode('.', 'article.full')` | Cuts the text at each dot: we get `['article', 'full']` |
| `[$type, $mode] = ...` | Stores the two pieces in two variables at once |
| `(int) $text` | Converts to a whole number; a text such as `abc` gives `0`, which designates no entity. Pitfall: `1abc` gives `1`, so `/article/1abc` would display article 1 (a double address); to be strict, first test with `ctype_digit($text)` (true only if the text contains only digits) or write `\d+` instead of `[^/]+` in the pattern |
| `$array[$key] ?? null` | Gives `null` when the key does not exist: here, a missing entity, which leads to the `404` |
| `[, $operation] = ...` | Stores only the **second** piece: the lone comma skips the first one |
| `preg_match($regex, $path, $found)` | Tests the address and stores the captures in `$found`; returns `1` if the address matches |
| `(new RenderEngine())->html(...)` | Creates an object and immediately calls one of its methods |

The order of the checks matters: first the existence (`404`), then the right (`403`), and only then the construction of the render. The render builder is therefore never called for a visitor who has no right.

## Assembling and trying it out

The file `test.php` creates three articles, four accounts and two routes, then requests each address with each account.

```php
<?php
// file: test.php
require __DIR__ . '/data.php';   // Article and Account
require __DIR__ . '/access.php'; // Access, rules and access manager
require __DIR__ . '/render.php'; // render builder and render engine
require __DIR__ . '/routes.php'; // registry of types and router

// three articles: published, a draft of author 2, published but blocked
$articles = [
    1 => new Article(1, 'Hello', 'One <i>word</i>.', 2, 'published'),
    2 => new Article(2, 'Idea in progress', 'Not finished.', 2, 'draft'),
    3 => new Article(3, 'Controversial topic', 'Removed.', 2, 'published'),
];

// we declare the "article" type with its render builder and its access control
$types = new EntityTypes();
$types->declare('article', [
    'render' => new ArticleRenderBuilder(),
    'access' => new AccessManager([new ArticleAccessRule(), new BlockRule([3])]),
]);

// two routes: the same entity seen in full mode, then in preview
$routes = [
    '/article/{article}' => ['view' => 'article.full', 'access' => 'article.view'],
    '/preview/{article}' => ['view' => 'article.preview', 'access' => 'article.view'],
];
$router = new EntityRouter($types, $routes, ['article' => $articles]);

// four accounts: anonymous, reader, author of the draft, administrator
$accounts = [
    'anonymous' => new Account(0, []),
    'reader' => new Account(5, ['view articles']),
    'author' => new Account(2, []),
    'admin' => new Account(1, ['administer articles']),
];

// each line: the account, the address requested, the code obtained and the body
foreach (['/article/1', '/preview/1', '/article/2', '/article/3', '/article/99'] as $url) {
    foreach ($accounts as $name => $account) {
        [$code, $body] = $router->respond($url, $account);
        printf("%-8s %-11s %d %s\n", $name, $url, $code, $body);
    }
}
```

A few syntax elements of this script:

| PHP syntax | Meaning |
|---|---|
| `require __DIR__ . '/data.php'` | Loads another file, located in the same folder as this one (see [include and require](/?c=langages&s=php&p=include)) |
| `new Article(1, 'Hello', ...)` | Creates an article; the values follow the order of the constructor: number, title, body, author, status |
| `foreach ($accounts as $name => $account)` | Goes through a list while keeping the key (`$name`) and the value (`$account`) |
| `printf("%-8s %-11s %d %s\n", ...)` | Writes a line according to a format: `%-8s` and `%-11s` a text padded on the right with spaces up to 8, then 11 characters, `%d` an integer, `%s` a text |

Result obtained with `php test.php`:

```text
anonymous /article/1  403 Access denied
reader   /article/1  200 <article><h2>Hello</h2><p>One &lt;i&gt;word&lt;/i&gt;.</p></article>
author   /article/1  403 Access denied
admin    /article/1  200 <article><h2>Hello</h2><p>One &lt;i&gt;word&lt;/i&gt;.</p></article>
anonymous /preview/1  403 Access denied
reader   /preview/1  200 <article><h2>Hello</h2></article>
author   /preview/1  403 Access denied
admin    /preview/1  200 <article><h2>Hello</h2></article>
anonymous /article/2  403 Access denied
reader   /article/2  403 Access denied
author   /article/2  200 <article><h2>Idea in progress</h2><p>Not finished.</p></article>
admin    /article/2  200 <article><h2>Idea in progress</h2><p>Not finished.</p></article>
anonymous /article/3  403 Access denied
reader   /article/3  403 Access denied
author   /article/3  403 Access denied
admin    /article/3  403 Access denied
anonymous /article/99 404 Not found
reader   /article/99 404 Not found
author   /article/99 404 Not found
admin    /article/99 404 Not found
```

The same result, presented as a table (the `/preview/1` and `/article/1` lines differ only by their mode):

| Address | Anonymous | Reader | Author (no permission) | Administrator |
|---|---|---|---|---|
| `/article/1` (published) | 403 | 200 | 403 | 200 |
| `/preview/1` (published, preview mode) | 403 | 200 | 403 | 200 |
| `/article/2` (draft of the author) | 403 | 403 | 200 | 200 |
| `/article/3` (blocked) | 403 | 403 | 403 | 403 |
| `/article/99` (nonexistent) | 404 | 404 | 404 | 404 |

Three observations. The author sees their draft but not the published article (they do not have the general permission). The administrator sees everything except the blocked article: the veto of `BlockRule` wins. And the text `<i>word</i>` of the body is written as `&lt;i&gt;word&lt;/i&gt;`: the browser displays it as it is, without putting it in italics.

## `403` or `404`: what should the visitor learn?

The mini-example answers `403` (forbidden) for a refusal and `404` (not found) for an entity that does not exist. This choice has a consequence: a visitor can **guess** which numbers exist, since a draft answers `403` and an empty number answers `404`.

| Choice | What the visitor learns | When to use it |
|---|---|---|
| `403` for a refusal, `404` for absence | The number exists but is closed to them | The existence of the entity is not a secret (a published article of the site) |
| `404` in both cases | Nothing: the refusal and the absence are indistinguishable | Even the existence is sensitive (a medical record, a competitor's draft) |

In the mini-example, switching to the second choice takes one line in the router: return `[404, 'Not found']` instead of `[403, 'Access denied']`. The `403` status code is described in [authentication and authorization](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation); the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403) details its use.

## An example: how Drupal 11 implements this principle

> The Drupal API names in this section are checked against the Drupal 11.x source code; the reference is the [official documentation](https://www.drupal.org/docs/drupal-apis/entity-api).

Drupal calls an **entity type** the definition of a kind of data (an article, a user), and a **handler** an object attached to this type for one specific task. The **core** is the part of Drupal shared by all sites. The principle is that of the `EntityTypes` registry in the mini-example.

| Notion of the mini-example | Equivalent in Drupal |
|---|---|
| `EntityTypes` | The entity type manager, obtained with `\Drupal::entityTypeManager()` |
| `declare('article', [...])` | The definition of the entity type, in the header of its class (annotation, a special comment read by Drupal, or attribute `#[...]`, a native PHP 8 tag, depending on the version, see [the plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)), with a `handlers` key |
| `'render' => ArticleRenderBuilder` | The `view_builder` handler, by default the class `Drupal\Core\Entity\EntityViewBuilder` |
| `'access' => AccessManager` | The `access` handler, a class that extends `Drupal\Core\Entity\EntityAccessControlHandler` |
| `Access::Allowed`, `Forbidden`, `Neutral` | `AccessResult::allowed()`, `forbidden()`, `neutral()` |
| `orWith`, `andWith` | `orIf()`, `andIf()` on an access result |
| `full`, `preview` modes | Display mode (*view mode*): `full`, `teaser`, or a mode created by the site |
| Render array | *Render array*: PHP array whose properties (`#theme`, `#cache`...) start with `#` |
| Route `article.full` | Value `_entity_view: 'type.mode'` in the default values of the route |
| Right `article.view` | Requirement `_entity_access: 'type.view'` on the route |
| `EntityRouter` | The routing system of the core, with a generic controller for `_entity_view` |

### Declaring the handlers of the type

The `handlers` key of an entity type names one class per task. Only the content of the key is shown here: the syntax around it (annotation or attribute) depends on the version of Drupal.

```php
<?php

// content of the "handlers" key: a task => the class that handles it
$handlers = [
  // the render handler: the core class is often enough
  'view_builder' => 'Drupal\Core\Entity\EntityViewBuilder',
  // the access control handler: our class
  'access' => 'Drupal\exemple_articles\ArticleAccessControlHandler',
  // the route provider: it generates the standard routes of the type
  'route_provider' => [
    'html' => 'Drupal\Core\Entity\Routing\DefaultHtmlRouteProvider',
  ],
];
```

`exemple_articles` and `exemple_article` are names invented for this chapter: a module (a package of code that Drupal loads) of the same name would contain the entity type. An entity type that does not declare `view_builder` or `access` generally receives a default class from the core; the details depend on the type (content or configuration).

### The render builder

The render handler is obtained from the type manager, then renders a render array. The access control queries the entity directly.

```php
<?php

// $article is a loaded entity, $account the account of the visitor (obtained elsewhere)
// the render handler of the entity type, requested from the type manager
$builder = \Drupal::entityTypeManager()->getViewBuilder('exemple_article');
// the render array of this article in "teaser" (preview) mode
$renderArray = $builder->view($article, 'teaser');

// the access result for the "view" operation; TRUE asks for the object, not a boolean
$answer = $article->access('view', $account, TRUE);
// true only if the result is "allowed" (a "neutral" gives false)
$allowed = $answer->isAllowed();
```

| Call | Role |
|---|---|
| `getViewBuilder('exemple_article')` | Returns the render handler of the type |
| `view($entity, 'teaser')` | Returns the render array of **one** entity in a mode |
| `viewMultiple($entities, 'teaser')` | The same, for several entities at once |
| `$entity->access('view', $account, TRUE)` | Returns a result object (`TRUE` as third argument); without it, a simple boolean |
| `$result->isAllowed()` | True only for `allowed`: `neutral` gives false, like our `isAllowed()` |

One point deserves attention: in Drupal, the choice of the fields shown in each mode is not written in PHP as our `MODES` constant is. It is **configured** (by the administrator of the site, in a display configuration attached to the type and to the mode), and the render builder reads this configuration. The render array also contains **cache metadata** (under the `#cache` key). A **cache** is a copy of a result kept so as not to compute it again; this metadata says what the result depends on, which avoids rebuilding the page at each visit without serving it to the wrong visitor. This topic of caching is separate and is not detailed here.

The Drupal rendering engine relies on templates ([Twig](https://twig.symfony.com/doc/), a language for page templates) that escape the variables by default (the text is made harmless for HTML): it is the equivalent of our `htmlspecialchars`, applied automatically.

### The entity route

A route is declared in a configuration file of the module, in YAML (a settings file format made of keys and values, where indentation expresses nesting; specification on [yaml.org](https://yaml.org/)). Here is the spirit of an entity route:

```yaml
# name of the route: the entity type, then the "canonical" role (the page of the entity)
entity.exemple_article.canonical:
  # the address; {exemple_article} is the parameter, named like the entity type
  path: '/article/{exemple_article}'
  defaults:
    # displays the entity in the "full" mode (in its entirety)
    _entity_view: 'exemple_article.full'
  requirements:
    # requires the "view" operation to be allowed on this entity
    _entity_access: 'exemple_article.view'
```

| Key | Role |
|---|---|
| `path` | The address, with the parameter `{exemple_article}` named like the entity type |
| `defaults._entity_view` | "Displays the entity of this type in this mode": the core provides the **controller** (the code that answers the route) |
| `requirements._entity_access` | "Requires the `view` access to be allowed on this entity" |

The parameter `{exemple_article}`, an entity type name, is converted into an object by the parameter converter of the core, as in [route parameter conversion](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre): a nonexistent number normally gives a `404` before the access control is called. For the common entity types, Drupal can also **generate** this route from the `route_provider` key of the type, without writing it by hand.

### The access control manager

The manager extends the base class of the core and implements `checkAccess()`, which receives the entity, the operation (`'view'`, `'update'`, `'delete'`) and the account.

```php
<?php

// namespace (see OOP in PHP): the logical folder where the class lives
namespace Drupal\exemple_articles;

use Drupal\Core\Access\AccessResult;               // factory of access results
use Drupal\Core\Access\AccessResultInterface;      // the type of an access result
use Drupal\Core\Entity\EntityAccessControlHandler; // the base class provided by the core
use Drupal\Core\Entity\EntityInterface;            // the type of any entity
use Drupal\Core\Session\AccountInterface;          // the type of an account

// our access control handler: it inherits all the common work of the core
class ArticleAccessControlHandler extends EntityAccessControlHandler {

  // called by the core with the entity, the requested operation and the account
  protected function checkAccess(
    EntityInterface $entity,
    $operation,
    AccountInterface $account
  ): AccessResultInterface {
    if ($operation === 'view') {
      // allowed if the account has the permission, otherwise neutral (no opinion)
      return AccessResult::allowedIfHasPermission($account, 'view exemple articles');
    }
    return AccessResult::neutral(); // any other operation: no opinion
  }

}
```

| Element | Role |
|---|---|
| `AccessResult::allowedIfHasPermission($account, 'text')` | `allowed` if the account has the permission, otherwise `neutral` |
| `AccessResult::neutral()` | "No opinion": the default refusal applies if nobody says yes |
| `AccessResult::forbidden()` | Final veto |
| `checkAccess()` called by `access()` | The core calls it after consulting the hooks of the other modules, unless one of them forbids |
| Declaring the permissions | A file of the module (`*.permissions.yml`) lists the permissions that exist |

Other modules can give their opinion on any entity through **hooks** (see [inversion of control and extension points](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)): `hook_entity_access()` for all types, `hook_ENTITY_TYPE_access()` for one specific type. Their answers are combined with that of the manager, with logic of the same kind as `orWith` (the order is as follows: the hooks `hook_entity_access()` and `hook_ENTITY_TYPE_access()` are consulted first; if one of them forbids, `checkAccess()` is not called; otherwise its result is combined with theirs by `orIf()`): this is exactly the role of our `BlockRule`, an outside module that places a veto without knowing the rules of the articles.

### Where the pieces sit in the architecture

| Piece | Chapter that explains it |
|---|---|
| The handler registry is a **service** of the core, built by a container | [The service container](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services) |
| The entity types are discovered by the core (annotation or attribute) | [The plugin architecture](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| The access hooks of the other modules | [Inversion of control and extension points](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) |
| The manager receives its dependencies through its constructor | [OOP in PHP](/?c=langages&s=php&p=poo) |

In a class of your module, you **inject** the entity type manager through the constructor rather than calling `\Drupal::entityTypeManager()`: the static call makes the class hard to test (see [the service container](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services), section "Testing: replacing a service with a fake").

## Lists and queries: the other entry point

The access control of an entity page only protects that page. A list of articles, a search engine, a news feed or an application programming interface (API) can show the same data without going through the route.

| Entry point | Where to check the access |
|---|---|
| Page of the entity | The route (`_entity_access`) |
| List built in PHP | Call the access manager for **each** entity of the list (`$entity->access('view')` in Drupal) |
| Filtered [database](/?c=domain-specific-languages-dsl&p=sql) query | The query itself must apply the filter; in Drupal, an entity query asks for `->accessCheck(TRUE)` (or `FALSE` when we know why) |
| [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) output of an API | The same check as the page, before turning the data into JSON text |
| Preview mode in a page of another type | The same render handler, hence the same access control before it |

In our mini-example, the safeguard is to produce lists only from `AccessManager`: a function `listFor(Account $account)` would filter the articles with `isAllowed()` before passing them to the render builder in `preview` mode.

## Pitfalls

| Pitfall | Consequence | Safeguard |
|---|---|---|
| Checking access on the page but not in the list or the API | A draft appears in a list: broken access control | One single decision point (the manager), called by all the entry points |
| Treating `Neutral` as `Allowed` | An entity with no applicable rule becomes public | Deny by default: only `Allowed` opens |
| Treating `Neutral` as `Forbidden` when combining | A rule that has no opinion blocks the others: no outside module can open an access any more | Three distinct values; `orWith` lets a yes win over a silence |
| A veto that a yes can overwrite | An administrator sees a blocked article | `Forbidden` always wins in the combination |
| Writing HTML in the render builder or in the route | The design and the safety of the text get mixed, and another mode must copy everything | Builder: an array; engine: the HTML and the neutralization |
| Forgetting to neutralize the text of a field | XSS flaw (see [XSS in detail](/?c=securite&s=cybersecurite&p=xss-en-detail)) | The render engine neutralizes everything, with no exception field by field |
| Building the render before checking access | Wasted work, and side actions (database reads, log writes) for a refused visitor | First existence, then access, then render |
| Answering `403` when the existence is sensitive | The visitor guesses which numbers exist | Identical `404` for "absent" and "forbidden" |
| Caching a render without taking the visitor into account | A visitor receives the page prepared for another one, drafts included | State what the render depends on (the account, its permissions) in the cache metadata |
| Testing the rights only with an administrator account | All the refusals go unnoticed | One test per type of account: anonymous, reader, author, administrator |
| Replacing a core handler with an incomplete class | A core page calls a missing method | Extend the base class, and only redefine `checkAccess()` |

## Best practices

| Best practice | Reason |
|---|---|
| Three separate pieces: data, render, access | Each reason to change has its own file |
| A three-value access answer and a combination where the veto wins | Outside modules can forbid or allow without knowing each other |
| Deny by default | A forgotten rule closes the door instead of opening it |
| Go through the manager for each entry point (page, list, API) | A rule changed once applies everywhere |
| A render array, then an engine that writes the HTML | The text is neutralized in a single place, and the render can be tested without HTML |
| One display mode per use (page, list, preview) | The same object is presented in several ways without duplicating code |
| An entity route that designates a type, a mode and an operation | Adding an entity type does not require rewriting the router |
| Check existence, then right, then build | Nothing is produced for a refused visitor |
| Decide between `403` and `404` according to how sensitive the existence is | No information leaks about what exists |
| Test each rule with an account of each type | The refusal cases are checked, not only the happy paths |
| Inject the type manager rather than call it statically | The class can be tested with a fake manager |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | Displaying an entity answers three questions that are kept apart: which data (the entity), how to present it (the render builder, which produces a render array according to a display mode, then the render engine that writes the HTML), and whether the visitor is allowed (the access control manager). An entity route designates a type, a mode and an operation, without knowing the entity. An access rule answers allowed, forbidden or neutral; a forbidden always wins, and a final neutral refuses. In Drupal 11, these pieces are the `view_builder`, the route with `_entity_view` and `_entity_access`, and the access manager that returns `AccessResult` objects. |
| **Pitfalls to avoid** | Checking access only on the page and forgetting the lists and the APIs; treating a neutral as a yes; letting a yes overwrite a veto; putting HTML in the render builder; forgetting to neutralize the text; building the render before the check; revealing existence with a `403`; caching without taking the visitor into account; testing only with an administrator. |
| **Best practices** | A single access decision point; deny by default; a veto that wins; a render array, then an engine; one mode per use; existence, right, then render, in this order; `404` when the existence is sensitive; one test per type of account; injected handlers. |

To go further: the [documentation of the Drupal entity API](https://www.drupal.org/docs/drupal-apis/entity-api), that of the [routing system](https://www.drupal.org/docs/drupal-apis/routing-system), and the PHP manual on [enumerations](https://www.php.net/manual/en/language.enumerations.php).
