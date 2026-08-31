---
order: 8
---

# Decision Trees

A **decision tree** classifies (or predicts a number, see below) by asking a **series of simple questions** about the inputs, each with a binary answer, until reaching a final decision. Unlike [logistic regression](/?c=donnees&s=data-science&p=regression-logistique), which combines all the inputs into a single formula, a tree examines them one by one, in an order it learns automatically.

## The idea: a series of questions

A music streaming app wants to classify a track into a "Workout" playlist or not, based on 3 characteristics (hip-hop? energetic? late at night?).

```
                    Hip-hop?
                   /          \
                 Yes            No
                  |               |
            Energetic?      (not Workout)
             /       \
           Yes        No
            |           |
      Late at night?  (not Workout)
       /        \
     Yes         No
      |            |
  (not Workout) Workout
```

Each node asks a question about **a single** characteristic; each branch leads either to a new question or to a **leaf**: the final decision.

## What a question actually does: splitting the space into rectangles

Each question in the tree is literally a straight cut through the data space: "hip-hop?" splits all the tracks into two groups based on a single characteristic, "energetic?" then re-splits one of these two groups based on another. Stacking several questions therefore amounts to splitting the space into **rectangles** (one rectangle per leaf), each corresponding to a precise combination of answers:

```
energy
   |  Not Workout │  Not Workout
   |               │
   |───────────────┼───────────────
   |  Not Workout │   Workout
   |               │
   +──────────────────────────────── hip-hop (0 = no, 1 = yes)
```

The tree and this rectangle split are **the same object** seen in two different ways: reading the tree from top to bottom is equivalent to moving through the rectangles.

## In code

```python
from sklearn.tree import DecisionTreeClassifier

# X: [hip-hop (0/1), energetic (0/1), late at night (0/1)]; y: Workout playlist (1) or not (0)
X = [[1, 1, 0], [1, 1, 1], [0, 1, 0], [1, 0, 0], [0, 0, 1]]
y = [1, 0, 0, 0, 0]

model = DecisionTreeClassifier(max_depth=3)   # max_depth: limits the number of cascading questions
model.fit(X, y)

model.predict([[1, 1, 0]])           # [1] -> classified as "Workout"
model.feature_importances_            # relative importance of each characteristic in the tree's choices
```

## How the tree chooses its questions

At each node, the algorithm tests all characteristics and all possible thresholds, and keeps the question that makes the two resulting groups as **pure** as possible (each group contains, as much as possible, a single category rather than a mix). This purity is measured with **Gini impurity** or **entropy**, two formulas based on the [probabilities](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base) of each category within a group: the more mixed a group is (probabilities close to each other across categories), the higher its impurity. The algorithm repeats this choice recursively on each new group, until a maximum depth (`max_depth`) is reached or leaves are already pure.

## Pitfall: a tree that's too deep memorizes instead of learning

Without a depth limit, a tree can keep asking questions until it isolates every training example in its own leaf: a perfect score on training data, but severe [overfitting](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#overfitting-and-underfitting), the tree having learned the specific examples rather than a general pattern. `max_depth`, or a minimum number of examples required per leaf (`min_samples_leaf`), limit this risk.

> **Advantage worth noting:** unlike linear/logistic regression, a decision tree needs no upfront input scaling (a characteristic in the tens and another in the millions don't disturb it): it always compares a single characteristic to a threshold at a time, never a weighted sum between them.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A decision tree classifies via a series of binary questions, each a straight cut through the data space; the set of leaves forms a split into rectangles. |
| **Tools you can use** | `sklearn.tree.DecisionTreeClassifier`, `max_depth`, `min_samples_leaf`, `.feature_importances_`. |
| **Pitfalls to avoid** | Letting the tree grow without limit (near-guaranteed overfitting). |
| **Best practices** | Set `max_depth`/`min_samples_leaf` from the start; take advantage of not needing scaling for this type of model. |
