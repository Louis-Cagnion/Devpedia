---
order: 9
---

# The Game Loop with SFML (28/10/2026)

A video game is a program that, several dozen times per second, reads what the player does, moves its world forward, then redraws everything. This repetition is called the **game loop**. This chapter builds it step by step with **SFML** (*Simple and Fast Multimedia Library*), a [library](/?c=langages&s=c&p=bibliotheques) (already-written code that you reuse) for the [C++](/?c=langages&s=cpp&p=cpp) language that provides the essentials of a 2D game: a window, drawing images and shapes, reading the keyboard and the mouse, and sound.

The chapter assumes you already know [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [conditions](/?c=langages&s=c&p=conditions), [loops](/?c=langages&s=c&p=boucles), [classes and objects](/?c=langages&s=cpp&p=classes-et-objets) and [namespaces](/?c=langages&s=cpp&p=espaces-de-noms) in C++. To open an OpenGL window without SFML, see [GLFW, GLAD and the render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu): the loop is the same there, SFML only hides the details.

> **Version:** all the code in this chapter is written for **SFML 2** (version 2.6.1 as of 28/10/2026, [official documentation](https://www.sfml-dev.org/documentation/2.6.1/)). SFML 3 changed some class and function names: the code below does not compile as is with it.

## Installing SFML and compiling

SFML is split into **modules**, independent pieces that you link to the program according to its needs:

| Module | Content | Link option |
|---|---|---|
| System | time (stopwatch), vectors | `-lsfml-system` |
| Window | window, events, keyboard, mouse | `-lsfml-window` |
| Graphics | drawing shapes, images and text | `-lsfml-graphics` |
| Audio | sounds and music | `-lsfml-audio` |
| Network | network communication | `-lsfml-network` |

On Debian and Ubuntu, the development package is installed from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) with `sudo apt install libsfml-dev`; other systems have their equivalent (see the [installation page](https://www.sfml-dev.org/tutorials/2.6/start-linux.php) of the official site). The program is then compiled with `g++`, the C++ compiler of GCC (see [compilation](/?c=langages&s=c&p=compilation)):

```bash
# -std=c++17: language version; -o game: name of the executable produced
# -Wall -Wextra: display the compiler warnings
# -l<name>: links the library libsfml-<name> (Graphics, Window, System modules)
g++ -std=c++17 -Wall -Wextra game.cpp -o game -lsfml-graphics -lsfml-window -lsfml-system
./game    # runs the program
```

## Without a loop, the program ends right away

A C++ program executes the lines of `main` from top to bottom, then stops. Here is the smallest SFML program: it opens a window, draws, then ends.

```cpp
#include <SFML/Graphics.hpp>   // SFML header: window, drawing, time

int main()   // entry point: the program starts here
{
    // sf:: is the SFML namespace; RenderWindow is a window you draw in
    // VideoMode(800, 600): 800 pixels wide, 600 high (one pixel: one point on screen)
    sf::RenderWindow window(sf::VideoMode(800, 600), "My game loop");
    window.clear(sf::Color::Black);   // fills the whole window with black
    window.display();                 // shows the image that was just drawn
    return 0;   // end of main: the window is destroyed, the program stops
}
```

The `#include` line copies a header file into the program (see [`#include` and headers](/?c=langages&s=c&p=headers)): without it, the compiler does not know `sf::RenderWindow`. A **window** is a rectangle that the operating system displays and that the user can move and close. Here, it appears for a few milliseconds (one thousandth of a second) then disappears: nothing stops `main` from reaching its last line. You need a loop that **gives back control only once the window is closed**.

## One turn of the loop

Here are the words used in what follows:

| Term | Definition |
|---|---|
| **Game loop** (*game loop*) | Code repeated endlessly while the game runs; each repetition is a **turn** |
| **Image** (*frame*) | What is displayed at the end of a turn: one turn produces one image |
| **Delta time** (*dt*) | Duration, in seconds, elapsed since the previous turn; explained in detail in [the GLFW chapter](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#delta-time-a-speed-that-does-not-depend-on-the-machine) |
| **Event** (*event*) | Signal sent by the system when something happens: key pressed, click, window closed |
| **Game state** (*game state*) | All the data that describes the game at one moment: positions, score, lives, level |

A turn always chains the same four steps, in this order:

```text
              +-------------------------------------------------+
   start      | 1. TIME         dt = duration of previous turn  |
   of a turn  |                       |                         |
   ---------->|                       v                         |
              | 2. EVENTS       read keyboard, mouse, closing   |
              |                       |                         |
              |                       v                         |
              | 3. UPDATE       advance the state with dt       |
              |                       |                         |
              |                       v                         |
              | 4. DRAW         clear, draw, display            |
              +-----------------------|-------------------------+
                                      |
                  window still open? yes: back to the start
                                      |
                                      no: end of program
```

| Step | Question it answers | SFML 2 tool |
|---|---|---|
| 1. Time | How much time has passed since the last turn? | `sf::Clock`, `restart()` |
| 2. Events | What does the player want to do? Did they close the window? | `pollEvent`, `sf::Event` |
| 3. Update | Where are things now? | game code, using `dt` |
| 4. Draw | What does the world look like now? | `clear`, `draw`, `display` |

The update **changes the state** without drawing anything; the drawing **reads the state** without changing it. This separation lets you change one without touching the other.

## A first loop: the window that stays open

Before adding time and update, here is the loop reduced to its essentials: events and drawing.

```cpp
#include <SFML/Graphics.hpp>   // SFML header

int main()
{
    sf::RenderWindow window(sf::VideoMode(800, 600), "My game loop");

    // isOpen() is true as long as the window has not been closed: this is the game loop
    while (window.isOpen()) {
        sf::Event event;   // an empty slot to receive an event (type sf::Event)
        // pollEvent stores the oldest pending event in "event" and returns true;
        // it returns false when there are no more: the while empties the whole queue
        while (window.pollEvent(event)) {
            if (event.type == sf::Event::Closed)   // the user clicked the close button
                window.close();                    // closes the window: isOpen() is false
        }
        window.clear(sf::Color::Black);   // erases the previous image
        window.display();                 // shows the new image
    }
    return 0;   // reached only once the window is closed
}
```

An **event** does not reach the code directly: the system drops it into a **queue** (a list from which items are taken out in arrival order). Several events can pile up in it during a turn (a key pressed, the mouse moved): hence the `while` around `pollEvent` rather than a simple `if`. This way of reading, "look whether something is there, then continue even if the queue is empty", is called **polling** ("querying").

## The `Game::run` structure

A real game groups the loop and the state in a [class](/?c=langages&s=cpp&p=classes-et-objets), often named `Game`, whose `run` function contains the loop. Each step of the turn becomes a function:

| Function | Step | Role |
|---|---|---|
| `run()` | 1 | Measures `dt`, then calls the other three in order, as long as the window is open |
| `processEvents()` | 2 | Empties the event queue (closing, Escape key) |
| `update(float dt)` | 3 | Advances the game state by `dt` seconds |
| `render()` | 4 | Draws the state and displays it |

The complete program: a green square that the arrow keys move.

```cpp
#include <SFML/Graphics.hpp>   // SFML header

// A class groups the game state and the functions that make it live
class Game {
public:   // what can be used from outside the class
    // Constructor: called when a Game is created; after ":", the initializer list
    // builds each member (in the order they are declared below)
    Game()
        : window(sf::VideoMode(800, 600), "My game loop"),
          player(sf::Vector2f(50.f, 50.f))   // 50 x 50 pixel square; 50.f is a float
    {
        window.setFramerateLimit(60);   // cap of 60 frames per second (see below)
        player.setFillColor(sf::Color::Green);   // fill color of the square
        player.setPosition(375.f, 275.f);    // top left corner, to center the square
    }

    void run()   // void: the function returns nothing
    {
        sf::Clock clock;   // stopwatch; it starts when created
        while (window.isOpen()) {   // one loop turn per frame
            // restart() resets the stopwatch to zero and returns the time elapsed since the
            // last start, in a sf::Time; asSeconds() converts it to seconds
            float dt = clock.restart().asSeconds();
            processEvents();   // step 2: the events
            update(dt);        // step 3: the game state
            render();          // step 4: the image
        }
    }

private:   // what can only be used from inside the class
    void processEvents()
    {
        sf::Event event;
        while (window.pollEvent(event)) {   // empties the queue, as above
            if (event.type == sf::Event::Closed)   // click on the window's close button
                window.close();
            // && : "and"; KeyPressed: a key has just been pressed
            if (event.type == sf::Event::KeyPressed
                && event.key.code == sf::Keyboard::Escape)   // the Escape key
                window.close();
        }
    }

    void update(float dt)   // dt: seconds elapsed since the previous turn
    {
        const float speed = 200.f;   // const: will not change; 200 pixels per second
        // sf::Vector2f: a vector of two floats, x (horizontal) and y (vertical)
        sf::Vector2f direction(0.f, 0.f);   // wanted direction; (0, 0): none
        // isKeyPressed is true as long as the key is held down, at the moment of the call
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
            direction.x -= 1.f;   // to the left: x decreases
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
            direction.x += 1.f;   // to the right: x increases
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
            direction.y -= 1.f;   // upward: y decreases (the y axis points down in SFML)
        if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
            direction.y += 1.f;   // downward: y increases
        player.move(direction * speed * dt);   // moves by direction x speed x dt
    }

    void render()
    {
        window.clear(sf::Color::Black);   // erases the previous image
        window.draw(player);              // draws the square at its current position
        window.display();                 // shows the finished image
    }

    sf::RenderWindow window;     // the window (declared first, built first)
    sf::RectangleShape player;   // the player's square: a rectangular shape
};

int main()
{
    Game game;     // builds the game: the window opens
    game.run();    // the loop runs until the window is closed
    return 0;
}
```

The SFML 2 landmarks to know in order to read this code:

| Element | What it is |
|---|---|
| `sf::RenderWindow` | The window **to draw on**: it can also read events (`pollEvent`) and close itself (`close`) |
| `sf::Event` | An event; its `type` field says which one (`Closed`, `KeyPressed`...), and `key.code` gives the key of a `KeyPressed` |
| `sf::Clock` | A stopwatch; `restart()` resets it to zero **and** returns the time elapsed since its last start |
| `sf::Time` | A duration; `asSeconds()` gives it in seconds (`float`), `asMilliseconds()` in milliseconds |
| `window.clear(color)` | Fills the whole drawing area with a color, to erase the previous image |
| `window.draw(object)` | Draws an object into an **invisible** area (the back buffer, see the next line), not yet on screen |
| `window.display()` | Swaps the two buffers: the finished image becomes visible. This is [double buffering](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#double-buffering-avoiding-a-half-drawn-image) (the drawing is done in an invisible buffer, swapped in one go with the one displayed), the role of `glfwSwapBuffers` |

Two ways of reading the keyboard coexist, for two different needs:

| | `KeyPressed` event | `isKeyPressed` state |
|---|---|---|
| Where | In `processEvents`, through `pollEvent` | In `update`, every turn |
| When | Once when the key is pressed, then repeated by the system if the key is held (`setKeyRepeatEnabled(false)` removes the repetition) | Every turn, true as long as the key is held down |
| Suited to | A one-off action: quit, pause, shoot once | A continuous movement: walk, turn |

## Speed: pixels per second, multiplied by the delta time

In `update`, `player.move(direction * speed * dt)` moves the square by `200 x dt` pixels. The speed is expressed in **pixels per second**, not in pixels per frame. The principle (and its fixed-step trap) is explained in [the GLFW chapter](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#delta-time-a-speed-that-does-not-depend-on-the-machine); here are only the figures for a speed of 200 pixels per second, compared with a fixed step of 5 pixels per frame (values computed by a test program):

| Machine | `dt` | Movement per frame (200 x `dt`) | After 1 second | Fixed step of 5 px per frame after 1 s |
|---|---|---|---|---|
| 60 frames per second | 1 / 60 = 0.0167 s | 3.33 px | 60 x 3.33 = **200 px** | 60 x 5 = 300 px |
| 30 frames per second | 1 / 30 = 0.0333 s | 6.67 px | 30 x 6.67 = **200 px** | 30 x 5 = 150 px |

Each frame advances less when there are more of them, but the total per second stays 200: the player sees no difference in speed between the two machines, except in smoothness.

> **Pitfall (integer versus float):** a **float** (`float`) is a floating-point number; an **integer** (`int`) has no decimal part and **truncates** (removes the decimal part: 3.33 becomes 3). With integers, the speed drifts or stops. At 60 frames per second, `static_cast<int>(200 * dt)` (which converts the number to an integer, see [C++ casts](/?c=langages&s=cpp&p=cast-cpp)) is 3: after one second the square has only moved 180 pixels instead of 200. At 144 frames per second and 50 pixels per second, the step is 0.347 px, truncated to 0: **the square never moves**. Likewise, `float dt = 1 / 60;` gives 0, because dividing two integers gives an integer: write `1.f / 60`. Keep `dt`, the speed and the position as `float`.

> **Pitfall (huge delta time):** after a pause (the program suspended, a breakpoint in the debugger), or on some systems when the user moves the window (the loop can freeze for the whole move), the next `dt` can be several seconds. For a 3-second pause, the square jumps by 200 x 3 = **600 pixels** at once, off the screen. We **cap** `dt`: beyond the cap, the game slows down for one frame instead of jumping. With a cap of 0.1 s, the jump falls to 200 x 0.1 = 20 pixels.

```cpp
float dt = clock.restart().asSeconds();   // duration of the previous turn, in seconds
if (dt > 0.1f)   // more than 0.1 s: a pause occurred (fewer than 10 frames per second)
    dt = 0.1f;   // we cap it: the game acts as if only 0.1 s had elapsed
```

> **Pitfall (clock created too early):** `sf::Clock` starts when it is created. Created in the constructor of `Game`, it also counts the time taken to load the window: the first `dt` would be too large. So we create it just before the loop, as in `run()`. One stopwatch must also not serve two purposes: see [one timer per purpose](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#one-timer-per-purpose).

## Diagonal movement: normalization

In the program above, pressing two arrow keys at once (right and down) adds the two directions. A [vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) is a list of numbers treated as a single thing, here the pair `(x, y)`; the wanted direction is therefore `(1, 0) + (0, 1) = (1, 1)`. Its length (its **norm**, see [the norm of a vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#the-norm-of-a-vector-its-length)) is computed with the Pythagorean theorem: the **square root** (the number that, multiplied by itself, gives back the starting number) of the sum of the squares of the components.

```text
length((1, 0)) = sqrt(1 x 1 + 0 x 0) = sqrt(1) = 1
length((1, 1)) = sqrt(1 x 1 + 1 x 1) = sqrt(2) = 1.4142... about 1.41
```

The square moving diagonally therefore covers, each second, 1.41 times the distance of a straight move. Measured over one second at 60 frames per second, speed 200:

| Keys | Direction | Length of the direction | Distance covered in 1 s |
|---|---|---|---|
| Right only | `(1, 0)` | 1 | 200 px |
| Right + Down, without correction | `(1, 1)` | 1.41 | **282.84 px** (200 on x and 200 on y) |
| Right + Down, **normalized** | `(0.7071, 0.7071)` | 1 | 200 px (141.42 on each axis) |
| Left + Right | `(0, 0)` | 0 | 0 px |

**Normalizing** a vector (see [the chapter on vectors](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire#the-norm-of-a-vector-its-length)) means dividing each of its components by its length: the direction stays the same, the length becomes exactly 1. Here, `(1 / 1.41, 1 / 1.41) = (0.7071, 0.7071)`, of length `sqrt(0.7071² + 0.7071²) = sqrt(1) = 1`. We normalize the direction **before** multiplying it by the speed.

The last row of the table is the trap: left and right pressed together cancel each other out, the direction is the **zero vector** `(0, 0)`, of length 0. Normalizing means dividing by 0: the result is **NaN** (*Not a Number*, the value produced by `0 / 0`); a position that becomes NaN stays NaN, because any calculation with NaN gives NaN, and the square **disappears from the screen** for good. Hence a guard: we never normalize a zero vector.

```cpp
#include <cmath>   // header of the C++ math functions: std::sqrt
// ... the rest of Game is unchanged; only the update function is replaced:

void update(float dt)
{
    const float speed = 200.f;   // pixels per second
    sf::Vector2f direction(0.f, 0.f);
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Left))
        direction.x -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Right))
        direction.x += 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Up))
        direction.y -= 1.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::Down))
        direction.y += 1.f;

    // std::sqrt computes the square root; the length is that of the Pythagorean theorem
    float length = std::sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0.f) {   // GUARD: never divide by a zero length
        direction /= length;   // normalizes: each component is divided by the length
        player.move(direction * speed * dt);   // speed x dt, in the normalized direction
    }
}
```

Measured with a small test program written for this chapter (without SFML): without the guard, `(0, 0)` normalized gives `(nan, nan)` (the displayed sign varies from one machine to another); with the guard, the result stays `(0, 0)`.

## A long operation in one turn freezes the game

Events are only read at step 2 of **each** turn. A turn that lasts 2 seconds leaves the player without a response for 2 seconds: no key is handled, the window is no longer redrawn, and the system may display "not responding" and offer to close the program. The time available per turn depends on the targeted frame rate:

| Targeted frames per second | Time available per turn (1000 ms / frames) |
|---|---|
| 30 | 33.33 ms (a millisecond, ms, is one thousandth of a second) |
| 60 | 16.67 ms |
| 144 | 6.94 ms |

An update slower than this budget lowers the frame rate: at 50 ms per turn, the game runs at 20 frames per second. Two remedies:

| Remedy | Principle |
|---|---|
| **Split the work** | Do a small slice per turn (one level out of ten loaded at each frame), so that each turn stays within the budget |
| **Hand off to another thread** (*thread*) | A **thread** is a second flow of execution of the program, advancing at the same time as the first (see [threads](/?c=langages&s=c&p=threads)): the heavy computation runs there while the loop keeps turning; in exchange, the two threads must not modify the same data at the same time |

```cpp
// Bad: all the loading in a single turn, the window is frozen for 2 seconds
void update(float dt)
{
    loadAllLevels();   // placeholder function, very long
}

// Better: one slice per turn; loaded and total are two integers of the class
void update(float dt)
{
    if (loaded < total)           // there is still work left
        loadOneLevel(loaded++);   // placeholder function: loads one level, moves to the next
}
```

## Without a frame cap, the loop consumes the whole processor

Nothing in the loop forces it to wait: it chains turns as fast as possible, thousands of frames per second, almost none of which is visible (a screen only shows 60 or 144 frames per second). A **core** of the processor (one of the independent computing units it is made of) then runs at 100% for nothing: the computer heats up, the fan speeds up, the battery drains. Two settings exist in SFML 2:

| Setting | Effect | Note |
|---|---|---|
| None | Maximum rate, one core at 100% | To avoid, except to measure performance |
| `window.setFramerateLimit(60)` | After each `display()`, the program sleeps just long enough not to exceed 60 frames per second | Simple setting; the actual rate is approximate |
| `window.setVerticalSyncEnabled(true)` | `display()` waits for the screen's next refresh: see [vertical synchronization](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#vertical-synchronization-vsync) | Avoids *tearing* (image cut in two, see double buffering); the driver can disable it |

The SFML documentation advises against enabling both at the same time. Neither of the two sets the game's **speed**: only the delta time does, because the actual rate varies from one machine to another.

## The order of the steps matters

The four steps are not interchangeable. Each swap produces a specific defect:

| Wrong order | Symptom |
|---|---|
| `clear` **after** `draw` (before `display`) | Empty screen: the drawing is erased before it is displayed |
| `display` **before** `draw` | The displayed image is one turn late, sometimes flickering |
| `render` **before** `update` | What is drawn is the state from before the update: one turn late |
| `update` **before** `processEvents` | The player's orders are only taken into account on the next turn: one extra frame of latency |

The reference order: time, events, update, then `clear`, `draw`, `display`.

## The alternative: the event-driven loop

Instead of querying the queue at every turn (*polling*), the program can **sleep** until an event arrives: this is a **blocking wait** (the program is suspended and uses almost nothing as long as nothing happens). SFML 2 offers it with `waitEvent`, which blocks until an event arrives and then returns it:

```cpp
// To place in the Game class, next to run(): a loop that reacts, without dt
void runEventDriven()
{
    render();           // a first draw, before the first wait
    sf::Event event;
    // waitEvent puts the program to sleep until an event arrives, then stores it in
    // "event"; it returns false on error, which stops the loop
    while (window.isOpen() && window.waitEvent(event)) {
        if (event.type == sf::Event::Closed)   // click on the close button
            window.close();
        if (event.type == sf::Event::KeyPressed
            && event.key.code == sf::Keyboard::Right)
            player.move(10.f, 0.f);   // a fixed step of 10 pixels per press
        render();                     // we only redraw after an event
    }
}
```

Here, **nothing moves without an event**: the square advances one step per press, never on its own. No `dt` is needed: the movement is tied to the event, not to time. An action game needs the opposite (the enemies keep moving even when the player does nothing).

| | Continuous loop (`pollEvent`) | Event-driven loop (`waitEvent`) |
|---|---|---|
| Principle | One turn after another, without waiting | The program sleeps until the next event |
| Computation at rest | Constant: a full turn per frame, even with nothing to do | Almost nil: the processor is free |
| If the player does nothing | The world keeps moving (enemies, falling, animations) | Nothing moves |
| Delta time | Essential | Not needed for movement |
| Frame cap | Necessary | Useless: the rhythm comes from the events |
| Suited to | Action games, simulations, animations | Editors, turn-based games (chess, cards), tools |
| Main pitfall | Loop too greedy, or frozen by a long computation | Animation impossible, since nothing wakes the loop |

The two loops can be combined: an editing application waits for events as long as the user does nothing, and switches to a continuous loop for the duration of an animation.

## Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| No loop | The window appears then disappears at once | `while (window.isOpen())` around the turn |
| A long operation in one turn | Window frozen, "not responding" | Split the work or hand it to another thread of execution |
| No frame cap | One core at 100%, noisy fan | `setFramerateLimit(60)` **or** `setVerticalSyncEnabled(true)`, not both |
| Wrong order of the steps | Empty screen, late images, latency | Time, events, update, `clear`, `draw`, `display` |
| Huge `dt` after a pause or a window move | The square jumps several hundred pixels | Cap `dt` (for example at 0.1 s) |
| Forgetting `window.clear()` | Each frame is painted over the previous ones: trails, smeared image | Erase at the start of each render |
| Reading a continuous movement in `KeyPressed` | One step per press, then a pause, then jerky steps (the system's repetition) | `isKeyPressed` in `update` for a continuous movement; `KeyPressed` for one-off actions |
| Believing that `isKeyPressed` depends on the window | It reads the keyboard at every instant: the square moves even if the user types in another window | Take keys into account only if `window.hasFocus()` is true (the window is the one receiving the keyboard: the *focus*) |
| Integers in the speed or in `dt` | Speed too low, even zero; `1 / 60` is 0 | Everything in `float`; write `1.f / 60` |
| Adding up keys without normalizing | Diagonal 1.41 times faster | Normalize the direction |
| Normalizing a zero vector | Division by 0, NaN, square gone | Test `length > 0.f` before dividing |
| One timer for two purposes | Wrong `dt` | One `sf::Clock` per purpose |

## Best practices

| Best practice | Why |
|---|---|
| One function per step (`processEvents`, `update`, `render`) | Each step can be read, tested and modified on its own |
| `update` does not draw, `render` does not modify the state | The state stays consistent; the display can change without touching the game rules |
| All speeds in units per second, multiplied by `dt` | Same speed on all machines |
| Cap `dt` | A pause no longer teleports objects |
| A frame cap (`setFramerateLimit` or vsync) | The processor is not wasted |
| Normalize the direction, with a guard against the zero vector | Same speed in every direction, never NaN |
| Event for one-off actions, `isKeyPressed` for continuous movements | Each need uses the tool that suits it |
| Keep `update` short; split or hand off the heavy computations | The window stays responsive |
| Choose the loop according to the program: continuous for a world that lives on its own, event-driven for a tool | A continuous loop without a reason wastes the battery |

To go further: the [official tutorial on events](https://www.sfml-dev.org/tutorials/2.6/window-events.php) (`pollEvent`, `waitEvent`, event types), the page of [`sf::Clock`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Clock.php) (the stopwatch and `restart()`), the page of [`sf::Keyboard`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Keyboard.php) (`isKeyPressed` and key names) and the page of [`sf::Window`](https://www.sfml-dev.org/documentation/2.6.1/classsf_1_1Window.php) (`setFramerateLimit`, `setVerticalSyncEnabled`, `hasFocus`).

## Key Takeaways

| To remember | Detail |
|---|---|
| Without a loop, the program ends | `main` stops at its last line: the window disappears at once |
| A turn = four steps, in this order | Time (`dt`), events, state update, drawing (`clear`, `draw`, `display`) |
| `Game::run` | The `while (window.isOpen())` loop calls `processEvents`, `update(dt)` and `render`; `dt = clock.restart().asSeconds()` |
| Speed | In pixels per second, multiplied by `dt`: 200 px/s gives 3.33 px per frame at 60 frames per second and 6.67 px at 30, that is 200 px in both cases |
| Diagonal | `(1, 1)` has length sqrt(2), about 1.41: the movement goes 1.41 times faster; we normalize (division by the length) |
| Zero vector | Never normalized: `length > 0.f` before the division, otherwise NaN |
| Continuous loop versus event-driven loop | `pollEvent` (the world moves on its own, constant cost) versus `waitEvent` (almost no computation at rest, but nothing moves without an event) |
| Limits | A long operation freezes the game; without a frame cap the loop consumes a whole core; the order of the steps matters |
| Pitfalls of `dt` | Cap after a pause; everything in `float`; one clock per purpose |
| Do not confuse | `KeyPressed` event (one-off) and `isKeyPressed` (continuous state) |
