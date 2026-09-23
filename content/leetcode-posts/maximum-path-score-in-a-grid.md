# Maximum Path Score in a Grid

This problem fits into the **explicit graph** class of top-down DP problems — a right-and-down grid walk — with a knapsack-style budget riding along in the state.

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

Another best-path-in-a-grid, but this time the path also has to stay within a cost limit `k`. That
limit is what the extra dimension is for: there are `k + 1` versions of every cell, one per amount of
budget still in hand when we arrive at it.

This is the same move as any knapsack — the capacity becomes a dimension of the table — applied to a
graph walk instead of an item list.

- **State:** `(i, j, budget)`.
- **Transitions:** two — right, or down, each paying this cell's cost.
- **Cost:** `m * n * k` states with 2 transitions each — about 16 million at the top end, all of it
  O(1) work.

Two small conveniences in the code. Walking off the grid returns `-1e11`, so no boundary checks are
needed in the transitions — `Math.max` will never choose an invalid path. And a budget that cannot
even cover the current cell returns the same sentinel, which handles the "cannot afford to stand
here" case in the same line.

```TS
const COST = [0, 1, 1]; // a cell with value 0 is free, any other cell costs 1

function maxPathScore(grid: number[][], k: number): number {
    const m = grid.length;
    const n = grid[0].length;
    const dp: number[] = Array(m * n * (k + 1)).fill(-1);

    return Math.max(-1, score(0, 0, k));

    // the best score from (i, j) to the corner, with this much budget left
    function score(i: number, j: number, budget: number): number {
        if(i === m || j === n) {
            return -1e11;
        }
        const cost = COST[grid[i][j]];
        if (budget < cost) {
            return -1e11; // cannot even afford to stand here
        }

        const s = grid[i][j];
        if (i === m - 1 && j === n - 1) {
            return s;
        }

        const key = (i * n + j) * (k + 1) + budget;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const right = score(i, j + 1, budget - cost)
        const down = score(i + 1, j, budget - cost)

        return dp[key] = s + Math.max(right, down);
    }
}
```

The outer `Math.max(-1, ...)` is what converts "no path fits in the budget" — a deeply negative
sentinel — into the `-1` the problem wants.
