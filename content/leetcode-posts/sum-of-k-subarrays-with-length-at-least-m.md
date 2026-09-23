# Sum of K Subarrays With Length at Least M

This problem fits into the **knapsack** class of top-down DP problems with a **state machine** on top — the index walks left to right while two counters describe how far along the construction is.

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

We need exactly `k` non-overlapping subarrays, each at least `m` long. Walking left to right, a node
has to know three things: where we are, how many subarrays are already finished, and how long the
one currently open is.

The move that makes this affordable is capping the open length at `m`. Once a subarray is long
enough, the exact length stops mattering — every further element is simply added, and the closing
rule is already satisfied. That cap is the difference between an `n * k * n` table and an
`n * k * m` one.

- **State:** `(i, closed, size)` — `closed` subarrays already finished, an open one of length `size`
  capped at `m`, with `0` meaning none open.
- **Transitions:** take `nums[i]` into the open subarray, while we still have subarrays to spend;
  skip `nums[i]`, legal only when nothing is open; or close the open subarray, legal only at length
  `m` or more — which, thanks to the cap, is the single value `m`.
- **Cost:** `n * (k + 1) * (m + 1)` states with 2 transitions each.

```TS
function maxSum(nums: number[], k: number, m: number): number {
    const n = nums.length;
    const dp: (number | null)[] = Array((n + 1) * (k + 1) * (m + 1)).fill(null);

    return best(0, 0, 0);

    // the best total from nums[i..], with `closed` subarrays already finished and
    // an open one of length `size` (capped at m, 0 meaning none open)
    function best(i: number, closed: number, size: number): number {
        if (i === n) {
            if (size === 0) {
                return closed === k ? 0 : -1e11;
            }
            // the open one still has to be closed, and only a full-length one may be
            return size === m && closed + 1 === k ? 0 : -1e11;
        }

        const key = (i * (k + 1) + closed) * (m + 1) + size;
        const hit = dp[key];
        if (hit !== null) {
            return hit;
        }

        let res = -1e11;
        if (closed < k) {
            res = Math.max(res, nums[i] + best(i + 1, closed, Math.min(m, size + 1)));
        }
        if (size === 0) {
            res = Math.max(res, best(i + 1, closed, 0)); // skip nums[i]
        } else if (size === m) {
            res = Math.max(res, best(i, closed + 1, 0)); // close before nums[i]
        }

        return dp[key] = res;
    }
}
```

The close transition is the one to look at twice: it moves to `(i, closed + 1, 0)` — the same `i`.
Closing happens *between* elements, so it consumes nothing. That is fine for the DAG, because
`closed` strictly increases along that edge, so there is still no way to come back.
