# Maximum Non Negative Product in a Matrix

This problem fits into the **explicit graph** class of top-down DP problems — a right-and-down grid walk — with the twist that a single number per state is not enough.

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

Right-and-down grid again, so the graph is handed to us. What is unusual is the value a node returns.

Normally a state returns "the best result from here". That breaks with multiplication: if the current
cell is negative, the path we want below it is the one with the **smallest** product, because
multiplying by a negative flips the ordering. Neither the maximum alone nor the minimum alone is
enough to compute the answer one step up — we need both.

So a state returns a *pair*: the smallest and the largest product reachable from it. The recurrence
takes the four candidates (this cell times each child's low and high) and keeps the extremes.

- **State:** `(i, j)`.
- **Value:** a pair `[smallest, largest]` rather than a single number.
- **Transitions:** two — right, or down.
- **Cost:** `m * n` states, each returning a pair — 225 states at the maximum 15 by 15 grid.

One practical detail that is easy to miss: the grid is at most 15 by 15 and cells go up to 4 in
magnitude, so a product can reach `4 ** 29`, well past the `2 ** 53` that a JavaScript number holds
exactly. The comparisons have to be exact for the DP to be right, so the products are `BigInt` and
the modulo is applied once, at the very end. Taking the modulo during the walk would destroy the
ordering the DP depends on.

```TS
function maxProductPath(grid: number[][]): number {
    const MOD = 1000000007n;
    const m = grid.length;
    const n = grid[0].length;
    // [smallest product, largest product] over all paths from (i, j) to the corner
    const dp: ([bigint, bigint] | null)[][] = Array(m).fill(null).map(() => Array(n).fill(null));

    const [, largest] = range(0, 0);
    return largest < 0n ? -1 : Number(largest % MOD);

    function range(i: number, j: number): [bigint, bigint] {
        const v = BigInt(grid[i][j]);

        if (i === m - 1 && j === n - 1) {
            return [v, v];
        }

        const hit = dp[i][j];
        if (hit !== null) {
            return hit;
        }

        let lo: bigint | null = null;
        let hi: bigint | null = null;
        for (const [ni, nj] of [[i + 1, j], [i, j + 1]]) {
            if (ni === m || nj === n) {
                continue;
            }
            const [clo, chi] = range(ni, nj);
            for (const cand of [v * clo, v * chi]) {
                if (lo === null || cand < lo) {
                    lo = cand;
                }
                if (hi === null || cand > hi) {
                    hi = cand;
                }
            }
        }

        return dp[i][j] = [lo!, hi!];
    }
}
```

"A state may return more than one number" is a useful thing to keep in your pocket. Any time the
comparison that picks the best child is not monotonic, look for the small set of extra quantities
that makes it monotonic again.
