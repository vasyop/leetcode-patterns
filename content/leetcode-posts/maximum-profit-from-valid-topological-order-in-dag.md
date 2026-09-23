# Maximum Profit From Valid Topological Order in DAG

This problem fits into the **bitmask** class of top-down DP problems — we are searching for the best permutation, and the set of nodes already placed is what identifies a position in it.

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

With `n = 22`, bitmask DP should come to mind before anything else. We need an optimal ordering, so
the state is the set of nodes already placed, and a node of the DP graph asks: what is the best score
obtainable by arranging everything that is left?

The dependency rule folds neatly into the transition test. Precompute, for every node, the mask of
its parents; then a node is ready to be placed exactly when `(parents[i] | placed) === placed` — all
its parents are already in. One or and one compare, no traversal.

`count` (how many nodes are placed) is a parameter but not part of the state: it is always the
popcount of `placed`. It is needed for the score multiplier, so it rides along, but keeping it out of
the memo key is what avoids multiplying the state count by 22 for nothing.

- **State:** `placed`, the bitmask of nodes already in the ordering.
- **Transitions:** one per node that is not placed and whose parents all are.
- **Cost:** `2 ** n` states with `n` transitions each — 4 million times 22, about 92 million, down
  from `22!` orderings.

That is almost four times past the 25-million rule of thumb, and indeed it passes in about 1.4 s.
Two things make it acceptable. First, in a DAG with real dependencies a large fraction of the masks
is simply unreachable: for every `A -> B` edge, every permutation with `B` before `A` is invalid, and
its whole subgraph disappears. Second, the work inside the loop is tiny — a shift, an or, two
compares, and no recursive call at all unless the node is ready.

```TS
function maxProfit(n: number, edges: number[][], score: number[]): number {
    const parents: number[] = Array(n).fill(0);
    for (const [a, b] of edges) {
        parents[b] |= 1 << a;
    }

    const dp: number[] = Array(1 << n).fill(-1);

    return best(0, 0);

    // the most we can still earn, having placed the nodes in `placed`
    // in the first `count` positions (count is popcount(placed))
    function best(count: number, placed: number): number {
        if (count === n) {
            return 0;
        }

        if (dp[placed] !== -1) {
            return dp[placed];
        }

        let res = 0;
        for (let i = 0; i < n; i++) {
            const node = 1 << i;
            const ready = (parents[i] | placed) === placed; // all parents already placed
            if (!(placed & node) && ready) {
                res = Math.max(res, (count + 1) * score[i] + best(count + 1, placed | node));
            }
        }

        return dp[placed] = res;
    }
}
```
