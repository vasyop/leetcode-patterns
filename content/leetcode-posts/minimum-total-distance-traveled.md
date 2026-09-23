# Minimum Total Distance Traveled

This problem fits into the **two-sequence alignment** class of top-down DP problems — two sorted lists walked with a pointer each — and getting there requires a small exchange-argument proof first.

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

The idea is to sort both lists and assign robots to factories one at a time from left to right, which
brings the robot index `ri` into the state. For the factories we need something more compact than "the
remaining capacity of every factory", so we carry the factory index `fi` plus how many repairs have
already been used at that factory. `fi = 3, used = 2` means factory 3 has `factory[3] - 2` repairs
left and all later factories are untouched.

But that encoding cannot express a situation like "three factories, the first and third fully unused,
the second fully used". So before trusting it we have to prove that such situations never need to be
considered — that is, that an optimal assignment never **crosses**.

Consider two robots `r1` and `r2`, with `r1` going to some factory `f1` and `r2` to some factory
`f0 <= f1`. The crossed cost is `(r1 - f1) + (r2 - f0)`. Send `r1` to `f0` and `r2` to `f1` instead and
the cost is `(r1 - f0) + (r2 - f1)` — exactly the same. Working through all the ways `r1`, `r2`, `f0`
and `f1` can be ordered, uncrossing is always at least as good. So any solution with a crossing can be
converted into one without, at no greater cost, and the left-to-right `(ri, fi, used)` encoding loses
nothing.

This kind of two-line proof is worth writing down rather than waving at — it is the difference between
a state you trust and one that happens to pass the tests.

- **State:** `(ri, fi, used)`.
- **Transitions:** two — skip factory `fi` entirely, or send robot `ri` to it.
- **Cost:** `robots * factories * (robots + 1)` states with 2 transitions each — `100 * 100 * 101`,
  about a million.

```TS
function minimumTotalDistance(robot: number[], factory: number[][]): number {
    robot.sort((a, b) => a - b);
    factory.sort((a, b) => a[0] - b[0]);

    const r = robot.length;
    const f = factory.length;
    const dp: number[] = Array(r * f * (r + 1)).fill(-1);

    return cost(0, 0, 0);

    // the cheapest way to place robot[ri..] using factory[fi..],
    // with `used` slots of factory fi already taken
    function cost(ri: number, fi: number, used: number): number {
        if (ri === r) {
            return 0;
        }

        if (fi === f) {
            return 1e13; // robots left with no factory to take them
        }

        const key = (ri * f + fi) * (r + 1) + used;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const skipFactory = cost(ri, fi + 1, 0);
        if (used === factory[fi][1]) {
            return dp[key] = skipFactory; // this factory is full
        }

        return dp[key] = Math.min(
            skipFactory,
            Math.abs(robot[ri] - factory[fi][0]) + cost(ri + 1, fi, used + 1),
        );
    }
}
```
