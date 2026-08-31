---
order: 9
---

# SVMs (Support Vector Machines)

An **SVM** (*Support Vector Machine*) is a classification algorithm that, like [decision trees](/?c=donnees&s=data-science&p=arbres-de-decision), draws a boundary between categories, but chooses this boundary based on a different criterion: the largest possible **margin** between the two categories.

## The idea: the widest possible boundary

To separate two species of flowers (iris) based on the length and width of their petals, **several lines** can perfectly separate the training examples:

```
petal width
   |     ● ●
   |   ●   ●  ╲
   |  ●         ╲←── several possible lines
   |       ○   ○  ╲
   |     ○   ○      ╲
   +──────────────────── petal length
   ● species A    ○ species B
```

An SVM doesn't pick just any of them: it looks for the one that leaves the most empty space on either side, the **maximum margin**. On real iris data, this margin measures, for example, 1.397 cm: the distance between the boundary and the closest example on each side.

## Support vectors: only a few points matter

Once the maximum-margin boundary is found, **only the examples sitting exactly on the edges of the margin** influenced its position: these are the **support vectors**, which give the algorithm its name. All other examples, further from the boundary, could have been moved or removed without changing the result at all.

```python
from sklearn.svm import SVC

model = SVC(kernel="linear")
model.fit(X_train, y_train)

model.support_vectors_    # the only examples that determine the boundary (often a handful, out of hundreds)
```

## The *kernel trick*: when a line isn't enough

If the two categories can't be separated by a straight line, an SVM with a linear kernel (`kernel="linear"`) hits a ceiling (e.g. 60% correct classifications on a dataset that isn't linearly separable). The **kernel trick** switches kernels (e.g. `kernel="rbf"`) to implicitly transform the data into a space where separation becomes possible, producing a curved boundary in the original space:

```python
curved_model = SVC(kernel="rbf")   # RBF kernel: allows a curved boundary
curved_model.fit(X_train, y_train)
# can reach 100% where kernel="linear" was capped at 60%, on a non-linearly-separable problem
```

Technically, the kernel avoids explicitly computing the coordinates in this transformed space (potentially of very high dimension): it directly computes, via a mathematical formula, how "close" two points would be once transformed, which is enough for the algorithm without ever building the transformed space itself.

## Pitfall: unscaled inputs distort the margin

An SVM measures **distances** between points to find the maximum margin: a characteristic in the millions (e.g. a salary) would completely overwhelm a characteristic in single units (e.g. an age) in this distance computation, even though age is just as relevant. Unlike decision trees, an SVM therefore needs all inputs scaled to the same range before training:

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)   # centers and scales each column (mean 0, standard deviation 1)
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | An SVM draws the classification boundary that maximizes the margin between categories; only the support vectors (the points closest to the boundary) determine its position. |
| **Tools you can use** | `sklearn.svm.SVC`, `kernel="linear"`/`"rbf"`, `.support_vectors_`, `StandardScaler`. |
| **Pitfalls to avoid** | Training without scaling the inputs (distorted distances); keeping a linear kernel on data that isn't linearly separable. |
| **Best practices** | Always scale inputs before an SVM; try `kernel="rbf"` if `kernel="linear"` hits a ceiling. |
