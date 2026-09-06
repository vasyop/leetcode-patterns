[← Back to contents](00-contents.md)

# Constraints and time complexity

## Prerequisites

- big O time/space complexity theory

## Analyzing problem constraints

For almost every problem, there is a trade-off between simplicity and speed.

If we choose brute force, we can often write the solution quickly and prove that it is correct, but it will usually be too slow. At the other extreme, we may find a highly optimized solution that is theoretically fast but difficult to understand, debug, and implement correctly.

Our goal is therefore not to find the fastest algorithm imaginable. It is to find the simplest algorithm that is fast enough for the given constraints.

This is why you should analyze the constraints before committing to an approach. The maximum input size gives you a rough upper bound on the time complexity that the problem expects.

Suppose the input is an array of length `n`. As a practical approximation:

- If `n` is around `10⁶`, an `O(n)` solution should pass, and an `O(n log n)` solution will often pass. Anything significantly slower is unlikely to pass.
- If `n` is around `10⁵`, `O(n log n)` and faster solutions should comfortably pass. `O(n log² n)` and `O(n √n)` may also pass, depending on the implementation and time limit.
- If `n` is around `10⁴`, `O(n √n)` should usually pass. Adding another logarithmic factor may still be acceptable.
- If `n` is around `10³`, an `O(n²)` or `O(n² log n)` solution will usually pass. An `O(n³)` solution probably will not, unless the constant factors are exceptionally small or the real input is more restricted than the headline constraint suggests.

These are not mathematical laws. They are rough estimates intended to help you choose between possible approaches.

One way to think about this is to remember a magic number: approximately **25 million simple operations**.

If your algorithm performs significantly fewer than 25 million simple operations, it will probably be fast enough. If it performs significantly more (perhaps closer to `100 million`), you should become suspicious. This number depends on the language, the platform, the time limit, and the operations being performed, but it is a useful starting point.

For example:

```text
n = 100,000

O(n)             ≈       100,000 operations
O(n log n)       ≈     1,700,000 operations
O(n log² n)      ≈    29,000,000 operations
O(n √n)          ≈    31,600,000 operations
O(n²)            ≈ 10,000,000,000 operations
```

This immediately tells us that an `O(n²)` solution is not realistic for `n = 100,000`. We do not need to implement it and submit it to find out.

However, the phrase “simple operation” hides a lot of detail.

An expression such as:

```ts
dp[i] = nums[i] + dp[i + 1];
```

contains several tiny operations, but they are all cheap. Reading a value from an array, adding two numbers, comparing two numbers, and assigning a value are approximately the kind of operations we have in mind when making these estimates.

The following operation is different:

```ts
map.set(key, value);
```

A hash-map insertion is still expected to take `O(1)` time, but it is much more expensive than adding two numbers. The runtime must hash the key, locate the appropriate storage location, possibly resolve a collision, and occasionally resize the underlying table. For rough mental calculations, I might count one map operation as ten or more tiny operations.

Even that is only an approximation. There is no precise conversion between an algorithmic “step” and real execution time. The only way to know exactly how fast a particular implementation is in a particular language is to measure it.

The programming language also matters. JavaScript and TypeScript are often relatively slow at creating many objects and following pointers between them. C++ can handle some of these operations much more efficiently, particularly when objects are stored directly in contiguous memory.

This means that two implementations with exactly the same time complexity can have very different running times.

Consider a segment tree (if you don't know what a segment tree is, consider complete binary tree). We could represent every node as an object containing references to its children:

```ts
class Node {
    left: Node | null;
    right: Node | null;
    value: number;
}
```

This representation is natural and may be easier to understand. However, it creates many objects scattered throughout memory. Traversing the tree requires repeatedly following references from one object to another.

We could instead flatten the same segment tree into an array:

```ts
const tree = new Array(4 * n).fill(0);
```

Both implementations have the same theoretical complexities. Construction is `O(n)`, and each query or update is `O(log n)`. Despite this, the array implementation can be much faster (~5-10 times) because it avoids creating thousands of objects and stores its data in contiguous memory. CPUs and memory caches are very good at processing contiguous data.

Recursion can cause similar problems. A recursive and an iterative DFS are both `O(n + m)`, but recursion has function-call overhead and may exceed the call-stack limit. This does not make the complexity analysis wrong. It means that Big O notation deliberately ignores details that may still matter in practice.

Online judges try to compensate for differences between languages by giving slower languages larger time limits or applying language-specific time limits. This system helps, but it is not perfect.

Occasionally, an algorithm passes even though the constraints suggest that it should not. For example, an `O(n²)` algorithm with `n = 10^4` implies approximately 100 million iterations and would usually be rejected. However, it might pass if every iteration performs only a few extremely cheap bitwise operations. The same algorithm might time out if each iteration accesses several arrays, creates objects, or performs hash-map operations.

You should not build your normal problem-solving strategy around such cases. A solution that passes only because the test data is weak, the constant factors happen to be tiny, or some valid worst-case input is missing is not a reliable solution. It may be rejected during contest review, and it would not be acceptable in an interview once its true worst-case complexity is noticed.

The opposite situation is more common: an algorithm that appears fast enough in theory still times out.

This can happen because:

- its constant factors are large;
- it creates too many objects;
- it performs many hash-map operations;
- it has poor cache locality;
- it repeatedly allocates and copies arrays;
- its recursion or function-call overhead is high;
- its average complexity is good, but its worst case is not;
- the language is inefficient at the operations used by the algorithm.

This may sound like constraints are too complicated to be useful. They are not.

In roughly 95 percent of problems, choosing an algorithm whose time complexity reasonably respects the constraints is enough. An `O(n log n)` solution for `n = 10⁵` will normally work. An `O(n²)` solution for the same input size normally will not. You do not need to estimate every individual CPU instruction.

The unusual cases become important only near the boundary. If one possible solution performs five million simple array operations and another performs five billion operations, the choice is obvious. If one performs 20 million operations and another performs 40 million, implementation details may decide which one passes.

Constraint analysis is therefore not about predicting the exact runtime. It is about eliminating impossible approaches and identifying the range of approaches that are likely to be fast enough.

We are going to practice constrains analysis throughout the problems in this book.

## The oracle

An oracle is a small program you build — or have ready before a contest — to catch bugs in your optimized solution. The idea is simple: write a brute-force solution you are confident is correct, write a random input generator that produces small inputs, then run both solutions on thousands of random tests and compare their outputs. When they disagree, you have a counterexample; when they agree consistently, you gain confidence that your optimized solution is correct.

The oracle is most valuable when your optimized solution has tricky edge cases or non-obvious logic, but the brute force is short and obviously correct. It is also only practical when generating random inputs is straightforward — if constructing a valid random input requires significant effort, the oracle may not be worth building. But in many problems, especially those involving arrays, strings, or small graphs, a generator is a few lines and the brute force is a nested loop. In that case, an oracle can find a bug in minutes that might take an hour to find by reasoning alone. Other times, the problem has hidden test cases during contest.

We will not worry about using an oracle for the most part of this book, but it's a very useful concept to know about.


[← Back to contents](00-contents.md)
