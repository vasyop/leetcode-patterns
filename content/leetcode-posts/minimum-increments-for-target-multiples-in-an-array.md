# Minimum Increments for Target Multiples in an Array

This problem fits into the **knapsack** class of top-down DP problems with a **bitmask** riding along — one decision per element of `nums`, and the mask records which targets are already satisfied.

## What top-down DP is about

Top-down DP is DFS with a memo. You start from the decision tree the problem describes — one
decision per level — and notice that it is far too large to walk. Then you notice that the same
subtrees keep reappearing in it, because many different sequences of early decisions leave you
facing the exact same remaining problem. Glue every group of duplicate nodes into a single node
and the tree collapses into a graph — a DAG — small enough to walk. The memo is only the
bookkeeping that makes each node run its body once.

A node of that graph is a **state**, a move between two states is a **transition**, and the price
of the whole thing is always

> cost = number of states x work per state

Everything hard about a DP problem is in the state. It has to carry everything the rest of the
walk depends on, and nothing else: carry too little and the label stops identifying a subproblem,
carry too much and the state count multiplies for no reason. Once the state is right, the
transitions are usually a direct transcription of the rules.

To understand the theory behind top-down DP, see
[the top-down DP chapter](https://github.com/vasyop/leetcode-patterns/blob/master/book/05-top-down-DP.md)
of my LeetCode patterns book.

## What is particular about this problem

The walk is the familiar one: left to right over `nums`, one decision per element. The two
insights are about what an element's decision actually *is*, and how to make each transition O(1).

At index `i` we can raise `nums[i]` just enough that it becomes divisible by any **subset** of the
still-unsatisfied targets. Not one target — a subset, because a single number can serve several at
once. So there is one transition per subset, and with `target.length <= 4` there are only 16 of them.

Raising `nums[i]` to be divisible by a whole subset means raising it to a multiple of that subset's
LCM, and the cheapest such value is `Math.ceil(nums[i] / lcm) * lcm`. All `2 ** 4` subset LCMs can be
precomputed before the recursion by folding one target in at a time, so the work inside each
transition is a division and a multiplication.

- **State:** `(i, done)` — the first undecided index, and the bitmask of satisfied targets.
- **Transitions:** leave `nums[i]` alone, or raise it for any subset of the unsatisfied targets — up
  to `2 ** 4`.
- **Cost:** `n * 2 ** 4` states, each trying up to `2 ** 4` subsets — `5e4 * 16 * 16` = 13 million.

```TS
function minimumIncrements(nums: number[], target: number[]): number {
    const n = nums.length;
    const t = target.length;
    const ALL = (1 << t) - 1;

    // the lcm of every subset of targets, folding one target in at a time
    const subsetLcm: number[] = Array(1 << t).fill(1);
    for (let sub = 1; sub <= ALL; sub++) {
        for (let i = 0; i < t; i++) {
            if (sub & (1 << i)) {
                subsetLcm[sub] = lcm(subsetLcm[sub], target[i]);
            }
        }
    }

    const dp: number[] = Array((ALL + 1) * n).fill(-1);

    return fewest(0, 0);

    // the fewest increments over nums[i..] so that every target outside `done`
    // ends up dividing one of them
    function fewest(i: number, done: number): number {
        if (done === ALL) {
            return 0;
        }

        if (i === n) {
            return 1e15;
        }

        const key = done * n + i;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = fewest(i + 1, done); // leave nums[i] alone

        for (let sub = 1; sub <= ALL; sub++) {
            if (sub & done) {
                continue; // this subset aims at an already satisfied target
            }

            const lcmVal = subsetLcm[sub];
            // the smallest multiple of lcmVal that is not below nums[i]: if
            // nums[i] is smaller we lift it all the way up to lcmVal itself,
            // otherwise to the first multiple at or above it (staying put when
            // nums[i] already divides evenly)
            const raiseTo = Math.ceil(nums[i] / lcmVal) * lcmVal;
            res = Math.min(res, raiseTo - nums[i] + fewest(i + 1, done ^ sub));
        }

        return dp[key] = res;
    }

    // the smallest number that both a and b divide; dividing before multiplying
    // keeps the intermediate value from growing past the result
    function lcm(a: number, b: number): number {
        return a / gcd(a, b) * b;
    }

    function gcd(a: number, b: number): number {
        while (b !== 0) {
            const t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
```

One detail in `lcm`: dividing before multiplying (`a / gcd(a, b) * b`) keeps the intermediate value
from growing past the result, which matters as soon as the numbers are large.
