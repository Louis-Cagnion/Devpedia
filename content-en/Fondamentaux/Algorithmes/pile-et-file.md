---
order: 3
---

# Stack and Queue: LIFO and FIFO

A **stack** and a **queue** are two data structures that add an ordering rule on top of a [linked list](/?c=langages-de-programmation&s=c&p=listes-chainees) or an array: they only allow access at one end, never at an element in the middle.

## The Stack: LIFO

A stack exposes only two operations on its **top** (the last element added):

- **push**: add an element to the top.
- **pop**: remove and return the element at the top.

```text
push(1)      push(2)      push(3)      pop()
   [1]          [2]          [3]          [2]
                [1]          [2]          [1]
                             [1]
```

The last element pushed is always the first one popped: **LIFO** (*Last In, First Out*). A stack of plates illustrates the idea well: you can only remove the one on top.

Implemented on top of a [linked list](/?c=langages-de-programmation&s=c&p=listes-chainees), the head of the list directly serves as the top: pushing/popping at the head is already a constant-time operation there, no data needs to be moved.

```c
typedef struct Node
{
    int value;
    struct Node *next;
} Node;

void push(Node **top, int value)
{
    Node *newNode = malloc(sizeof(Node));

    if (newNode == NULL)
        return;
    newNode->value = value;
    newNode->next = *top;   // points to the old top
    *top = newNode;         // becomes the new top
}

int pop(Node **top)
{
    Node *old = *top;
    int value = old->value;

    *top = old->next;   // the next node becomes the new top
    free(old);
    return value;
}
```

## The Queue: FIFO

A queue applies the opposite rule: the first element added is the first one removed, **FIFO** (*First In, First Out*), like a real-world line of people. It exposes **enqueue** (add at the back) and **dequeue** (remove from the front).

| | Stack | Queue |
|---|---|---|
| Rule | LIFO: last in, first out | FIFO: first in, first out |
| Add | At the top | At the back |
| Remove | At the top | At the front |
| Real-world example | Stack of plates | Line of people |

> **Pitfall:** implementing a queue on top of a plain linked list (like the stack above) without keeping a pointer to the last node. Adding at the back then requires walking the whole list on every `enqueue` (**O(n)**) instead of constant time.
>
> **Best practice:** keep two pointers up to date, one to the first node and one to the last, so `enqueue`/`dequeue` both stay **O(1)**.

Both structures are abstract: nothing forces them to be implemented on top of a linked list. A dynamic array works just as well for a stack (add/remove at the end of the array); a queue then needs a bit more care (removing from the front otherwise shifts every element, unless a dedicated structure like a circular buffer is used, beyond the scope of this chapter).

A cross-cutting concept used far beyond these two structures: a call stack manages recursive function calls, an "undo/redo" history pushes actions onto a stack, a parser often relies on a stack to handle nested parentheses and blocks.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A stack (LIFO) and a queue (FIFO) restrict access to a single end of a linked list or array. A stack pushes/pops at the top; a queue enqueues at the back and dequeues at the front. |
| **Tools you can use** | A linked list for an O(1) stack; two pointers (head/tail) for an O(1) queue. |
| **Pitfalls to avoid** | Implementing a queue without keeping a pointer to the last node, which makes `enqueue` O(n) instead of O(1). |
| **Best practices** | Choose the stack or the queue based on the processing order you actually need, never the other way around by adapting the code afterward. |
