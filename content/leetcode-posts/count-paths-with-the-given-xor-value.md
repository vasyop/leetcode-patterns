# Count Paths With the Given XOR Value

This problem fits into the **explicit graph** class of top-down DP problems — the grid is the graph, already drawn for us — with one accumulator added to each cell.

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

A right-and-down grid walk is the friendliest kind of explicit graph: the nodes and edges are handed
to us, and all that is left is to work out what extra label a cell needs.

Here the answer depends on the xor of everything on the path, so that has to ride along. The cheap
part is that it stays small: cell values and `k` are all below 16, and xor never produces a bit that
wasn't in one of its inputs, so the running xor also stays below 16. Each cell therefore maps to 16
states rather than one.

- **State:** `(row, col, xor so far)`.
- **Transitions:** two — right, or down.
- **Cost:** `m * n * 16` states with 2 transitions each — at the maximum 300 by 300 grid, 1.4 million
  states.

```TS
function countPathsWithXorValue(grid: number[][], k: number): number {
    const MOD = 1e9 + 7;
    const m = grid.length;
    const n = grid[0].length;
    const dp: number[] = Array(m * n * 16).fill(-1);

    return count(0, 0, 0);

    function count(i: number, j: number, acc: number): number {
        if (i === m || j === n) {
            return 0;
        }

        acc ^= grid[i][j];

        if (i === m - 1 && j === n - 1) {
            return acc === k ? 1 : 0;
        }

        const key = (i * n + j) * 16 + acc;
        if (dp[key] !== -1) {
            return dp[key];
        }

        return dp[key] = (count(i + 1, j, acc) + count(i, j + 1, acc)) % MOD;
    }
}
```

A detail in the code: `acc ^= grid[i][j]` happens *before* the memo key is computed, so the `acc`
stored in the key already includes the current cell. That is consistent as long as you read the state
as "standing on `(i, j)` with this cell already folded in", which is exactly what the base case
checks.

This is also the table whose size the chapter uses to make the flat-array argument: filling and
reading back 1.44 million entries takes about 13 ms as a nested `number[][][]` and about 3.5 ms flat.
Same complexity, same number of steps, nearly 4 times the wall clock.
