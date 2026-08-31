---
order: 10
---

# k-Nearest Neighbors (k-NN)

Unlike [linear regression](/?c=donnees&s=data-science&p=regression-lineaire), [logistic regression](/?c=donnees&s=data-science&p=regression-logistique), [decision trees](/?c=donnees&s=data-science&p=arbres-de-decision), or [SVMs](/?c=donnees&s=data-science&p=svm), the **k-nearest neighbors** algorithm (k-NN) doesn't learn any formula, any boundary, any rule: during training, it simply **memorizes** all the data. All the work happens at prediction time.

## The idea: asking the nearest neighbors for their opinion

A streaming service wants to classify a new movie by genre, based on the movies already cataloged. For a new movie, k-NN:

1. Computes the **distance** between this movie and each of the already-known movies (based on numerical characteristics: duration, budget, number of detected action scenes...).
2. Keeps the **k** nearest movies (e.g. k = 5).
3. Votes: the majority category among these k neighbors becomes the prediction.

```
    ○ ○
  ○   ○  ×?          × : new movie to classify
    ○   ●            k = 5 nearest neighbors circled
  ●   ○
```

If 4 of the 5 nearest neighbors are "science fiction", the new movie is classified as "science fiction". No line, no curve, no tree was computed: just distances and a vote.

## In code

```python
from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(n_neighbors=5)   # k = 5
model.fit(X_train, y_train)     # computes nothing: simply stores the data

model.predict([[new_movie]])                # computes distances NOW, on the fly
```

## The performance pitfall: all the work happens at prediction time

For the previous algorithms, `fit()` does all the costly work once, and `predict()` then applies an already-ready formula (fast, even on lots of new data). For k-NN, it's the opposite: `fit()` is instant (it just stores the data), but every call to `predict()` has to recompute the distance between the new point and **all** the known examples.

| Catalog size | Time per prediction |
|---|---|
| 68 movies | Instant |
| 4,200,000 movies | Noticeably slower: each prediction compares the new movie against all 4.2 million others |

This trade-off (no training, but a prediction that gets more costly as the data grows) is why k-NN is called a "lazy" learning algorithm (*lazy learning*), as opposed to "eager" algorithms (SVM, trees, regressions) which invest all the computational cost into `fit()`.

## Choosing k

| k | Effect |
|---|---|
| Too small (e.g. 1) | Very sensitive to noise: a single atypical neighbor changes the prediction ([overfitting](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#overfitting-and-underfitting)) |
| Too large | Smooths the boundary between categories too much, to the point of ignoring real local patterns ([underfitting](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#overfitting-and-underfitting)) |
| Balanced | Chosen via [cross-validation](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#cross-validation) by testing several values |

> **Pitfall:** like [SVM](/?c=donnees&s=data-science&p=svm#pitfall-unscaled-inputs-distort-the-margin), k-NN relies entirely on distances: inputs that aren't scaled to the same range (`StandardScaler`) distort the computed distances, for exactly the same reason.

## Comparing the 5 algorithms

| Algorithm | What it learns | What it draws | Output type |
|---|---|---|---|
| [Linear regression](/?c=donnees&s=data-science&p=regression-lineaire) | One weight per input | A line (or a plane) | A continuous number |
| [Logistic regression](/?c=donnees&s=data-science&p=regression-logistique) | One weight per input + threshold | An S-shaped curve (probability) | A category, with probability |
| [Decision tree](/?c=donnees&s=data-science&p=arbres-de-decision) | A series of questions | Rectangles (straight cuts) | A category (or a number) |
| [SVM](/?c=donnees&s=data-science&p=svm) | The maximum-margin boundary | A margin between categories | A category |
| k-NN | Nothing (memorizes the data) | A vote among neighbors | A category (or an average) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | k-NN classifies a new example by majority vote among its k nearest neighbors, without ever building an explicit model: all the computation happens at prediction time, not during training. |
| **Tools you can use** | `sklearn.neighbors.KNeighborsClassifier`, `n_neighbors`, `StandardScaler`. |
| **Pitfalls to avoid** | Using it on a very large catalog without accounting for the per-prediction cost; forgetting to scale the inputs. |
| **Best practices** | Choose k via cross-validation rather than at random; reserve k-NN for data volumes where a slow prediction remains acceptable. |
