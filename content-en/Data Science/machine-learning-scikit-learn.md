---
order: 5
---

# Introduction to Machine Learning (scikit-learn)

**Machine learning** involves teaching a program to learn behavior from **data**, rather than explicitly coding each rule. This chapter introduces the terminology and general workflow of a machine learning project, prior to the more advanced chapters on neural networks.

## Supervised vs. Unsupervised Learning

| | Supervised learning | Unsupervised learning |
|---|---|---|
| Data | Labeled (the correct answer is already known for each training example) | Unlabeled |
| Objective | Predict a label for new data | Discover a hidden structure in the data |
| Example tasks | Classification (spam/non-spam), regression (predicting a price) | Clustering (grouping similar customers), dimensionality reduction |

```python
# Supervised learning: X (the data) AND y (the known correct answers)
X = [[25, 50000], [45, 80000], [30, 45000]]   # e.g., age, salary
y = ["no", "Yes", "no"]                        # e.g., has taken out a loan or not

# Unsupervised learning: only X; there is no “correct answer” to learn
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## The fundamental principle: separate training from testing

A model that “memorizes” the training data (rather than learning the underlying general pattern) would achieve a perfect score on that data, but would fail on new, previously unseen data. To detect this problem, we **always split** the available data into two distinct sets:

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# 80% used to train the model, 20% set aside and never seen during training
```

The model is then evaluated **only** on `X_test` / `y_test`, never on the data used to train it.

## A third category: validation

Tuning a model (comparing multiple algorithms, choosing hyperparameters) based on the score obtained on `X_test` amounts to indirect cheating: the choices made earlier end up being influenced by this score, which then ceases to represent a truly unseen set. The correct approach involves introducing a third dataset, the **validation set**, which is used during development rather than at the end:

| Set | Role |
|---|---|
| Training | Adjust the model's internal parameters (`fit`) |
| Validation | Compare models and hyperparameters with one another before any final testing |
| Test | Evaluate the chosen model only once, at the very end |

```python
X_entrainement, X_temp, y_entrainement, y_temp = train_test_split(X, y, test_size=0.4)
X_validation, X_test, y_validation, y_test = train_test_split(X_temp, y_temp, test_size=0.5)
# 60% training / 20% assessment / 20% testing
```

## *Overfitting* and underfitting

| | Practice Score | Test Score |
|---|---|---|
| **Underfitting** | Low | Low: the model is too simple to capture the pattern |
| **Good fit** | High | High: the model generalizes well |
| **Overfitting** | Very high | Low: the model has "memorized" the training data instead of learning a general pattern |

> **Note:** A large gap between the training score (excellent) and the test score (mediocre) is a classic sign of overfitting: the model has memorized specific examples rather than the general rule underlying them, much like a student who has memorized the answers to a specific exercise without understanding the method.

## The unified scikit-learn API: `fit` / `predict`

Regardless of the algorithm chosen, scikit-learn consistently exposes the same interface:

```python
from sklearn.linear_model import LogisticRegression   # Classification: y is categorical ("yes"/"no")

model = LogisticRegression()
model.fit(X_entrainement, y_entrainement)   # "learns" from training data

predictions = model.predict(X_test)           # applies what has been learned to new data

model.score(X_test, y_test)                    # Evaluates the quality of predictions during testing
```

- `fit(X, y)` : Adjusts the model's internal parameters so that it best fits the provided data.
- `predict(X)` : uses these learned parameters to generate a prediction for new data.
- This interface (`fit` / `predict`) remains the same when you simply replace `LogisticRegression()` with another algorithm (`RandomForestClassifier()`, `KMeans()`...), which makes it very easy to quickly test several approaches to the same problem.

> **Note:** The choice of algorithm depends on the type of `y`. Here, `y` is **categorical** (`"oui"` / `"non"`): it is a classification problem, hence `LogisticRegression` (despite its name, this is a classification algorithm, not a regression algorithm). `LinearRegression` is used when `y` is a **continuous numerical** value to be predicted (a price, a temperature, etc.): using it on text labels, as in this case, would result in an error.

## *Cross-validation*

