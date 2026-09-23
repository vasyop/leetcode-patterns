# Best Time to Buy and Sell Stock V

This problem fits into the **state machine** class of top-down DP problems, and it is the one with every piece of that family on the table at once.

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

A state machine problem is a sequence walked from left to right with a little bit of "what just
happened" carried along: whether we are holding a stock, which of two arrays we are walking, the
colour of the last house we painted, how many switches we have left. The state is `(index, mode)`,
there is a handful of modes, and the transitions are the legal ways to move between them. The index
is obvious. Inventing the mode is the whole job.

Here we walk `prices` day by day and may complete at most `k` transactions, of two kinds: the normal
one (buy now, sell later, for `prices[j] - prices[i]`) and the short sale (sell now, buy back later,
for `prices[i] - prices[j]`). Only one transaction may be open at a time.

"Only one at a time" is what turns this into a machine with a handful of modes. At the start of any
day we are in exactly one of three positions: short (we sold and still owe a buy-back), flat
(nothing open), or long (we bought and still have to sell). Better still, the three sit on a line —
a buy always moves one step right, a sell always moves one step left:

```
                buy                buy
       short ---------> flat ---------> long
             <---------      <---------
                sell               sell
```

Numbering them `-1`, `0` and `1` makes the code intuitive: `0` means we don't have it, `1` means we
have it, `-1` means we owe it. A buy is legal whenever `status < 1`, costs `prices[i]`, and lands on
`status + 1`; a sell is legal whenever `status > -1`, collects `prices[i]`, and lands on
`status - 1`. Opening a long and covering a short are both "buy" and both pay the same money, which
is why the two kinds of transaction need no separate code at all.

What the arrows don't say is *when* a transaction is closed — when to count one less transaction
available. The choice here is to charge it when a position is closed, which is what
`status === 0 ? remK : remK - 1` says in both branches: leaving `0` is free, arriving at `0` costs
one.

- **State:** `(day, position, transactions left)`.
- **Transitions:** do nothing; buy, when `status < 1`; sell, when `status > -1`.
- **Cost:** `3 * n * (k + 1)` states with O(1) work each. With `n <= 1000` and `k <= n / 2`, at most
  about 1.5 million.

```TS
function maximumProfit(prices: number[], k: number): number {
    const n = prices.length;
    // status: -1 short (owes a buy), 0 flat, 1 long (owes a sell)
    const dp: (number | null)[][][] = Array(3).fill(null).map(() =>
        Array(n).fill(null).map(() => Array(k + 1).fill(null)),
    );

    return rec(0, 0, k);

    // the most we can still make from day i on, in this position and budget
    function rec(i: number, status: number, remK: number): number {
        if (i === n) {
            return status === 0 ? 0 : -1e11; // may not end mid-transaction
        }

        const row = dp[status + 1][i]; // status + 1 keeps the index in 0..2
        const hit = row[remK];
        if (hit !== null) {
            return hit;
        }

        let best = rec(i + 1, status, remK); // do nothing today
        if (!remK) {
            return (row[remK] = best);
        }

        if (status < 1) {
            // buy: open a long, or cover a short and end a transaction
            const newRemK = status === 0 ? remK : remK - 1;
            best = Math.max(best, -prices[i] + rec(i + 1, status + 1, newRemK));
        }

        if (status > -1) {
            // sell: open a short, or close a long and end a transaction
            const newRemK = status === 0 ? remK : remK - 1;
            best = Math.max(best, prices[i] + rec(i + 1, status - 1, newRemK));
        }

        return (row[remK] = best);
    }
}
```

Two details. The base case returns `-1e11` when the walk ends anywhere other than flat, because a
plan that leaves a position open is not a valid plan, and a hugely negative number is the standard
way to say "impossible" inside a `Math.max` — it can never win a comparison. And the early
`if (!remK) return best` looks like it might strand us holding a stock with no budget left to sell
it, but it can't: budget is only ever spent on *closing*, so a position opened while `remK >= 1`
still has that unit waiting to pay for its own close.

For a table this shape, flattening it into a single array is worth doing:
`dp[((status + 1) * n + i) * K1 + remK]` is one memory load instead of three dependent ones.
