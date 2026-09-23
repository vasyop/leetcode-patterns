# Length of the Longest Subsequence That Sums to Target

This problem fits into the **knapsack** class of top-down DP problems — the classic take-or-skip tree with one extra number carried down beside the index.

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

Nothing much, and that is the point — this is the cleanest take-no-take in the chapter, the one to
reach for when you want to check that you have the pattern.

The tree is one decision per element: put `nums[i]` in the subsequence or leave it out. Skipping and
taking both land on `i + 1`, so the tree collapses immediately — except that a node needs to know
how much of the target is still owed, because "the longest subsequence of `nums[i..]` summing to
5" and "... summing to 9" are different questions.

- **State:** `(i, remainingSum)` — the first undecided number, and the sum still needed.
- **Transitions:** two — skip `nums[i]`, or take it, which scores 1 and moves to
  `(i + 1, rem - nums[i])`.
- **Cost:** `nums.length * (target + 1)` states with 2 transitions each — `1000 * 1001`.

```TS
function lengthOfLongestSubsequence(nums: number[], target: number): number {
    const n = nums.length;
    const dp: number[][] = Array(target + 1).fill(null).map(() => Array(n).fill(-1));

    const res = best(0, target);
    return res < 0 ? -1 : res;

    // the longest subsequence of nums[i..] that sums to exactly rem
    function best(i: number, rem: number): number {
        if (rem === 0) {
            return 0;
        }

        if (i === n || rem < 0) {
            return -1e11; // ran out of numbers, or overshot
        }

        if (dp[rem][i] !== -1) {
            return dp[rem][i];
        }

        return dp[rem][i] = Math.max(
            best(i + 1, rem),                // skip nums[i]
            1 + best(i + 1, rem - nums[i]),  // take it
        );
    }
}
```

Two conventions to note. `-1e11` marks a state with no valid ending — ran out of numbers, or
overshot the target — and it is hugely negative so that the surrounding `Math.max` can never prefer
it; adding a few thousand to it on the way back up still leaves it losing every comparison. And the
final `res < 0 ? -1 : res` is what turns that sentinel back into the `-1` the problem asks for.

The `dp[rem][i]` index order rather than `dp[i][rem]` is deliberate: fewer, longer rows means fewer
allocations and better cache behaviour.
