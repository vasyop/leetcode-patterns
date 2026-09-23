# Minimum Time to Build Blocks

This problem fits into the **knapsack**-shaped class of top-down DP problems — a left-to-right walk over the blocks with one resource counter in the state — and it needs a greedy observation before the DP is even well defined.

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

> `blocks[i]` is the time to build block `i`, and `split` is the time for a worker to split into two.
> Workers act in parallel: two splitting at the same moment still cost `split` overall, and two
> building at the same time finish after the slower block. You start with one worker. Return the
> minimum time until every block is built. `blocks.length <= 1000`.

Two things have to happen before the DP.

**Sort descending.** There is never a reason to start a faster block before a slower one, so workers
take blocks left to right from a descending array. That is what lets a single index describe "which
blocks are still unbuilt".

**Assign one worker at a time.** At any point with `w` available workers we can assign one or more of
them to the blocks that follow, or split them all and wait `split`. Writing "assign one *or more*" as
a loop would give a node up to `w` transitions — and they would be redundant, because assigning three
workers at once lands exactly where assigning one worker three times lands. So we assign the first one
and transition to the same point in time, exactly as in
[Coin Change](https://leetcode.com/problems/coin-change/): one short edge, and let the memo supply the
rest.

- **State:** `(i, w)` — the first unbuilt block, and how many workers are available.
- **Transitions:** two — assign one worker to block `i`, or split every worker and wait.
- **Cost:** `n * n` states with 2 transitions each.

The `Math.max` in the assign branch is the parallelism: block `i` and everything the remaining workers
do happen at the same time, so the cost is the slower of the two.

```TS
function minBuildTime(blocks: number[], split: number): number {
    const n = blocks.length;
    blocks.sort((x, y) => y - x);
    const dp: number[][] = Array(n).fill(null).map(() => Array(n + 1).fill(-1));

    return best(0, 1);

    // the time needed to finish blocks[i..] with w workers available
    function best(i: number, w: number): number {
        if (i === n) {
            return 0;
        }

        if (w >= n - i) {
            return blocks[i]; // a worker each, so the slowest block decides
        }

        if (w === 0) {
            return 1e15;
        }

        if (dp[i][w] !== -1) {
            return dp[i][w];
        }

        const assign = Math.max(blocks[i], best(i + 1, w - 1));
        const wait = split + best(i, w * 2);

        return dp[i][w] = Math.min(assign, wait);
    }
}
```

The `w >= n - i` shortcut also caps the second dimension: once there are more workers than blocks
left, the answer is immediate, so `w` never needs to be indexed beyond `n`.
