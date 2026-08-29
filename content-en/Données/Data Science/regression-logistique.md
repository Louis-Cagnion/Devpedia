---
order: 7
---

# Logistic Regression

Despite its name being similar to [linear regression](/?c=donnees&s=data-science&p=regression-lineaire), logistic regression doesn't predict a continuous number but a **category**: it's a **classification** algorithm. It answers questions like "is this email spam?" or "will this subscriber cancel?", building on the same foundations as linear regression (bias, weights, `fit`/`predict`, see [Introduction to Machine Learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn)).

## The problem: a line isn't enough to classify

A subscription service wants to predict whether a user will **churn** based on the number of days since their last login. The expected output isn't just any number, but a **probability**, necessarily between 0 and 1 (0% to 100% chance of churning). A regular line (linear regression) can go above 1 or below 0 for extreme inputs: a result that then makes no sense as a probability.

## The solution: squashing the line into an S-shaped curve

Logistic regression first computes a classic weighted sum (`bias + weight × input`, exactly like linear regression), then feeds this result into a particular [mathematical function](/?c=fondamentaux&s=mathematiques&p=la-fonction-mathematique), the **sigmoid function**, which squashes any number (however large or small) into the interval ]0, 1[:

```
probability
    1 |                              ●●●●●●
      |                          ●●●
  0.5 |                      ●●
      |                  ●●●
    0 |●●●●●●●●●●●●
      +──────────────────────────────────── days since last login
```

```python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))   # squashes x into the interval ]0, 1[, whatever x is

sigmoid(-10)   # ≈ 0.00005  -> close to 0
sigmoid(0)     # 0.5        -> right in the middle
sigmoid(10)    # ≈ 0.99995  -> close to 1
```

For a subscriber who hasn't logged in for 17 days, the trained model might compute, for example, an 82% churn probability. Above a **decision threshold** (0.5 by default), the user is classified as "at risk".

## In code

```python
from sklearn.linear_model import LogisticRegression

# X: days since last login; y: churned (1) or not (0)
X = [[2], [5], [10], [15], [25], [30]]
y = [0, 0, 0, 1, 1, 1]

model = LogisticRegression()
model.fit(X, y)

model.predict([[17]])         # [1] -> classified as "will churn" (probability > threshold)
model.predict_proba([[17]])   # [[0.18, 0.82]] -> [probability of 0, probability of 1]
```

`predict()` already applies the 0.5 threshold and directly returns the category; `predict_proba()` returns the raw probability, useful when the default threshold isn't appropriate (see the pitfall below).

## How the model finds the weights

As with linear regression, `fit()` looks for the weights/bias that minimize an error, but the mean squared error (suited to a continuous number) doesn't work for a probability: logistic regression uses **cross-entropy**, a loss function that heavily penalizes a confident but wrong prediction (e.g. predicting a 99% chance of "no churn" for a user who does churn), already detailed in [training a model](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## Pitfall: the 0.5 threshold isn't always the right one

Lowering or raising the decision threshold directly shifts the trade-off between precision and recall (see [these metrics](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#measuring-the-quality-of-a-model)): a lower threshold classifies more users as "at risk" (more recall, less precision), a higher threshold does the opposite. On a problem where false negatives are costly (e.g. failing to spot a user who really will churn), lowering the threshold below 0.5 via `predict_proba()` is often preferable to `predict()` alone, which imposes 0.5 without question.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Logistic regression classifies an input by computing a probability (via the sigmoid function), then comparing it to a decision threshold. Despite its name, it's a classification algorithm, not a regression one. |
| **Tools you can use** | `sklearn.linear_model.LogisticRegression`, `.predict()` (category), `.predict_proba()` (raw probability). |
| **Pitfalls to avoid** | Confusing it with linear regression because of the name; relying on the default 0.5 threshold without checking whether it fits the problem. |
| **Best practices** | Use `predict_proba()` rather than `predict()` as soon as the cost of a false negative and a false positive differ, in order to adjust the threshold accordingly. |
