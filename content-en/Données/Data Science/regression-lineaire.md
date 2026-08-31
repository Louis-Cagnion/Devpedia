---
order: 6
---

# Linear Regression

This chapter applies the vocabulary introduced in [Introduction to Machine Learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn) (training/test, `fit`/`predict`) to a specific algorithm. **Linear regression** is the simplest supervised machine learning algorithm: it predicts a **number** (a continuous value) from one or more inputs, by drawing the line that best fits known examples.

## The idea: finding the best line

A delivery company wants to estimate how long a delivery will take based on the distance to travel. From past deliveries, it already knows both the distance AND the actual duration: this is the training data.

```
duration (min)
   50 |                                    ●
   40 |                          ●      ╱
   30 |                 ●     ╱‾
   20 |        ●     ╱‾
   10 |  ●  ╱‾
    0 +──────────────────────────────── distance (km)
      0    5    10   15   20
```

Each point ● is a real past delivery. The line is the one that passes **as close as possible to all the points**, not necessarily through any single one of them: this is what the model learns, then reuses to predict the duration of a new delivery for which only the distance is known.

## The formula of a line

A line with a single input is written as:

```
prediction = bias + weight × input
```

For the delivery example, training (see below for *how* these two numbers are found) concretely gives:

```
duration = 7.6 + 2.52 × distance
```

- **7.6** (the bias, or *intercept*): the base duration, unavoidable even for a distance close to 0 (preparation, leaving the depot...).
- **2.52** (the weight, or *coefficient*): the number of minutes added per extra kilometer.

For a 12 km delivery: `duration = 7.6 + 2.52 × 12 = 37.8` minutes.

With **several** inputs (distance, but also the number of red lights on the route, time of day...), the formula adds one weight per input: `prediction = bias + weight1 × input1 + weight2 × input2 + ...`. This is exactly the [weighted sum of a dot product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) between the vector of inputs and the vector of learned weights.

## In code

```python
from sklearn.linear_model import LinearRegression

# X: distance in km (a single column here); y: actual duration in minutes
X = [[2], [5], [9], [14], [20]]
y = [12, 20, 30, 42, 58]

model = LinearRegression()
model.fit(X, y)          # finds the bias and weight(s) that minimize the error (see below)

model.intercept_          # 7.6  -> the bias
model.coef_                # [2.52] -> one weight per column of X

model.predict([[12]])     # [37.8] -> prediction for a 12 km distance
```

## How the model finds this line

An infinite number of lines could pass through the scatter of points; `fit()` picks the one that minimizes **the mean squared error** (see this metric in [Introduction to Machine Learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#measuring-the-quality-of-a-model)) between the predicted durations and the actual durations of the training examples: the sum of the squared gaps, as small as possible.

Two methods find this minimum, depending on the size of the data:

| Method | Principle | Used when |
|---|---|---|
| Normal equation (closed form) | Directly computes the optimal bias/weights with a mathematical formula, in a single pass | Few columns (a few dozen) |
| Gradient descent | Progressively adjusts bias/weights in small steps, in the direction that reduces the error (see [training a model](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) | Many columns or a lot of data: the direct formula becomes too costly to compute |

scikit-learn's `LinearRegression` uses the normal equation automatically; gradient descent is mainly used for more complex models (neural networks).

## Limitation: linear regression assumes a... linear relationship

The model can only draw a straight line (or a plane, with several inputs): if the true relationship between the inputs and the output is a curve, a straight line will never fit it well, whatever bias and weights are chosen. This is a classic case of structural [underfitting](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#overfitting-and-underfitting), not a problem of insufficient data.

> **Pitfall:** applying `LinearRegression` to a categorical output (e.g. "yes"/"no") instead of a continuous number. The model won't raise an error but will return a meaningless number (e.g. 0.73), unusable as a category: to classify, see the next chapter, [logistic regression](/?c=donnees&s=data-science&p=regression-logistique).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Linear regression predicts a continuous number by drawing the line (or plane) that minimizes the mean squared error on the training examples. |
| **Tools you can use** | `sklearn.linear_model.LinearRegression`, `.fit()`, `.predict()`, `.intercept_`, `.coef_`. |
| **Pitfalls to avoid** | Using it on a categorical output; applying it as-is to a non-linear relationship (guaranteed underfitting). |
| **Best practices** | Visually check (scatter plot) that the relationship looks linear before training the model. |
