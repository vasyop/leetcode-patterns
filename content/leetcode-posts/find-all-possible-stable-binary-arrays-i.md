# Find All Possible Stable Binary Arrays I

This problem fits into the **state machine** class of top-down DP problems — a sequence built one item at a time with the current run carried along — and it is a good example of a field that drops out of the state because it is implied by the others.

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

The third condition looks intimidating until you remember that every item is either 0 or 1. Then it
rephrases to something much friendlier: **there can never be more than `limit` consecutive zeros, nor
more than `limit` consecutive ones.**

That phrasing suggests `(index, lastChar, lastCharStreak)` straight away, with transitions into
states where `lastCharStreak > limit` simply forbidden.

But `index` on its own is not enough, because what we are still *allowed* to place depends on how many
zeros and ones are left to place. And once we track those two, they give us the index for free —
whatever is not left has been placed — so `index` drops out of the state entirely.

- **State:** `(zerosLeft, onesLeft, lastChar, lastCharStreak)`.
- **Recursive question:** how many stable arrangements of the remaining zeros and ones are there,
  given that they continue a run of `lastCharStreak` copies of `lastChar`?
- **Transitions:** two — place a 0, or place a 1. Placing the same character as `lastChar` extends the
  run (and is forbidden at the cap); placing the other starts a fresh run of length 1.
- **Cost:** `200 * 200 * 2 * 200` = 16 million states with 2 transitions each = 32 million.

A streak of `0` is the "nothing placed yet" state: no run is in progress, so the first item is free to
be either value, with no special case in the code.

```TS
function numberOfStableArrays(zero: number, one: number, limit: number): number {
    const MOD = 1e9 + 7;
    // dimensions: [zeros left][ones left][last char][streak of that char]
    const dp: number[] = Array((zero + 1) * (one + 1) * 2 * (limit + 1)).fill(-1);

    return count(zero, one, 0, 0);

    // arrangements of the remaining zeros and ones which keep every run at most limit long
    function count(zeros: number, ones: number, last: number, streak: number): number {
        if (!zeros && !ones) {
            return 1;
        }

        const key = ((zeros * (one + 1) + ones) * 2 + last) * (limit + 1) + streak;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 0;
        // placing the same char extends the run, placing the other one starts a fresh run
        if (zeros && !(last === 0 && streak === limit)) {
            res += count(zeros - 1, ones, 0, last === 0 ? streak + 1 : 1);
        }
        if (ones && !(last === 1 && streak === limit)) {
            res += count(zeros, ones - 1, 1, last === 1 ? streak + 1 : 1);
        }

        return dp[key] = res % MOD;
    }
}
```

At 16 million entries the memo has to be a flat array. A nested four-dimensional
`number[][][][]` would mean hundreds of thousands of separate allocations and four dependent memory
loads per access; the flat index `((zeros * (one + 1) + ones) * 2 + last) * (limit + 1) + streak` is
one load.
