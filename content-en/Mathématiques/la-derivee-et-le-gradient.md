---
order: 5
---

# The Derivative and the Gradient

This chapter answers a question raised by [a function's curve](/?c=mathematiques&p=la-fonction-mathematique): how much does a function change at a given point, and in which direction? That's what the derivative measures, and then the gradient — its generalization to a function with several inputs.

## The slope: how fast a function changes

For a simple function like `f(x) = 2x + 1`, the **slope** between two points measures how much `f` changes, relative to a change in `x`:

```text
f(1) = 3
f(3) = 7

slope between x=1 and x=3 = (f(3) - f(1)) / (3 - 1) = (7 - 3) / 2 = 2
```

This function is a straight line: its slope equals 2 everywhere, whatever two points are chosen. This is no longer true for a function whose curve isn't a straight line, as we'll see next.

## The derivative: the slope at one exact point

For a curve (for example `f(x) = x²`), the slope is no longer constant — it depends on the point observed. To find the slope **exactly at one point**, the slope is computed between that point and another one, moved closer and closer:

```text
f(x) = x²

Around x = 2:
f(2)      = 4
f(2.1)    = 4.41      -> slope between 2 and 2.1   : (4.41 - 4) / 0.1     = 4.1
f(2.01)   = 4.0401    -> slope between 2 and 2.01  : (4.0401 - 4) / 0.01  = 4.01
f(2.001)  = 4.004001  -> slope between 2 and 2.001 : (4.004001 - 4) / 0.001 = 4.001
```

The smaller the gap gets, the closer the computed slope gets to **4** — this is the **derivative** of `f` at the point `x = 2`, written `f'(2) = 4`. For `f(x) = x²`, this derivative equals `2x` at every point (a known result, which can be checked here: `2 × 2 = 4`).

## The sign of the derivative indicates direction

| Sign of `f'(x)` | Behavior of the function at that point |
|---|---|
| Positive | The function is increasing |
| Negative | The function is decreasing |
| Zero | The function is momentarily flat (a peak, a dip, or a plateau) |

```text
f(x)
  |  \                                /
  |   \                              /
  |    \          dip              /
  |     \_____  (derivative = 0) _/
  |           \_________________/
  |     f' < 0     f'=0      f' > 0
  +------------------------------------ x
```

## Descending a curve: moving in the direction opposite the derivative

If the goal is to find the lowest point of a curve (its minimum), and only the slope at the current point is known, moving in the direction **opposite** the sign of that slope gets you closer to the minimum:

```text
f(x) = x²   (minimum at x = 0)

Starting point: x = 3         f'(x) = 2x = 6
new x = x - 0.1 × f'(x) = 3 - 0.1 × 6 = 2.4

x = 2.4     f'(x) = 4.8    new x = 2.4 - 0.1 × 4.8   = 1.92
x = 1.92    x'(x) = 3.84   new x = 1.92 - 0.1 × 3.84  = 1.536
...                        -> gradually gets closer to x = 0
```

The `0.1` controls the size of each step — too large a step can overshoot the minimum, too small a step makes the descent very slow. This method (moving opposite the derivative, step after step) is called **gradient descent**.

> **Pitfall:** a curve can have several dips (several local minima). This method only guarantees finding the dip closest to the starting point, not necessarily the lowest of them all.
>
> **Best practice:** keep in mind that a minimum found this way is local, not necessarily the best possible one — trying several different starting points is a common way to limit this risk.

## The gradient: the derivative of a function with several inputs

For a function with several inputs (see [the mathematical function](/?c=mathematiques&p=la-fonction-mathematique)), the **gradient** generalizes the derivative: it's a [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) that contains, for each input, its own **partial derivative** — how much the function changes if only that one input moves, all others held fixed.

```text
f(x, y) = x² + y²

partial derivative with respect to x (y treated as a constant): 2x
partial derivative with respect to y (x treated as a constant): 2y

gradient of f at point (3, 4) = [2×3, 2×4] = [6, 8]
```

The gradient points in the direction where the function **increases** fastest. Moving in the opposite direction (subtracting the gradient, component by component — see [adding vectors](/?c=mathematiques&p=vecteurs-et-produit-scalaire)) therefore decreases the function as fast as possible, exactly the same logic as for a single input, applied to each component of the vector:

```text
new_vector = old_vector - rate × gradient
```

## Key takeaways

| | |
|---|---|
| **Key takeaways** | The derivative measures a function's slope at one exact point (its sign shows whether the function is increasing, decreasing, or momentarily flat). The gradient generalizes the derivative to a function with several inputs: a vector of partial derivatives, pointing toward the direction of steepest increase. |
| **Tools you can use** | No manual computation in practice: deep learning libraries compute derivatives and gradients automatically (see [automatic differentiation](/?c=ia&p=entrainement-descente-de-gradient)). |
| **Pitfalls to avoid** | Confusing "a minimum found" with "the lowest possible minimum" — a curve with several dips only guarantees the dip closest to the starting point. |
| **Best practices** | Try several different starting points to limit the risk of getting stuck on an unsatisfying local minimum. |
