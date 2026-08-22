---
order: 4
---

# The news feed: building everyone's feed (fan-out)

A news feed (Instagram, but the principle is identical on most social networks) must display, for each user, the posts of every account they follow, in order. The problem isn't storing the posts: it's knowing **when** to assemble, for each user, the list of what they should see. Two opposite strategies answer this question, called **fan-out** on write or on read.

## Fan-out on write (push): preparing the feed in advance

As soon as an account posts, the system immediately writes that post into the **already precomputed** feed of each of its followers:

```text
Account A posts
   |
   v
Writes the post into the precomputed feed of:
   Follower 1, Follower 2, Follower 3, ... Follower n
   (as many writes as there are followers)

Later, follower 1 opens their feed:
   -> reads their already-ready feed directly (fast)
```

Reading your feed then becomes very fast (a simple read of an already-ready list), at the cost of multiplied write work on every post.

## Fan-out on read (pull): assembling everything at viewing time

Conversely, nothing is precomputed at posting time. When a user opens their feed, the system fetches, live, the latest posts from every account they follow, and assembles them at that moment:

```text
Account A posts
   |
   v
Nothing happens for followers (a single, cheap write)

Later, follower 1 opens their feed:
   -> fetches the latest posts from EVERY followed account
   -> assembles and sorts them at that instant (costly if many accounts are followed)
```

## Comparison and the "celebrity problem"

| | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Cost at posting time | One write per follower | A single, cheap write |
| Cost at feed-reading time | A simple read, very fast | Assembling and sorting live, slower |
| Problem case | An account followed by millions of people: a single post triggers millions of simultaneous writes | A user who follows thousands of accounts: every feed opening queries thousands of sources |

> **Pitfall:** choosing only fan-out on write for a network where some accounts have millions of followers (the "celebrity problem"). A single post from such an account would trigger as many writes as it has followers all at once, a spike that even a system with [autoscaling](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) struggles to absorb.
>
> **Best practice:** a **hybrid** model, used by most large social networks: fan-out on write for most accounts (few followers, guaranteed fast reads), and an automatic switch to fan-out on read past a certain follower count (a celebrity account's posts are fetched live at reading time, rather than pushed out in bulk on every post). The massive writes of fan-out on write are themselves delegated to a background [queue](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic), so the poster doesn't wait for all those writes to finish before getting a confirmation.

## 📋 Summary

| | |
|---|---|
| **To remember** | Fan-out on write precomputes each follower's feed at posting time (fast read, costly write at scale); fan-out on read assembles the feed on demand (light write, costlier read). A hybrid model switches to reads for accounts with a very large number of followers. |
| **Usable tools** | A queue to distribute the massive writes of fan-out on write in the background. |
| **Pitfalls to avoid** | Applying fan-out on write to every account without exception, including those with millions of followers. |
| **Best practices** | A hybrid model, with a follower-count threshold that switches the behavior. |
