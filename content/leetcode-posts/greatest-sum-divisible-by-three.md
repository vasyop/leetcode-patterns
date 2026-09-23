# Greatest Sum Divisible by Three

This problem fits into the **knapsack** class of top-down DP problems, and it doubles as the smallest possible **state machine** — three modes, one per remainder.

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

The knapsack family is the take-or-skip tree — one item per level, in or out — but with extra state
carried down beside the index: money left to spend, capacity left, how many items we still have to
pick, or, here, the running sum modulo something.

The tree is the obvious one: one decision per element, `2 ** n` leaves, and with `n` up to 40000
that is not a tree anyone is going to walk. Taking `a[i]` and skipping it both leave us standing at
`i + 1`, so the two transitions out of every place land on the very same next place:

```
    .----take---.           .----take---.
    |           v           |           v
   i=0 -skip-> i=1 -skip-> i=2 -skip-> END
                |           ^
                '----take---'
```

Eight leaves collapse into four nodes. The trouble is the modulo constraint: by the time we reach
`END`, the sum has to be divisible by 3. So instead of one place per index we need three versions
of each index, one per remainder. Here is that graph for `a = [1, 2, 1]`, where `i|m` means
"standing at index `i`, with the sum so far leaving `m` when divided by 3":

```
     |
m=2  |                               ----------------->2|2 ---------->3|2
     |                               |                     \       /
     |                               |                      \    /
     |                               |                       \ /
     |                               |                        X
     |                               |                      /  \
m=1  |              ----------->1|1 ----------------->2|1 /-----\--->3|1
     |             /             |   |                           \  /
     |            /              |   |                            X
     |           /               |------------------->|         /  \
     |          /                    |                |       /     \
     |         /                  ___|                |     /        \
m=0  | -> 0|0 ----------------->1|0 ----------------->2|0 ----------->3|0
     |
     +--------------------------------------------------------------------
          i=0                   i=1                   i=2             i=3
```

Every horizontal arrow is a _skip_ — the index advances, the modulo does not. Every diagonal is a
_take_ — the index advances and the modulo shifts up by `a[i] % 3`, wrapping from row 2 back to
row 0. That is why the take out of `2|2` dives all the way to `3|0`: `(2 + 1) % 3 === 0`. The three
grid positions with no node (`0|1`, `0|2`, `1|2`) are simply unreachable. We enter at the
bottom-left and the answer lives in the bottom-right; `3|1` and `3|2` are final states too, but
they fail the divisibility test.

- **State:** `(i, mod3)`.
- **Transitions:** two — take `a[i]`, which moves to `(i + 1, (mod3 + a[i]) % 3)`, or skip it, which
  moves to `(i + 1, mod3)`.
- **Cost:** `3 * n` states with 2 transitions each. With `n = 4 * 10⁴` that is not even 1 million
  steps.

```TS
function maxSumDivThree(a: number[]): number {
    const n = a.length;
    const dp: number[][] = Array(3)
        .fill(null)
        .map(() => Array(n).fill(-1));

    return rec(0, 0);

    // the largest sum we can still add from a[i..], given the sum so far is mod3 (mod 3)
    function rec(i: number, mod3: number): number {
        if (i === n) {
            return mod3 === 0 ? 0 : -1e11;
        }

        if (dp[mod3][i] !== -1) {
            return dp[mod3][i];
        }

        return (dp[mod3][i] = Math.max(
            a[i] + rec(i + 1, (mod3 + a[i]) % 3), // take a[i]
            rec(i + 1, mod3) // skip it
        ));
    }
}
```

Two implementation notes.

`Array(3).fill(null).map(() => Array(n).fill(-1))` is much faster than
`Array(n).fill(null).map(() => Array(3).fill(-1))`, so `dp[mod3][i]` instead of `dp[i][mod3]` is
intentional. Fewer, longer rows means fewer allocations and better locality — the code would pass
either way here, but for other problems it won't.

The `-1e11` returned for terminal states with `m != 0` is smaller than `-sum(a)`, which guarantees
`Math.max` never prefers a direction leading to an invalid final state. Only `n|0` is valid. With
an array such as `[2, 2]` there is no non-empty subset whose sum is divisible by 3, and the best
answer is the empty subset, which always has `m === 0`. You can make this explicit by returning
`-Infinity` and checking every child before adding to it, but that is three extra branches to say
what one very negative number said on its own.
