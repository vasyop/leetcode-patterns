# Maximum Amount of Money Robot Can Earn

This problem fits into the **explicit graph** class of top-down DP problems — a right-and-down grid walk — with one small counter added to the state.

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

Right-and-down grid again, so the graph is given. The only question is what a cell has to remember,
and the answer is: how many neutralizations are left. That makes 3 versions of each cell.

The transitions double accordingly: from a cell we can go down or right, and we can also choose to
neutralize this cell first and *then* go down or right — four moves in total.

- **State:** `(row, col, neutralizations left)`.
- **Transitions:** four — down or right, each with or without spending a neutralization (and the
  spending versions only when the cell is negative and we still have one).
- **Cost:** `m * n * 3` states with 4 transitions each.

One small convenience. Rather than guarding every move against the edges of the grid, we simply let
the recursion walk off and return `-1e11` there. Because everything is wrapped in `Math.max`, an
invalid path can never be chosen, and the boundary checks vanish from the transition code.

```TS
function maximumAmount(coins: number[][]): number {
    const m = coins.length;
    const n = coins[0].length;
    // [row][col][neutralizations left]
    const dp: (number | null)[] = Array(m * n * 3).fill(null);

    return best(0, 0, 2);

    // the most we can still collect walking from (r, c) to the corner
    function best(r: number, c: number, left: number): number {
        if (r === m || c === n) {
            return -1e11; // walked off the grid
        }

        const key = (r * n + c) * 3 + left;
        const hit = dp[key];
        if (hit !== null) {
            return hit;
        }

        const v = coins[r][c]; // cell value

        if (r === m - 1 && c === n - 1) {
            // the last cell: take it, or neutralize it if it hurts and we still may
            return dp[key] = v < 0 && left > 0 ? 0 : v;
        }

        // don't neutralize
        let res = v + Math.max(best(r + 1, c, left), best(r, c + 1, left));

        // neutralize, if possible
        if (v < 0 && left > 0) {
            res = Math.max(
                res,
                best(r + 1, c, left - 1),
                best(r, c + 1, left - 1)
            );
        }

        return dp[key] = res;
    }
}
```

Note the `null` memo sentinel rather than `-1`: coin values can be negative, so a real answer of `-1`
is perfectly possible and using it as the "not computed yet" marker would be a silent bug.
