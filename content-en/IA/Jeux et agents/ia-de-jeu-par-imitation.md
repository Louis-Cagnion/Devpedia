---
order: 1
---

# Game AI by imitation: learning from a human player

A computer-controlled opponent (a **bot**) can be built in two fundamentally different ways: **scripted** (a developer hand-writes the decision rules: "if the enemy is visible, shoot") or **learned by imitation** (the behavior is automatically inferred from recordings of games played by humans, without anyone writing the rule explicitly).

## Scripted bot vs bot learned by imitation

| | Scripted bot | Bot learned by imitation |
|---|---|---|
| Origin of behavior | Rules hand-written by a developer | Inferred from recordings of human games |
| Realism | Often recognizable as "artificial" (repetitive patterns) | Can reproduce human habits and imperfections |
| Cost to build | Writing and maintaining every rule | Collecting gameplay data, then training a model |
| Behavior facing a never-anticipated situation | Follows the closest matching rule, predictable | Unpredictable: the model never "saw" this situation during training |

## Recording games to turn them into training data

The principle follows supervised learning (see [Neural Networks](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)): every instant of a human game becomes a training example, where the **game state** at that instant (player positions, remaining ammo, what the player sees on screen...) is paired with the **action** the player actually took at that moment (shoot, move, aim in a given direction).

```text
Recorded human game, instant by instant:

Game state (input)                Player action (expected output)
------------------------          -----------------------------------
enemy visible, 30 ammo         ->  shoot
enemy out of sight               ->  move toward point A
low health                       ->  retreat
```

Thousands of these (state, action) pairs make up the dataset. The model learns to predict the most likely action from a given state, exactly like an image classification model learns to predict a category from pixels.

> **Pitfall:** collecting games from a single player, or from too homogeneous a playstyle. The model then faithfully reproduces that specific player's habits (flaws included), rather than a behavior representative of a "generic" human opponent.
>
> **Best practice:** diversify the recording sources (several players, several skill levels, several styles) so the model generalizes beyond a single individual's habits.

## The generalization pitfall: a never-seen situation

A model trained by imitation only knows how to react to situations close enough to those seen in the training data. A never-before-seen game configuration (a map never played in the recordings, a rare item combination) can produce an absurd action, with no explicit rule to correct it, unlike a scripted bot that always follows its closest matching rule even in a rare case.

> **Pitfall:** assuming a model trained on one piece of game content (a map, a mode) will behave correctly on different content, never seen during training.
>
> **Best practice:** explicitly test the bot on content absent from the training data before deploying it, rather than assuming the learned behavior generalizes automatically.

## Simulating human imperfection: deliberate precision degradation

A model trained to maximize its accuracy can end up aiming with near-perfect precision, a behavior that resembles no real human player and makes the opponent feel unfair rather than believable. One technique corrects this gap: deliberately degrading the bot's precision, for example by adding random noise to the aim direction or simulating a variable reaction time, to imitate a human player's fatigue and imperfection rather than an algorithm's mechanical perfection.

```text
"Raw" model precision            ->  near-perfect, perceived as "cheating"
Precision + random noise         ->  variable, resembles a fatigue-prone human player
```

> **Best practice:** calibrate this noise based on the intended difficulty level (more noise = easier opponent), rather than applying one fixed value across every level.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A bot learned by imitation infers its behavior from recordings of human games (state → action pairs), rather than from hand-written rules. It generalizes poorly to a situation absent from the training data. Deliberately degrading its precision (noise, variable reaction time) makes it more believable than perfect mechanical accuracy. |
| **Usable tools** | A classification model that predicts an action from a game state, trained on recorded (state, action) pairs. |
| **Pitfalls to avoid** | Training on a single player's games. Deploying a bot on content never seen during training without testing it first. |
| **Best practices** | Diversify recording sources. Test on unseen content before deployment. Add noise to precision to simulate human imperfection, calibrated to the intended difficulty level. |
