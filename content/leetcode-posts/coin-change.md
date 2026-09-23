# Coin Change

This problem fits into the **knapsack** class of top-down DP problems — the unbounded kind — and it is the best example in the chapter of a DP graph that is *correct* but has far too many edges.

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

The state is easy. The lesson is in the transitions.

The first time I solved this I made the state `(i, rem)` — which coin type we are looking at and how
much change is still owed — and let the recursive call decide *how many* coins of that type to take
before moving on:

```TS
let res = 1e11;
for (let c = 0; c * coins[i] <= rem; c++) {
    res = Math.min(res, c + rec(i + 1, rem - c * coins[i]));
}
```

The problem statement says we have an infinite number of each coin, so "how many of this one?" reads
like the decision being asked for. That graph is valid and it returns the right answer. The trouble is
the edges: a node `(i, rem)` gets one transition for every count that fits, so with a coin of value 1
and `rem = 10000`, that single node has ten thousand of them. And nearly all are redundant — the
transition taking four coins at once lands on `(i + 1, rem - 4 * coins[i])`, which is exactly where we
arrive by taking one coin four times over, and the states it flies over on the way are already sitting
in the table.

It is the same mistake as solving House Robber by trying to skip 1, 2, 3, ... `n` houses in a row from
every house. All those skips are legal and the answer still comes out right, but a skip of four is
only four skips of one.

So we let the recursion do the repeating. From `(i, rem)` there are exactly two moves: take one more
coin of type `i` and **stay on `i`**, or give up on type `i` for good and move to `i + 1`.

```TS
    take = 1 + rec(i, rem - coins[i])
    skip = rec(i + 1, rem)
```

- **State:** `(i, rem)`.
- **Transitions:** two.
- **Cost:** `n * (amount + 1)` states with 2 transitions each — `12 * 10001`, about 120 thousand
  steps, down from roughly 105 million for the version above.

For what it is worth, I made the same mistake again a few months later on my second attempt at this
problem. The pull towards "how many of this coin?" is strong, because that is how the statement is
phrased. The fix is to remember that the question a state answers has to be about **the rest of the
input**, not about one item.

```TS
function coinChange(coins: number[], amount: number): number {
    const n = coins.length;
    const dp: number[] = Array(n * (amount + 1)).fill(-1);

    const res = rec(0, amount);
    return res >= 1e11 ? -1 : res;

    // the fewest coins from coins[i..] that add up to exactly rem
    function rec(i: number, rem: number): number {
        if (rem === 0) {
            return 0;
        }

        if (i === n) {
            return 1e11; // out of coin types with change still owed
        }

        const key = i * (amount + 1) + rem;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = rec(i + 1, rem); // done with this coin type
        if (coins[i] <= rem) {
            res = Math.min(res, 1 + rec(i, rem - coins[i])); // take one more
        }

        return dp[key] = res;
    }
}
```

The same trap shows up in Regular Expression Matching (looping over how many characters a `*` eats)
and in Minimum Time to Build Blocks (looping over how many workers to assign at once). In all three
the fix is identical: one short step, and let the memo supply the rest.
