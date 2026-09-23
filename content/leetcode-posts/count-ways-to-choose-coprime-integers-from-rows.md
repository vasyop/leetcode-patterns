# Count Ways to Choose Coprime Integers from Rows

This problem fits into the **knapsack**-shaped class of top-down DP problems: a left-to-right walk over the rows with a single accumulator carried down — here the running gcd.

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

One number is picked from every row, and the whole selection is judged by a single quantity: the gcd
of everything picked so far. That is the state, and the reason it stays small is that a gcd of numbers
up to 150 is itself at most 150 — the accumulator can never grow past its own inputs.

- **State:** `(row, gcd so far)`.
- **Transitions:** one per entry in the current row.
- **Cost:** `m * 151` states with one transition per row entry, so `150 ** 3 = 3.3` million overall.
  The `gcd` calls add to that, but with numbers this small it is negligible — the Euclidean algorithm
  needs on the order of `log2(150) ~ 7` iterations.

`0` is the "nothing picked yet" value, which works because `gcd(0, x) === x`: the first row sets the
accumulator with no special case.

```TS
function countCoprime(mat: number[][]): number {
    const MOD = 1e9 + 7;
    const m = mat.length;
    const dp: number[][] = Array(m).fill(null).map(() => Array(151).fill(-1));

    return count(0, 0);

    // the number of ways to pick from rows idx.. so that the gcd of everything,
    // this row and the g accumulated above, is 1
    function count(idx: number, g: number): number {
        if (idx === m) {
            return g === 1 ? 1 : 0;
        }

        if (dp[idx][g] !== -1) {
            return dp[idx][g];
        }

        let res = 0;
        for (const value of mat[idx]) {
            res = (res + count(idx + 1, gcd(g, value))) % MOD;
        }

        return dp[idx][g] = res;
    }

    // gcd(0, x) is x, which is exactly what the first row needs
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

Because there are only 150 possible values in the grid, and the gcd only ever gets smaller, you can
precompute a full `gcd(x, y)` table for `x, y <= 150` and drop the Euclidean loop entirely. The code
above is already fast enough, but it is a cheap win if you need it.
