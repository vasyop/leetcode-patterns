# Minimum Swaps To Make Sequences Increasing

This problem fits into the **state machine** class of top-down DP problems, with the smallest possible mode: one bit saying whether the previous index was swapped.

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

The key observation is how little the past matters. If we are standing at index `i`, we may assume
every index before it already forms two increasing prefixes — otherwise the walk would have been
abandoned. To decide whether index `i` can be left alone or swapped, we only need to know what is
actually sitting behind us at `i - 1`, and that depends on a single earlier decision: was `i - 1`
swapped or not?

So the mode is one bit. Everything else about the prefix — which of the first `i - 1` indices were
swapped, how many swaps that cost — is irrelevant to the rest of the walk.

- **State:** `(i, prevSwapped)`.
- **Transitions:** two — don't swap index `i`, or swap it at a cost of 1. Each is kept only when both
  arrays stay strictly increasing across the boundary.
- **Cost:** `n * 2` states with 2 transitions each.

The entry point handles index 0 outside the recursion, since there is nothing behind it:
`Math.min(count(1, 0), 1 + count(1, 1))`.

```TS
function minSwap(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const dp: number[] = Array(n * 2).fill(-1);

    return Math.min(count(1, 0), 1 + count(1, 1));

    // the fewest swaps over indices i.., given whether index i - 1 was swapped
    function count(i: number, prevSwapped: number): number {
        if (i === n) {
            return 0;
        }

        const key = i * 2 + prevSwapped;
        if (dp[key] !== -1) {
            return dp[key];
        }

        // what actually ends up behind us in the two arrays
        const a = prevSwapped ? nums2[i - 1] : nums1[i - 1];
        const b = prevSwapped ? nums1[i - 1] : nums2[i - 1];

        let res = 1e11;
        if (a < nums1[i] && b < nums2[i]) {
            res = Math.min(res, count(i + 1, 0));
        }
        if (a < nums2[i] && b < nums1[i]) {
            res = Math.min(res, 1 + count(i + 1, 1));
        }

        return dp[key] = res;
    }
}
```

The two lines computing `a` and `b` are the whole trick written out: the mode bit is decoded into the
two values actually behind us, and the rest of the function does not care how they got there.