With limited data, setting aside 40% for validation and testing (see above) becomes costly; cross-validation solves this problem without sacrificing as much training data:

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(LogisticRegression(), X_entrainement, y_entrainement, cv=5)
# Splits X_training into 5 blocks ("folds"); trains 5 times, using each block as validation in turn
scores.mean()   # Average of the 5 scores -> a more reliable estimate than a single train/validation split
```

Each example thus serves both as a practice exercise (4 out of 5 times) and as a validation exercise (1 out of 5 times), without ever affecting `X_test`: the average of the 5 scores smooths out the effect of a particularly favorable or unfavorable split that a single split might produce by chance.

## Measuring the quality of a model

For regression (continuous numerical `y`), the mean squared error is sufficient in most cases:

```python
from sklearn.metrics import mean_squared_error

mean_squared_error(y_test, predictions)   # mean square error
```

For classification, accuracy (`accuracy_score`, % of correct predictions) is not sufficient when classes are imbalanced: the metrics below take this into account, based on the **confusion matrix**.

### The confusion matrix

For a binary classification (positive/negative), each prediction falls into one of these four categories:

| | Predicts positive | Predicts negative |
|---|---|---|
| **True positive** | True positive (TP) | False negative (FN) |
| **True Negative** | False Positive (FP) | True Negative (TN) |

```python
from sklearn.metrics import confusion_matrix

confusion_matrix(y_test, predictions)
# [[VN, FP],
# [FN, VP]]
```

### The resulting metrics

| Metric | Formula | Defined as |
|---|---|---|
| Accuracy | (VP + VN) / total | Of all predictions, what proportion is correct? |
| Precision | VP / (VP + FP) | Of the predicted positive cases, how many are actually positive? |
| Recall (or sensitivity) | VP / (VP + FN) | Of the true positives, how many were detected? |
| Specificity | NP / (NP + FP) | Of the truly negative cases, how many were correctly excluded? |
| F1-score | 2 × (precision × recall) / (precision + recall) | A single-digit harmonic mean of precision and recall |

```python
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report

precision_score(y_test, predictions)
recall_score(y_test, predictions)
f1_score(y_test, predictions)

print(classification_report(y_test, predictions))   # Detailed information, overview, and F1 help all in one place, organized by class
```

> **Note:** Accuracy is misleading for imbalanced classes: a fraud detector that always responds “no” achieves 99% accuracy if 1% of transactions are fraudulent, yet is useless (0% recall). Precision and recall are almost always evaluated together: increasing one generally comes at the expense of the other (shifting the decision threshold toward “positive” increases recall but decreases precision, and vice versa), the F1-score summarizes this trade-off in a single number, which is useful for comparing models without having to manually balance the two each time. Specificity completes the picture on the negative side: it’s useful when a false positive is costly (e.g., an unnecessary medical test triggered by mistake), whereas recall focuses on the cost of a false negative (e.g., an undetected disease).

## The typical workflow of a machine learning project

1. Collect and clean the data (missing values; see [pandas](/?c=data-science&p=pandas)).
2. Split into training and test sets.
3. Select one or more candidate algorithms and `fit` them.
4. Evaluate using the test suite (`predict` + a metric appropriate for the problem).
5. Adjust (different algorithm, different parameters, more data, etc.) and try again.

See also the chapter on [neural networks](/?c=ia&p=reseaux-de-neurones): a specific family of models that are more complex than those in scikit-learn but are based on exactly the same fundamental principles (training/test data, learning, generalization).

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | A model is trained on a dataset separate from the test set to determine whether it generalizes or “memorizes” (overfitting). The scikit-learn API is consistent: `fit()` followed by `predict()`, regardless of the algorithm. |
| **Tools available** | `train_test_split`, `cross_val_score`, confusion matrix, `precision_score` / `recall_score` / `f1_score`. |
| **Pitfalls to Avoid** | Repeatedly evaluating and tuning a model on the same test set: tantamount to indirectly cheating; relying solely on accuracy for imbalanced classes. |
| **Best Practices** | Set aside a validation set to tune hyperparameters, since the final test is run only once; use the F1 score to summarize the trade-off between precision and recall. |
