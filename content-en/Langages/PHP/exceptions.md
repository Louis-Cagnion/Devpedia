---
order: 9
---

# Exceptions

A classic PHP function signals an error by returning a special value (`false`, `null`) or raising a warning, which the calling code must remember to check explicitly on every call. **Exceptions** offer a different mechanism: an error **interrupts** the normal flow of code immediately and propagates automatically until a block set up to handle it catches it, with no manual check needed at any intermediate step.

## `try` / `catch`: catching an error

```php
<?php
function divide(float $a, float $b): float
{
    if ($b === 0.0) {
        throw new DivisionByZeroError("Division by zero");
    }
    return $a / $b;
}

try {
    echo divide(10, 0);
} catch (DivisionByZeroError $e) {
    echo "Error: " . $e->getMessage();  // "Error: Division by zero"
}
```

- `throw` raises an exception: it immediately interrupts the current function, without executing the rest of its code.
- `try` delimits the code being watched; `catch` receives the exception if one is raised inside the `try` block, with a specific type (here `DivisionByZeroError`) that determines which exceptions this block catches.
- `$e->getMessage()` returns the message attached to the exception, provided at `throw` time.

> **Pitfall:** forgetting that an exception caught by no `try`/`catch` at all (at any level of the call chain) crashes the entire script, with a fatal error shown to the user. A `throw` with no safety net anywhere in the program isn't error handling, just a delayed crash.
>
> **Best practice:** catch an exception where the program can actually react to it (show a clear message, retry, log it), not necessarily as close as possible to the `throw`.

## `Exception` vs `Error`: two families under `Throwable`

PHP distinguishes two broad families of objects that can be thrown and caught, both implementing the **`Throwable`** interface:

| | `Exception` | `Error` |
|---|---|---|
| Typical origin | Explicitly thrown by business code (`throw new ...`) | Thrown by PHP itself for a programming error (invalid type, missing method) |
| Example | `InvalidArgumentException`, a custom business exception | `TypeError`, `DivisionByZeroError`, `ArgumentCountError` |
| Usual meaning | An abnormal but foreseeable situation (invalid data, unavailable resource) | A bug in the code itself, discovered at runtime |

```php
<?php
try {
    strlen();  // call without the required parameter
} catch (ArgumentCountError $e) {
    echo "Programming error: " . $e->getMessage();
}
```

> **Pitfall:** writing `catch (Exception $e)` thinking it catches every possible error. A `TypeError` or a `DivisionByZeroError` is **not** an `Exception`: they're `Error`, a distinct branch of `Throwable`. This `catch` lets them slip through uncaught.
>
> **Best practice:** only catch `Throwable` when the code genuinely needs to react to any possible error (a global entry point that logs everything before crashing cleanly, for example); everywhere else in the code, target the specific exception type actually expected, so a programming error that deserves to be seen and fixed is never masked.

## Multiple `catch` blocks: most specific to most general

A `try` can be followed by several `catch` blocks, each targeting a different type; PHP runs the **first** one whose type matches, in the order they're written:

```php
<?php
try {
    processOrder($data);
} catch (InsufficientStockException $e) {
    echo "Insufficient stock: " . $e->getMessage();
} catch (PaymentDeclinedException $e) {
    echo "Payment declined: " . $e->getMessage();
} catch (Exception $e) {
    echo "Unexpected error: " . $e->getMessage();
}
```

> **Pitfall:** placing a general `catch` (`Exception $e`) **before** a more specific `catch` (`InsufficientStockException $e`, which inherits from `Exception`). The general block then catches everything, including the cases the specific block was meant to handle first: that block never runs.
>
> **Best practice:** always order `catch` blocks from the most specific type to the most general, never the other way around.

## `finally`: running code in every case

A `finally` block, placed after the last `catch`, always runs, whether or not an exception was thrown, and even if the matching `catch` itself throws a new exception:

```php
<?php
$connection = openConnection();
try {
    runQuery($connection);
} catch (QueryFailedException $e) {
    echo "Query failed: " . $e->getMessage();
} finally {
    closeConnection($connection);  // always runs: success, failure, or re-throw
}
```

> **Pitfall:** releasing a resource (connection, open file) only at the end of the `try` block, after the code that can fail. If an exception interrupts the block before reaching that line, the resource stays open indefinitely.
>
> **Best practice:** put any resource release in a `finally` block, never only at the end of `try`, to guarantee it runs even when an error occurs.

## Creating a custom exception

Extending `Exception` (or a more specific subclass) lets you create an error type specific to the application's business logic, with its own associated data:

```php
<?php
class InsufficientStockException extends Exception
{
    public function __construct(
        private string $product,
        private int $quantityRequested,
        private int $quantityAvailable
    ) {
        parent::__construct(
            "Insufficient stock for {$product}: {$quantityRequested} requested, {$quantityAvailable} available"
        );
    }

    public function getProduct(): string
    {
        return $this->product;
    }
}

throw new InsufficientStockException("Keyboard", 5, 2);
```

`parent::__construct(...)` passes the message to `Exception`'s constructor (see [inheritance and classes](/?c=langages-de-programmation&s=php&p=poo), already covered): the custom exception remains a genuine `Exception`, catchable as such, while carrying extra data specific to the business case (`getProduct()`).

> **Best practice:** create a custom exception as soon as a caller needs to react differently depending on the precise error type (see the previous section on multiple `catch` blocks), rather than lumping everything under a generic `Exception` and parsing its text message to guess the cause.

## Chaining exceptions: don't lose the original cause

Re-throwing a new exception from a `catch` block can lose track of the original error, unless it's explicitly passed through `Exception`'s fourth constructor parameter:

```php
<?php
try {
    $data = json_decode($apiResponse, flags: JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new ApiUnavailableException("Invalid API response", previous: $e);
}
```

```php
<?php
try {
    callApi();
} catch (ApiUnavailableException $e) {
    echo $e->getMessage();               // "Invalid API response"
    echo $e->getPrevious()->getMessage(); // "Syntax error" (the original JSON error)
}
```

> **Pitfall:** re-throwing a new exception without passing the original exception as `previous`. The real cause of the problem (here, malformed JSON) disappears, leaving only the new exception's generic message: much harder debugging, especially in production where the original error is visible in no log.
>
> **Best practice:** always pass the caught exception via `previous` when re-throwing a new one, to keep a complete trace of the cause-and-effect chain.

See also [Object-Oriented Programming](/?c=langages-de-programmation&s=php&p=poo) for the class inheritance reused here, and [Security](/?c=langages-de-programmation&s=php&p=securite) for what should never show up in an exception message displayed to the user (sensitive data, implementation details).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | `throw` interrupts the normal flow; `try`/`catch` catches an exception by type, `finally` always runs. `Exception` (business errors) and `Error` (programming errors) are two distinct branches of `Throwable`. A custom exception extends `Exception`; `previous` chains a new exception to its original cause. |
| **Tools you can use** | `try`/`catch`/`finally`/`throw`, `getMessage()`/`getCode()`/`getPrevious()`, `extends Exception` for a clean business error type. |
| **Pitfalls to avoid** | A `throw` never caught by any `try`/`catch`. `catch (Exception $e)` thinking it also catches `Error`. A general `catch` placed before a specific one. Releasing a resource only at the end of `try` without `finally`. Re-throwing an exception without passing `previous`. |
| **Best practices** | Catch where the program can actually react. Only use `Throwable` for a global entry point. Order `catch` blocks from most specific to most general. Always release a resource in a `finally`. Create a custom exception as soon as a caller must react differently depending on the error type. Always chain via `previous` when re-throwing. |
