# Max Dot Product of Two Subsequences

This problem fits into the **two-sequence alignment** class of top-down DP problems — a pointer into each array, and the decision is which one to advance.

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

The skeleton is Longest Common Subsequence: state `(i, j)`, and from every node we either pair
`nums1[i]` with `nums2[j]` and advance both, or drop one of the two and advance that pointer alone.

The only wrinkle is that the subsequences must be **non-empty**. That matters here in a way it
doesn't in LCS: with all-negative numbers in one array and all-positive in the other, the best dot
product is negative, and an empty pairing scoring 0 would beat it. So a third field records whether
anything has been paired yet, and we only accept walks that paired at least once.

- **State:** `(i, j, tookAtLeastOnce)`.
- **Transitions:** three — pair `(i, j)` and advance both, drop `nums1[i]`, or drop `nums2[j]`.
- **Cost:** `(n + 1) * (m + 1) * 2` states with 3 transitions each.

Note the `null` sentinel in the memo. This is the clearest case in the chapter where `-1` is *not*
safe: `-1` is a perfectly legal dot product here (`[1]` against `[-1]`), so using it as the "not
computed yet" marker would silently recompute — or worse, misreport — those states. A sentinel a
real answer can also take is a bug that keeps looking correct and merely returns the wrong number on
some inputs.

```TS
function maxDotProduct(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const m = nums2.length;
    const dp: (number | null)[] = Array((n + 1) * (m + 1) * 2).fill(null);

    return best(0, 0, 0);

    // the best dot product still obtainable from nums1[i..] and nums2[j..],
    // where took says whether we have already paired something
    function best(i: number, j: number, took: number): number {
        if (i === n && j === m) {
            return took ? 0 : -1e15; // both subsequences must be non-empty
        }

        const key = (i * (m + 1) + j) * 2 + took;
        const hit = dp[key];
        if (hit !== null) {
            return hit;
        }

        let res = -1e15;
        if (i < n && j < m) {
            res = Math.max(res, nums1[i] * nums2[j] + best(i + 1, j + 1, 1)); // pair them
        }
        if (i < n) {
            res = Math.max(res, best(i + 1, j, took)); // drop nums1[i]
        }
        if (j < m) {
            res = Math.max(res, best(i, j + 1, took)); // drop nums2[j]
        }

        return dp[key] = res;
    }
}
```

The `-1e15` is the second kind of sentinel — "this state has no valid ending" — and it has to be far
enough past any reachable answer that adding a few products to it on the way back up still leaves it
losing every `Math.max`.
