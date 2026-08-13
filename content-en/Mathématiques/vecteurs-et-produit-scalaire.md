---
order: 2
---

# Vectors and the Dot Product

A single number is enough to represent one isolated piece of information (see [the variable](/?c=bases-de-l-informatique&p=la-variable)). But often, several numbers together describe a single thing — a position, a customer's characteristics. That's what a **vector** represents.

A vector is an ordered list of numbers, treated as a single entity.

```text
Position of a point on a plane:  [3, 5]
                                   |  |
                                   |  second coordinate (height, y)
                                   first coordinate (width, x)
```

```vecteurs
vecteurs: (3, 5)
label: The vector [3, 5]
```

> **Analogy:** a shopping list where the order has a precise meaning (2 kg of apples, then 3 baguettes) — swapping the order would change what each number represents, not just their position in the list.

> **Pitfall:** thinking the order of components is interchangeable. `[3, 5]` and `[5, 3]` don't describe the same point: the first component always plays the same role (here, horizontal position), regardless of its value.
>
> **Best practice:** document what each position of a vector represents as soon as it's created (a comment, an explicit variable name) — nothing in the numbers themselves recalls what they mean.

## A vector can have far more than two numbers

Nothing limits a vector to two components:

```text
A customer:  [age, salary, tenure] = [34, 42000, 5]
```

Each extra component adds a **dimension**. A 3-component vector can still be represented in space (like a point in 3D), but a vector with 100 or 1000 components — the common case in artificial intelligence for representing a word or an image — can no longer be drawn, though the math keeps working exactly the same way.

## Adding two vectors

```text
[1, 2] + [3, 4] = [1+3, 2+4] = [4, 6]
```

```vecteurs
vecteurs: (1, 2), (3, 4), (4, 6)
label: [1, 2] + [3, 4] = [4, 6]
```

Components are added one by one, at the same position.

> **Pitfall:** adding two vectors of different sizes makes no sense (`[1, 2] + [1, 2, 3]` isn't defined — which component would go with which?). A program that attempts the operation generally raises an explicit error (e.g. *"shapes mismatch"* with [NumPy](/?c=data-science&p=numpy)) rather than guessing.
>
> **Best practice:** check that two vectors have the same dimension before combining them, rather than discovering the mismatch at runtime.

## The dot product: reducing two vectors to a single number

The **dot product** of two vectors of the same dimension multiplies their components one by one, then adds up all these products:

```text
[1, 2, 3] . [4, 5, 6] = (1×4) + (2×5) + (3×6) = 4 + 10 + 18 = 32
```

Unlike addition, the result isn't a vector but a **single number** — hence the name "dot" (or "scalar") product.

This number measures how much two vectors point in the same direction:

| Dot product result | Interpretation |
|---|---|
| Large and positive | The two vectors broadly point in the same direction |
| Close to zero | The two vectors have no overall directional relationship |
| Negative | The two vectors broadly point in opposite directions |

> **Best practice:** this same operation (multiply term by term, then add) comes up in many later computations, in particular for combining several inputs into a single value by giving each a **weight** — a number reflecting its relative importance in the final result (a high-weight input contributes more to the sum than a low-weight one). The result is then called a **weighted** sum. Recognizing this operation in this form avoids rediscovering it every time under a different name.

## The norm of a vector: its length

A 2-component vector like `[3, 4]` can be read as a point on a plane (see this chapter's very first example), reached starting from a point common to every vector: the **origin**, the point `[0, 0]`. A vector's **norm** is the distance between the origin and this point — the most direct path, in a straight line, not the sum of the two right-angle distances traveled (`3 + 4 = 7` would be wrong):

```text
        (3,4)
          /|
         / |
    5   /  | 4   <- second component of the vector: vertical distance from the origin
       /   |
      /____|
    (0,0)  3     <- first component of the vector: horizontal distance from the origin
   origin
```

The direct path (the diagonal, length 5) is always shorter than the right-angle path (3 then 4, i.e. 7) — this is exactly what the norm formula computes, coming from the Pythagorean theorem: the square root of the sum of the squares of each component.

```text
norm([3, 4]) = sqrt(3² + 4²) = sqrt(9 + 16) = sqrt(25) = 5
```

Dividing each component of a vector by its own norm **normalizes** it: its direction stays the same, but its length becomes exactly 1.

```text
[3, 4] has a norm of 5 (computed above)

Normalized vector = [3/5, 4/5] = [0.6, 0.8]

Verification, by recomputing the norm of this new vector:
norm([0.6, 0.8]) = sqrt(0.6² + 0.8²) = sqrt(0.36 + 0.64) = sqrt(1) = 1
```

This result isn't a coincidence specific to this example: dividing each component by the norm mechanically divides the norm itself by that same value — a norm `N` divided by `N` always gives `1`, whatever the starting vector. Useful for comparing two vectors on their direction alone, without their respective lengths skewing the comparison.

> **Pitfall:** normalizing a zero vector (`[0, 0]`) amounts to dividing by a norm of 0 — an undefined operation, not just a rounding error.
>
> **Best practice:** check that a vector isn't zero before normalizing it, rather than letting the program fail on a division by zero.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A vector is an ordered list of numbers treated as a single entity. The dot product reduces two vectors of the same dimension to a single number, which measures how much they point in the same direction. The norm is a vector's length. |
| **Tools you can use** | No specific tool for computing by hand; in practice, a library like [NumPy](/?c=data-science&p=numpy) performs these operations directly on whole vectors, with no explicit loop. |
| **Pitfalls to avoid** | Adding or combining two vectors of different dimensions. Normalizing a zero vector (division by a norm of 0). |
| **Best practices** | Check that two vectors have the same dimension before any operation between them. Document what each component of a vector represents as soon as it's created. |
