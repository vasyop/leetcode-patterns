# Number of Great Partitions

This problem fits into the **knapsack** class of top-down DP problems, and it is the hardest state-compression exercise in the chapter — two of the three obvious state fields turn out to be unnecessary.

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

By now your intuition should point at `(index, sum1, sum2)`, with both sums capped at `k` since we
don't care how far past `k` they go. The recursive question becomes "how many ways to partition
`nums[index..]` such that `sum1` ends at `k` or more and `sum2` ends at `k` or more?". That is still
`n * (k + 1) * (k + 1)` states — too many.

Two compressions get it down.

**`sum2` is not independent.** For a fixed `index`, every element before it went to one side or the
other, so `sum2` is always `(total of nums[0..index-1]) - sum1`. Two states with the same `index` and
the same `sum1` necessarily have the same `sum2`. So `sum2` rides along as a parameter, and the memo
key is `(index, sum1)`. That alone drops a whole dimension — but `sum1` can still reach the total sum,
which is far past `k`.

**Once both sums are at least `k`, all states with that `index` are the same.** If `sum1 >= k` and
`sum2 >= k`, the condition is already satisfied for both sides and every remaining element is free to
go either way. So the value returned depends only on how many elements are left — that is, only on
`index` — and all those `(index, sum1)` states are equivalent and can share one slot.

Put together: the only thing that makes a state unique is **the lower of the two sums, and only while
it is below `k`**. The higher one is determined by the lower one and the index.

- **State:** `(index, Math.min(sum1, sum2, k))`.
- **Transitions:** two — `nums[i]` goes to the first group or the second.
- **Cost:** `n * (k + 1)` states with 2 transitions each.

If this is starting to feel frustrating, here is some consolation: this is a ~2400-rated problem, and
only about 0.5% of contestants solve it — even though it needs no concept beyond plain top-down DP.

```TS
function countPartitions(nums: number[], k: number): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    const dp: number[][] = Array(n).fill(null).map(() => Array(k + 1).fill(-1));

    return count(0, 0, 0);

    function count(i: number, s1: number, s2: number): number {
        if (i === n) {
            return s1 >= k && s2 >= k ? 1 : 0;
        }

        const key = Math.min(s1, s2, k);
        if (dp[i][key] !== -1) {
            return dp[i][key];
        }

        return dp[i][key] = (
            count(i + 1, s1 + nums[i], s2) +
            count(i + 1, s1, s2 + nums[i])
        ) % MOD;
    }
}
```

Notice how small the code is compared to the reasoning. That is typical of this family: the
transitions are three lines, and all the difficulty was in convincing yourself that the memo key is
allowed to ignore most of what the function's parameters say.
