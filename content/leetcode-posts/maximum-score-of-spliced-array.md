# Maximum Score of Spliced Array

This problem fits into the **state machine** class of top-down DP problems, where the modes are "which array am I reading from" and "how many array changes do I have left".

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

This one does not look like a DP problem at all, which is exactly why it is worth working through.

Think about what swapping a subarray between `nums1` and `nums2` actually means for the answer. For
any optimal solution that is not plainly `sum(nums1)` or `sum(nums2)`, we start reading from one
array, take some contiguous run of elements, then **move** to the other array and take a contiguous
run there (that is the swapped part), then **move** back and read to the end. If the swapped part is a
prefix or a suffix, we only move once.

So the answer is a walk over the indices where we are allowed to change lanes at most twice. That is
a state machine, and the state writes itself.

- **State:** `(i, arr, moves)` — the index, which array we are reading from, and how many lane changes
  are left (0, 1 or 2).
- **Transitions:** two — read `arrs[arr][i]` and advance the index, or change arrays at the same index
  spending one move.
- **Cost:** `n * 2 * 3` states with 2 transitions each.

The lane-change transition keeps `i` fixed, which is fine for the DAG: `moves` strictly decreases
along that edge, so there is still no way to come back.

```TS
function maximumsSplicedArray(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const arrs = [nums1, nums2];
    const dp: number[] = Array(n * 2 * 3).fill(-1);

    return Math.max(score(0, 0, 2), score(0, 1, 2));

    // the most we can still collect from index i on, reading from arrs[arr],
    // with `moves` array changes left
    function score(i: number, arr: number, moves: number): number {
        if (i === n) {
            return 0;
        }

        const key = (i * 2 + arr) * 3 + moves;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = arrs[arr][i] + score(i + 1, arr, moves); // read this one and move on
        if (moves > 0) {
            res = Math.max(res, score(i, 1 - arr, moves - 1)); // change arrays, same index. "1 - arr" gives 0 when arr is 1, and vice-versa
        }

        return dp[key] = res;
    }
}
```

Starting from either array covers both directions of the swap, which is why the entry point is a
`Math.max` of two calls.
