---
order: 17
---

# Introduction to Machine Learning (scikit-learn)

**Machine learning** involves teaching a program to learn behavior from **data**, rather than explicitly coding each rule. This chapter introduces the terminology and the general workflow of a machine learning project, before moving on to more advanced chapters on neural networks.

## Supervised vs. Unsupervised Learning

| | Supervised learning | Unsupervised learning |
|---|---|---|
| Data | Labeled (we already know the correct answer for each training example) | Unlabeled |
| Objective | Predict a label for new data | Discover a hidden structure in the data |
| Examples of tasks | Classification (spam/non-spam), regression (predicting a price) | Clustering (grouping similar customers), dimensionality reduction |

```python
# Supervised learning: X (the data) AND y (the known correct answers)
X = [[25, 50000], [45, 80000], [30, 45000]]   # e.g., age, salary
y = ["non", "oui", "non"]                        # e.g., has taken out a loan or not

# Unsupervised learning: only X; there is no "correct answer" to learn
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## The fundamental principle: separating training and testing

A model that “memorizes” the training data (rather than learning the underlying general pattern) would achieve a perfect score on that data—but would fail on new, never-before-seen data. To detect this problem, we **always split** the available data into two distinct sets:

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# 80% to train the model, 20% set aside, never seen during training
```

The model is then evaluated **only** on `X_test` / `y_test`, never on the data used to train it.

## *Overfitting* and underfitting

| | Practice Score | Test Score |
|---|---|---|
| **Underfitting** | Low | Low — the model is too simple to capture the pattern |
| **Good fit** | High | High — the model generalizes well |
| **Overfitting** | Very high | Low — the model has "memorized" the training data instead of learning a general pattern |

> **Note:** A large gap between the training score (excellent) and the test score (poor) is a classic sign of overfitting—the model has memorized specific examples rather than the general rule underlying them, much like a student who has memorized the answers to a specific exercise without understanding the method.

## The unified scikit-learn API: `fit` / `predict`

Regardless of the algorithm chosen, scikit-learn consistently exposes the same interface:

```python
from sklearn.linear_model import LogisticRegression   # classification: y is categorical ("yes"/"no")

modele = LogisticRegression()
modele.fit(X_entrainement, y_entrainement)   # "learns" from the training data

predictions = modele.predict(X_test)           # applies what has been learned to new data

modele.score(X_test, y_test)                    # evaluates the quality of the predictions on the test
```

- `fit(X, y)` : adjusts the model's internal parameters so that it best fits the provided data.
- `predict(X)` : uses these learned parameters to generate a prediction for new data.
- This interface (`fit` / `predict`) remains the same when you simply replace `LogisticRegression()` with another algorithm (`RandomForestClassifier()`, `KMeans()`...)—which makes it very easy to quickly test several approaches to the same problem.

> **Note:** The choice of algorithm depends on the type of `y`. Here, `y` is **categorical** (`"oui"` / `"non"`): it is a classification problem, hence `LogisticRegression` (despite its name, this is a classification algorithm, not a regression algorithm). `LinearRegression` is used when `y` is a **continuous numerical** value to be predicted (a price, a temperature, etc.)—using it on text labels as in this case would result in an error.

## Measuring the Quality of a Model

```python
from sklearn.metrics import accuracy_score, mean_squared_error

accuracy_score(y_test, predictions)       # Percentage of correct predictions -> for classification
mean_squared_error(y_test, predictions)    # mean squared error -> for regression
```

## The typical workflow of a machine learning project

1. Collect and clean the data (missing values; see the chapter on pandas).
2. Divide into training and test sets.
3. Select one or more candidate algorithms and `fit` them.
4. Evaluate on the test set (`predict` + a metric appropriate for the problem).
5. Make adjustments (different algorithm, different parameters, more data, etc.) and try again.

See also the chapter on neural networks: a specific family of models that are more complex than those in scikit-learn, but are based on exactly the same fundamental principles (training/test data, learning, generalization).
