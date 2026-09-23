# Longest Non-decreasing Subarray From Two Arrays

This problem fits into the **state machine** class of top-down DP problems, where the mode is simply which of the two arrays we are reading from.

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

Each `nums3[i]` must be either `nums1[i]` or `nums2[i]`, so from any position there are exactly two
places to go: the next index in `nums1`, or the next index in `nums2`. That is the whole transition
rule, and it makes the mode obvious — which array the current element came from, because that is what
the next element has to be at least as large as.

- **State:** `(i, arr)` — the index, and which array we took the value at that index from.
- **Transitions:** two — continue into `nums1[i + 1]` or into `nums2[i + 1]`, each kept only when the
  value there is at least `arrs[arr][i]`.
- **Cost:** `n * 2` states with 2 transitions each.

The one thing to be careful about is the *entry point*. A node returns the length of the longest
non-decreasing run **starting** there, and we don't know where the optimal run starts, so every state
has to be tried as a starting point:

```TS
    for (let i = 0; i < n; i++) {
        res = Math.max(res, len(i, 0), len(i, 1));
    }
```

That loop costs nothing — the memo means each state is still computed once, and the whole thing stays
O(n).

```TS
function maxNonDecreasingLength(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const arrs = [nums1, nums2];
    const dp: number[] = Array(n * 2).fill(-1);

    let res = 0;
    for (let i = 0; i < n; i++) {
        res = Math.max(res, len(i, 0), len(i, 1));
    }
    return res;

    // the longest non-decreasing run that starts at i by taking arrs[arr][i]
    function len(i: number, arr: number): number {
        const key = i * 2 + arr;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 1;
        if (i + 1 < n) {
            for (let nxt = 0; nxt <= 1; nxt++) {
                if (arrs[nxt][i + 1] >= arrs[arr][i]) {
                    res = Math.max(res, 1 + len(i + 1, nxt));
                }
            }
        }

        return dp[key] = res;
    }
}
```

Putting the two arrays into an `arrs` array rather than branching on a boolean is what keeps the
transition loop down to three lines.
