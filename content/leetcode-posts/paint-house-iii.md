# Paint House III

This problem fits into the **state machine** class of top-down DP problems — a left-to-right walk with two pieces of "what just happened" carried along: the previous colour, and how many neighbourhoods we have formed so far.

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

As usual with this family, the work is entirely in phrasing the recursive question. The right one
is:

> If we are at house `i`, the previous house has colour `lastColor`, and `groups` neighbourhoods of
> same-coloured houses have already been formed, what is the cheapest way to end up with exactly
> `target` neighbourhoods in total?

Both extra fields earn their place. `lastColor` is needed because whether painting house `i` some
colour `c` starts a new neighbourhood depends entirely on the colour behind it. `groups` is needed
because the target is a global count that we can only check at the very end.

- **State:** `(i, lastColor, groups)`, with colour `0` standing for "there is no previous house".
- **Transitions:** if the house is already painted, one forced move; otherwise one per colour, so up
  to `n`.
- **Cost:** `m * (n + 1) * (target + 1)` states, each trying up to `n` colours —
  `100 * 21 * 101 * 20`, about 4 million.

```TS
function minCost(houses: number[], cost: number[][], m: number, n: number, target: number): number {
    const INF = 1e15;
    // [house][previous colour, 0 for none][neighbourhoods so far]
    const dp: number[][][] = Array(m).fill(null).map(() =>
        Array(n + 1).fill(null).map(() => Array(target + 1).fill(-1)),
    );

    const res = best(0, 0, 0);
    return res >= INF ? -1 : res;

    // the cheapest way to paint houses[i..] given the previous colour and group count
    function best(i: number, lastColor: number, groups: number): number {
        if (groups > target) {
            return INF; // already too fragmented
        }

        if (i === m) {
            return groups === target ? 0 : INF;
        }

        if (dp[i][lastColor][groups] !== -1) {
            return dp[i][lastColor][groups];
        }

        let res = INF;
        if (houses[i] !== 0) {
            const c = houses[i];
            res = best(i + 1, c, groups + (c !== lastColor ? 1 : 0));
        } else {
            for (let c = 1; c <= n; c++) {
                res = Math.min(
                    res,
                    cost[i][c - 1] + best(i + 1, c, groups + (c !== lastColor ? 1 : 0)),
                );
            }
        }

        return dp[i][lastColor][groups] = res;
    }
}
```

The `groups > target` check at the top is a small but useful pruning: a walk that has already
over-fragmented can never recover, since `groups` only ever grows. And `INF = 1e15` is the "no valid
ending" sentinel — large enough that adding real paint costs to it on the way back up still leaves it
losing every `Math.min`, which is also why the final answer is tested with `res >= INF` rather than
`res === INF`.
