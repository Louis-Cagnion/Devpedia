---
order: 9
---

# Latin Squares and Uniform Sampling with a Markov Chain

To test a program, you often need examples **drawn at random uniformly**: every possible example must have exactly the same chance of coming out (see [Basic Probability](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base)). For some objects, this is surprisingly hard. This chapter takes the example of Latin squares, used by puzzles such as Sudoku or Skyscraper.

## The Latin Square

A **Latin square** of order n is an n × n grid filled with n symbols, each **exactly once per row and per column**:

```
1 2 3 4
2 1 4 3
3 4 1 2
4 3 2 1
```

Their number explodes (sequence [A002860](https://oeis.org/A002860) of the On-Line Encyclopedia of Integer Sequences):

| n | Number of Latin squares |
|---|---|
| 3 | 12 |
| 4 | 576 |
| 5 | 161,280 |
| 6 | 812,851,200 |

The values up to n = 5 were checked here by complete enumeration.

## The Shuffling Trap: Isotopy

A naive way to "draw a random square": start from the **cyclic square** (each row shifted by one step), then randomly shuffle its rows, columns and symbols.

```
cyclic square         after swapping rows 1 and 3, then symbols 1 and 4
1 2 3 4               3 1 4 2
2 3 4 1               2 3 1 4
3 4 1 2               4 2 3 1
4 1 2 3               1 4 2 3
```

Two squares that can be turned into each other by these permutations are **isotopic**. The problem: not every Latin square is isotopic to the cyclic square. Checked on 4 × 4:

| 4 × 4 squares | Number | Share |
|---|---|---|
| Isotopic to the cyclic square (reachable by shuffling) | 432 | 75% |
| The others (including the one at the start of the chapter) | 144 | 25% |
| Total | 576 | 100% |

Shuffling therefore **never** produces a quarter of the 4 × 4 squares, and the unreachable share grows with n. A test bench built this way only tests one particular family of grids: its measurements can be misleading.

## The Markov Chain: a Random Walk

A **Markov chain** is a sequence of states where the next state is drawn at random **depending only on the current state**, not on the path taken before. Example with the weather:

| Today | Tomorrow: sun | Tomorrow: rain |
|---|---|---|
| Sun | 0.8 | 0.2 |
| Rain | 0.4 | 0.6 |

If the chain runs for a long time, the frequency of each state settles (here, 2 sunny days out of 3), whatever the starting point: this is the **stationary distribution**.

The idea of **MCMC** (*Markov Chain Monte Carlo*): to draw at random an object that is hard to build directly, you design a random walk between these objects whose stationary distribution is **uniform**. After enough steps, the current state is an (almost) uniform draw.

## The Jacobson-Matthews Chain

Jacobson and Matthews (1996) built such a chain for Latin squares. A square is seen as a **cube** of n × n × n cells `m[row][column][symbol]`, which is 1 if cell (row, column) contains that symbol, 0 otherwise.

| Step | What happens |
|---|---|
| Pick a corner | A cube cell at 0, at random |
| Form a small cube | With the three cells at 1 aligned with it (same column and symbol, same row and symbol, same row and column), it defines a 2 × 2 × 2 sub-cube |
| Change its 8 corners | +1 on four corners, −1 on the other four, alternately: every line of the cube keeps the same sum |
| "Improper" square | If a corner drops to −1, the square is temporarily **improper**; the next step must start from that cell to repair it |

Jacobson and Matthews proved that, looking only at proper squares, this chain has a uniform stationary distribution.

## Where to Read the Draw: a Measured Pitfall

After the planned steps, the chain may be on an improper square. Tempting solution: keep going until the first proper square, and return it. This is **wrong**: stopping at the first "correct" state is not the same as looking at the chain at a fixed time. You must either reject the draw or run a full new block of steps.

```python
# excerpt: cube_of_cyclic_square, one_step and square_from_cube are assumed to exist
def draw_square(n, rng, steps):
    m = cube_of_cyclic_square(n)                     # starting point
    improper = None
    while True:
        for _ in range(steps):                       # a full block of steps
            improper = one_step(m, n, rng, improper) # returns the -1 cell, or None
        if improper is None:                         # read at the end of a block, never before
            return square_from_cube(m, n)
```

Measured over 5,760 draws of 4 × 4 squares (each square should come out about 10 times):

| Method | Squares not isotopic to the cyclic one (expected: 25%) | Most drawn square |
|---|---|---|
| Keep going until the first proper square (64, 256 or 1,024 steps) | 8% | 24 times |
| Run a full new block if the square is improper (64 steps) | 25.5% | 21 times |

The bias does not shrink when the number of steps grows: it comes from **where** the result is read, not from a lack of mixing. The right check is to compare the frequencies obtained with the expected ones on a small size where everything can be counted.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Latin square contains each symbol once per row and per column. Shuffling the cyclic square only yields its isotopes (75% of 4 × 4 squares). The Jacobson-Matthews chain allows a uniform draw, provided the result is read at a fixed time. |
| **Tools you can use** | Markov chains and MCMC; representing a Latin square as an incidence cube; the Jacobson-Matthews chain; comparing frequencies by enumeration on a small size. |
| **Pitfalls to avoid** | Generating test data by simply shuffling a single model; returning the first "correct" state of a chain instead of the state at a fixed time. |
| **Best practices** | Check a generator's uniformity on a size where every object can be counted; vary the source of a test bench's data. |
