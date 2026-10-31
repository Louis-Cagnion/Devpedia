---
order: 13
---

# The built-in Node test runner: node:test (31/10/2026)

**Node.js** ([nodejs.org](https://nodejs.org)) is the program that runs JavaScript outside a browser, directly from the terminal. It ships with a built-in **test runner**: a tool that finds the test files, runs them, compares the results with the expected values and prints a report. It is called `node:test` and needs no extra installation. Its official documentation is [the node:test page of Node.js](https://nodejs.org/api/test.html).

This chapter complements [unit tests](/?c=tests&p=tests-unitaires), which explain what a good test is, and [end-to-end tests](/?c=tests&p=tests-end-to-end), which simulate a complete journey. The chapter on [the headless browser](/?c=tests&p=tests-navigateur-sans-fenetre) wrote its own small runner by hand: `node:test` provides all of that ready-made (report, exit code, filters), and can very well serve as the basis for that kind of series. It assumes you already know [the terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type commands), [a code editor](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions), [errors](/?c=langages&s=javascript&p=gestion-des-erreurs) (`throw`, `try`, `catch`) and [asynchronous programming](/?c=langages&s=javascript&p=asynchrone) (`async`, `await`, promises).

The date in the title is the verification date: all the examples were run that day, and some options (coverage in particular) may change from one Node version to another.

## The principle: one command, one report, one exit code

```text
  *.test.mjs files            node --test                     terminal
 ┌───────────────────┐   ┌───────────────────────┐   ┌─────────────────────────┐
 │ test("...", ...)  │-->│ 1. finds the files    │-->│ ✔ test passed           │
 │ test("...", ...)  │   │ 2. runs each test     │   │ ✖ test failed + details │
 └───────────────────┘   │ 3. counts the results │   │ summary: pass / fail    │
                         └───────────┬───────────┘   └─────────────────────────┘
                                     v
                          exit code: 0 or 1
```

A **test** is a small function that sets up a situation, calls the code to check, and compares the result with the expected one. A test passes if it raises no error, and fails if it raises one. The **exit code** is the number that a program returns when it ends: `0` means "all is well", any other value signals a failure. That number, and only that number, is what a script or a continuous integration server reads to decide whether the tests passed.

| Need | What `node:test` provides | Equivalent to install elsewhere |
|---|---|---|
| Declare tests | `test`, `describe`, `it` | Jest, Mocha, Vitest |
| Compare values | `node:assert/strict` (shipped with Node) | Chai, Jest's `expect` |
| Prepare and clean up | `before`, `after`, `beforeEach`, `afterEach` | the same names elsewhere |
| Replace a function | `mock.fn`, `mock.method` | `jest.fn`, Sinon |
| Measure coverage | option `--experimental-test-coverage` | nyc, c8 |
| Choose the report format | option `--test-reporter` | reporter plugins |

## Preparing a folder and a first module

Create an empty folder, open a terminal in it and create the file below. A **module** is a JavaScript file that makes tools available to other files: `export` makes a function visible from outside, `import` fetches the one of another file. The `.mjs` extension tells Node that the file uses this syntax, without any other setting. The tested function computes a price after a discount and rejects an absurd percentage.

```javascript
// remise.mjs
// Computes the price after discount; rejects a percentage out of 0 to 100
export function calculateDiscount(price, percentage) {
    if (percentage < 0 || percentage > 100) {         // impossible percentage
        throw new RangeError("percentage out of 0 to 100");   // named RangeError error
    }
    return price * (1 - percentage / 100);              // 10 %: price * 0.9
}
```

## A first test

The following file imports `test` from `node:test` (the `node:` prefix marks a tool shipped with Node, as opposed to a file of your own), the comparison tool `assert` (from the English verb "to assert"), then the function to test. An **assertion** is a statement that something is true; if it is false, it raises an error and the test fails. The `node:assert/strict` module adds the **strict** mode: `1` and `"1"` are considered different there, which avoids unpleasant surprises.

```javascript
// remise.test.mjs
import test from "node:test";                     // the test function, provided by Node
import assert from "node:assert/strict";          // the assertions, in strict mode
import { calculateDiscount } from "./remise.mjs"; // the function to check

// Arrange: the values are written in the call; Act: we call calculateDiscount;
// Assert: equal compares the obtained result (1st argument) to the expected one (2nd)
test("10 % discount on 100 gives 90", () => {
    assert.equal(calculateDiscount(100, 10), 90);
});
```

The Arrange / Act / Assert structure (prepare, act, verify) is detailed in the chapter on [unit tests](/?c=tests&p=tests-unitaires). Then run:

```bash
# checks the syntax of both files, without running anything
node --check remise.mjs
node --check remise.test.mjs
# runs all the tests of the current folder
node --test
# prints the exit code of the previous command
echo $?
```

Observed output in a terminal (the durations vary from one run to another):

```text
✔ 10 % discount on 100 gives 90 (0.517131ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 43.865271
```

The exit code printed by `echo $?` was `0`. The `ℹ` lines form the summary: `pass` counts the passes, `fail` the failures, `skipped` the skipped tests, `todo` the tests marked "to do".

## How Node finds the test files

`node --test` without a file name explores the current folder and its subfolders. It does not run every JavaScript file, only those whose name follows a convention. This table comes from real trials: five files placed side by side, only one of them was not found.

| File | Found by `node --test`? | Why |
|---|---|---|
| `remise.test.mjs` | yes | the name ends with `.test` |
| `mon-test.mjs` | yes | the name ends with `-test` |
| `test/a.mjs` | yes | any file in a folder named `test` |
| `b.spec.mjs` | no | `.spec` is not recognized by default |
| `remise.mjs` | no | it is not a test file (it is only imported) |

To run a specific file, even if its name is not a recognized one, give its path: `node --test b.spec.mjs` runs it (observed).

## When a test fails

Let's replace the expected value with a deliberately false one (20 % of 50 is 40, not 35):

```javascript
// echec.test.mjs
import test from "node:test";                     // the test function
import assert from "node:assert/strict";          // the strict assertions
import { calculateDiscount } from "./remise.mjs"; // the function to check

test("20 % discount on 50 gives 35 (deliberately wrong)", () => {
    assert.equal(calculateDiscount(50, 20), 35);    // 40 is obtained, 35 is expected: failure
});
```

Observed output (start of the details; the rest is a list of Node's internal calls, the "call stack", which shows where the error originated):

```text
✖ 20 % discount on 50 gives 35 (deliberately wrong) (0.952109ms)
ℹ tests 1
ℹ fail 1
✖ failing tests:

test at echec.test.mjs:5:1
✖ 20 % discount on 50 gives 35 (deliberately wrong) (0.952109ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  40 !== 35
```

Node's message is in English: `Expected values to be strictly equal` means "the values should be strictly equal". The line `40 !== 35` gives the obtained value on the left and the expected value on the right. The exit code was `1`: that is what makes a continuous integration server "turn red".

## Organizing: `test`, `describe` and `it`

`describe` (to describe) groups tests into a **suite** (a named group); `it` (it should) declares a test inside it. `it` and `test` do exactly the same job: `describe` and `it` read like a sentence ("describe calculateDiscount: it applies 10 % to 100").

| Function | Role | Reading example |
|---|---|---|
| `test(name, function)` | declares a single test | "test: 10 % discount on 100 gives 90" |
| `it(name, function)` | declares a test, like `test` | "it applies 10 % to 100" |
| `describe(name, function)` | groups tests into a suite | "describe calculateDiscount" |
| `it(name, { skip: "reason" }, f)` | skips the test and shows the reason | "not written yet" |
| `it(name, { todo: "reason" }, f)` | marks "to do": it runs, but does not count as a pass | "to finish" |

Here is a complete suite, with the edge cases (zero, one hundred, forbidden values) seen in [unit tests](/?c=tests&p=tests-unitaires). Replace the content of `remise.test.mjs`:

```javascript
// remise.test.mjs
import { describe, it } from "node:test";         // describe groups, it declares a test
import assert from "node:assert/strict";          // the strict assertions
import { calculateDiscount } from "./remise.mjs"; // the function to check

describe("calculateDiscount", () => {             // the suite is named after the function
    it("applies 10 % to 100", () => {
        assert.equal(calculateDiscount(100, 10), 90);       // normal case
    });

    it("changes nothing with 0 %", () => {
        assert.equal(calculateDiscount(80, 0), 80);         // lower limit
    });

    it("returns 0 with 100 %", () => {
        assert.equal(calculateDiscount(80, 100), 0);        // upper limit
    });

    it("rejects a negative percentage", () => {
        // throws expects an error; RangeError specifies which one
        assert.throws(() => calculateDiscount(80, -5), RangeError);
    });

    it("rejects a percentage above 100", () => {
        assert.throws(
            () => calculateDiscount(80, 101),                    // the call that must fail
            { name: "RangeError", message: "percentage out of 0 to 100" },   // exact error
        );
    });
});
```

Observed output: `describe` displays a title `▶ calculateDiscount`, the five tests indented with `✔`, and the summary `tests 5`, `suites 1`, `pass 5`, `fail 0`.

## The assertions of `node:assert/strict`

Each assertion compares values and raises an error if the comparison is false. All those in the table have been run.

| Assertion | Checks | Example that passes |
|---|---|---|
| `equal(a, b)` | `a` and `b` are strictly equal (numbers, texts) | `assert.equal(1 + 1, 2)` |
| `notEqual(a, b)` | `a` and `b` are different | `assert.notEqual(1, "1")` |
| `ok(value)` | the value is "truthy" | `assert.ok("text".includes("ex"))` |
| `deepEqual(a, b)` | two objects or lists have the same **content** | `assert.deepEqual({ a: 1 }, { a: 1 })` |
| `match(text, pattern)` | the text matches a [regular expression](/?c=langages&s=javascript&p=regex) | `assert.match("ref-042", /^ref-\d+$/)` |
| `throws(function, error)` | the call raises the expected error | `assert.throws(() => JSON.parse("{"), SyntaxError)` |
| `rejects(promise, error)` | the promise fails with the expected error | see the next section |

Two subtleties, checked by running them. `assert.equal({ a: 1 }, { a: 1 })` **fails**: two distinct objects are two different "boxes" even when their content is identical, and `equal` compares the boxes. To compare the content, use `deepEqual`. And `deepEqual` in strict mode distinguishes `[1]` from `["1"]`. The full list is in the [node:assert documentation](https://nodejs.org/api/assert.html).

## Testing asynchronous code

An **asynchronous** operation returns its result later (reading a file, a network call): it returns a **promise**, an object that represents this future result (see [asynchronous programming](/?c=langages&s=javascript&p=asynchrone)). If the function of a test is declared `async`, Node waits for it to finish before judging the test. First, create the code to test:

```javascript
// utilisateurs.mjs
// Looks up a user; the "database" here is a simple object in memory
const DATABASE = { 1: "Ada", 2: "Linus" };        // number -> name

export async function findName(id) {
    await new Promise((resolve) => setTimeout(resolve, 10));   // simulates 10 ms of waiting
    if (!(id in DATABASE)) {                          // number missing from the database
        throw new Error(`user ${id} not found`);      // in async: the promise is rejected
    }
    return DATABASE[id];                              // the name found
}
```

```javascript
// asynchrone.test.mjs
import test from "node:test";                     // the test function
import assert from "node:assert/strict";          // the strict assertions
import { findName } from "./utilisateurs.mjs";    // the async function to check

test("finds Ada", async () => {                   // async: Node waits for the end of the test
    const name = await findName(1);               // await: we wait for the real result
    assert.equal(name, "Ada");                    // then we compare it
});

test("reports an unknown user", async () => {
    // rejects checks that a promise fails; the await is essential
    await assert.rejects(findName(99), { message: "user 99 not found" });
});
```

Observed output: the two tests display `✔` (about 11 ms each, the time of the simulated wait) and the summary gives `pass 2`.

## Preparing and cleaning up: the hooks

A **hook** is a function that the runner calls automatically at a precise moment, to avoid copying the same preparation into every test. The following file tests a small shopping cart, with a fresh cart before each test:

```javascript
// panier.mjs
// A shopping cart: a list of items with a total
export class Cart {
    items = [];                                       // the list of { name, price }

    add(name, price) {
        this.items.push({ name, price });             // adds an item at the end
    }

    get total() {                                     // read as cart.total, without ()
        return this.items.reduce((sum, item) => sum + item.price, 0);
    }

    get size() {                                      // number of items
        return this.items.length;
    }
}
```

```javascript
// hooks.test.mjs
import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";          // the strict assertions
import { Cart } from "./panier.mjs";              // the class to check

describe("Cart", () => {
    let cart;                                     // will be recreated before each test

    before(() => console.log("[before] once, before all tests"));
    after(() => console.log("[after] once, after all tests"));
    beforeEach(() => {
        cart = new Cart();                        // a fresh cart for each test
        console.log("[beforeEach] fresh cart");
    });
    afterEach(() => console.log("[afterEach] cleanup"));

    it("starts empty", () => {
        assert.equal(cart.size, 0);               // no items at the start
    });

    it("adds up the prices", () => {
        cart.add("pen", 2);                       // 2
        cart.add("notebook", 5);                  // 5
        assert.equal(cart.total, 7);              // 2 + 5
    });

    it("keeps nothing from the previous test", () => {
        assert.equal(cart.size, 0);               // the previous test's cart is gone
    });
});
```

| Hook | When it is called | Typical use |
|---|---|---|
| `before` | once, before the first test of the suite | opening an expensive resource (connection, temporary file) |
| `beforeEach` | before each test | recreating a fresh object (the cart) |
| `afterEach` | after each test | erasing what the test left behind |
| `after` | once, after the last test | closing the resource opened by `before` |

Observed output: the 8 lines `[before]`, `[beforeEach]`, `[afterEach]`, `[after]` appear in the expected order (one `before`, then three times the `beforeEach` and `afterEach` pair, then one `after`), but **before** the tree of `✔`, because the `spec` report prints as a block at the end of the suite. The three tests passed.

## Replacing a dependency with a spy function

A **mock** is a fake component that replaces a real one; a **spy function** (*spy*) is a mock that merely records how it was called. The chapter on [mocks, stubs and fakes](/?c=tests&p=mocks-stubs-et-fakes-en-detail) explains their families and the pitfall of over-simulation. Here, `mock.fn()` creates the spy: the function `remind` receives `send` as an argument, and we give it a fake that sends nothing, so no email, no network.

```javascript
// mock.test.mjs
import { describe, it, mock } from "node:test";   // mock provides the spy functions
import assert from "node:assert/strict";          // the strict assertions

// Sends a reminder to each latecomer through the "send" function received as an argument
function remind(latecomers, send) {
    for (const person of latecomers) {            // one message per person
        send(person.email, `Hello ${person.name}, please return the book.`);
    }
    return latecomers.length;                     // number of messages sent
}

describe("remind", () => {
    it("sends one message per latecomer, without network", () => {
        const send = mock.fn();                   // spy: does nothing, records everything
        const list = [
            { name: "Ada", email: "ada@example.org" },
            { name: "Linus", email: "linus@example.org" },
        ];

        const total = remind(list, send);         // we pass the spy in place of the real one

        assert.equal(total, 2);                   // two people, two messages
        assert.equal(send.mock.callCount(), 2);   // the spy was called twice
        assert.deepEqual(send.mock.calls[0].arguments, [   // arguments of the 1st call
            "ada@example.org",
            "Hello Ada, please return the book.",
        ]);
    });

    it("can return a chosen value", () => {
        const say = mock.fn(() => "hello");       // mock.fn accepts a replacement
        assert.equal(say(), "hello");             // the replacement answers
        assert.equal(say.mock.callCount(), 1);    // and the spy counted the call
    });

    it("replaces fetch to avoid the network", async (t) => {
        // fetch is the Node function that sends a request over the network;
        // t.mock replaces it for the duration of this test only
        t.mock.method(globalThis, "fetch", async () => ({
            ok: true,                             // fake successful response
            json: async () => ({ name: "Ada" }),  // fake reading of the content
        }));

        const response = await fetch("https://exemple.invalid/api");   // dummy address
        const data = await response.json();       // reads the fake response

        assert.equal(data.name, "Ada");           // content of the fake response
        assert.equal(fetch.mock.callCount(), 1);  // only one call took place
    });
});

it("fetch is restored after the test", () => {
    assert.equal(fetch.mock, undefined);          // no more spy: the real fetch is back
});
```

| Tool | What it does | Cleanup |
|---|---|---|
| `mock.fn()` | creates a spy function, with or without a replacement | nothing to restore: it is a new function |
| `mock.method(object, "name", replacement)` | replaces an existing method | by hand: `mock.restoreAll()` |
| `t.mock.method(...)` | same, attached to the test `t` | automatic at the end of the test |
| `spy.mock.callCount()` | number of calls | not applicable |
| `spy.mock.calls[i].arguments` | list of the arguments of the i-th call | not applicable |

Observed output: the four tests passed, including the last one, which proves that `t.mock` did restore the real `fetch`. The address `exemple.invalid` does not exist: if the replacement had failed, the test would raise a network error instead of passing.

## Running only some tests

| Option or setting | Effect | Observed |
|---|---|---|
| `node --test file.test.mjs` | runs only this file | yes |
| `--test-name-pattern="addition"` | runs only the tests whose name contains `addition` (a [regular expression](/?c=langages&s=javascript&p=regex) pattern) | yes: 1 test out of 4 |
| `--test-name-pattern="^math"` | targets a whole suite by its name | yes: the 4 tests of the suite |
| `{ only: true }` + `--test-only` | runs only the tests marked `only` | yes: `one` runs, `two` does not |
| `{ skip: "reason" }` | skips a test and shows the reason | yes: symbol `﹣` |
| `{ todo: "reason" }` | marks "to do" without counting as a pass | yes: counted in `todo` |

Order pitfall: within a file, the tests run in the order they are written, but a filter skips some of them. A test that relies on the state left by an earlier one can therefore pass or fail depending on the filter (see [Pitfalls](#pitfalls)).

## Choosing the report format and reading the exit code

A **report** (*reporter*) is the format in which the runner writes its results. The option `--test-reporter=<name>` chooses it. Observed: in a terminal, the default format is `spec` (readable, with `✔` and `✖`); when the output is redirected to a file or to another program, the default format is `tap`.

| Report | Look | Use |
|---|---|---|
| `spec` | tree with `✔` and `✖`, summary at the end | reading by a human in the terminal |
| `tap` | lines `ok 1 - name` and `not ok 1 - name`, indented details | reading by a program |
| `dot` | one dot per passing test (`.....` observed for 4 tests) | very long suites |

**TAP** (*Test Anything Protocol*, "a protocol to test anything") is a simple text format, understood by many continuous integration tools. Observed excerpt from `node --test --test-reporter=tap`:

```text
TAP version 13
# Subtest: math
ok 1 - math
1..1
# tests 4
# suites 1
# pass 2
# fail 0
# cancelled 0
# skipped 1
# todo 1
```

| Situation | Observed exit code |
|---|---|
| all tests pass | `0` |
| at least one test fails | `1` |
| coverage threshold not reached | `1` |

In a script, `node --test && echo "green"` prints "green" only if the code is `0`. In a `package.json` (the file that describes a Node project), the line `"test": "node --test"` in the `scripts` section then lets you run `npm test`; this command was not run for this chapter.

## Measuring coverage

The [code coverage](/?c=tests&p=couverture-de-code) measures the share of code executed during the tests. Node can compute it without an external tool, with the option `--experimental-test-coverage` (the word "experimental" signals that its behavior may change: this is why the chapter is dated). With only the `10 % discount on 100` test of the previous section and the `calculateDiscount` function, observed:

```bash
# runs the tests and adds a coverage table at the end of the report
node --test --experimental-test-coverage
```

```text
ℹ start of coverage report
ℹ ----------------------------------------------------------------
ℹ file            | line % | branch % | funcs % | uncovered lines
ℹ ----------------------------------------------------------------
ℹ remise.mjs      |  71.43 |    66.67 |  100.00 | 4-5
ℹ remise.test.mjs | 100.00 |   100.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ all files       |  85.71 |    80.00 |  100.00 |
ℹ ----------------------------------------------------------------
ℹ end of coverage report
```

| Column | Meaning in this example |
|---|---|
| `line %` | share of executed lines: 71.43 % for `remise.mjs` |
| `branch %` | share of paths (both sides of an `if`) taken |
| `funcs %` | share of functions called at least once |
| `uncovered lines` | lines never executed: `4-5` is the `throw` for the forbidden percentage |

The test file itself appears in the table (100 %): it skews the `all files` average. The option `--test-coverage-lines=90` sets a minimum: with 85.71 %, Node printed `85.71% line coverage does not meet threshold of 90%` and returned the code `1`; with `--test-coverage-lines=50`, the code was `0`. The options `--test-coverage-branches` and `--test-coverage-functions` also exist (listed by `node --help`, not tried). A reminder from the chapter on coverage: a high percentage proves that the lines were executed, not that they were verified.

## Pitfalls

Each pitfall below was reproduced.

| Pitfall | What happened | Alternative |
|---|---|---|
| **Test without assertion** | a test that computes `2 + 2` without comparing anything shows `✔` and the exit code is `0`: it can never fail | one assertion per behavior; make the test fail on purpose to check that it can fail |
| **`await` forgotten before `assert.rejects`** | the test shows `✔` although the promise did not reject; Node then reports an activity after the end of the test and marks the **file** as failed (code `1`) | write `await assert.rejects(...)`; do not rely on this safety net, whose message names the file and not the faulty line |
| **`await` forgotten on a value** | `assert.equal(findName(1), "Grace")` compares a pending promise to a text: the test fails, with `Promise { <pending> }` in the message | `await findName(1)` before comparing |
| **Code running after the end of the test** | a `setTimeout` that fails 50 ms later leaves its test at `✔`; Node displays a warning message and marks the **file** as failed (code `1`) | wait for the end of the operation in the test (`await`) |
| **State shared between tests** | a cart created only once for the whole suite keeps the pen from the first test: the second one (`starts empty`) fails (`1 !== 0`); run alone with `--test-name-pattern`, it passes | recreate the object in `beforeEach` |
| **File not found** | `b.spec.mjs` is not run by `node --test` without a file name | name the file `.test.mjs` or place it in `test/` |
| **Comparing two objects with `equal`** | `assert.equal({ a: 1 }, { a: 1 })` fails: they are two distinct objects | `deepEqual` |

## Best practices

| Do | Why |
|---|---|
| Import `node:assert/strict`, never `node:assert` alone | strict mode prevents `1` and `"1"` from being judged equal |
| Name each test after the behavior it checks | the report becomes readable without opening the code (see [unit tests](/?c=tests&p=tests-unitaires)) |
| Write `async` and `await` everywhere the tested code is asynchronous | Node only waits for what you ask it to wait for |
| Recreate whatever is modified in `beforeEach` | each test becomes independent of the order and the filters |
| Use `t.mock` rather than `mock` to replace a global method | the cleanup is automatic, even if the test fails |
| Make a test fail on purpose before trusting it | a test that cannot fail proves nothing |
| Run `node --test` in continuous integration and read its exit code | `0` or `1` is enough to decide whether the project is healthy |
| Keep the built-in runner for Node code, a browser runner for the interface | see [the headless browser](/?c=tests&p=tests-navigateur-sans-fenetre) |

## Key Takeaways

| | |
|---|---|
| **Key takeaway** | `node:test` is the test runner shipped with Node: `node --test` finds the `*.test.mjs` files (or `*-test.mjs`, or those of a `test` folder), runs each test, displays a summary and returns the code `0` (success) or `1` (failure). |
| **Tools you can use** | `test`, `describe`, `it` to declare; `node:assert/strict` to compare; `before`, `beforeEach`, `afterEach`, `after` to prepare and clean up; `mock.fn` and `t.mock.method` to replace a dependency without network; `--test-name-pattern`, `--test-only`, `--test-reporter` and `--experimental-test-coverage` to filter, format and measure. |
| **Pitfalls to avoid** | a test without assertion (always green); a forgotten `await` (green by mistake, or misleading message); state shared between tests (result depending on the order); `equal` between two objects; a test file with an unrecognized name. |
| **Best practices** | strict assertions; one behavior per test, clearly named; `beforeEach` to start from a fresh state; `await` before any asynchronous operation; replacements limited to the test; check that a test can fail; leave the decision to continuous integration through the exit code. |
