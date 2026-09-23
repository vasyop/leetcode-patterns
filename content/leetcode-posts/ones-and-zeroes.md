# Ones and Zeroes

This problem fits into the **knapsack** class of top-down DP problems — it is literally a knapsack, just with two capacities instead of one.

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

Take-or-skip per string, and the only thing to notice is *which* numbers belong in the state.

The tempting mistake is to track the sums: how many zeros and how many ones we have used. The total
number of zeros or ones across all strings can reach 60000, and `60000 * 60000 * 600` is nowhere
near affordable. The fix is to read the constraints again: `m, n <= 100`. So we track what is
**left** of the two budgets, not what has been spent, and the table is bounded by the budgets rather
than by the input.

This is the single most useful habit in knapsack problems: the dimension is the capacity, and the
capacity is whatever the constraints cap.

- **State:** `(i, z, o)` — the first undecided string, the zeros still available, the ones still
  available.
- **Transitions:** two — skip `strs[i]`, or take it when it fits, scoring 1.
- **Cost:** `strs.length * (m + 1) * (n + 1)` states with 2 transitions each — `600 * 101 * 101`,
  about 6 million.

```TS
function findMaxForm(strs: string[], m: number, n: number): number {
    const L = strs.length;
    const zeros: number[] = Array(L).fill(0);
    const ones: number[] = Array(L).fill(0);

    for (let i = 0; i < L; i++) {
        for (const ch of strs[i]) {
            if (ch === '0') {
                zeros[i]++;
            } else {
                ones[i]++;
            }
        }
    }

    const dp: number[] = Array(L * (m + 1) * (n + 1)).fill(-1);

    return best(0, m, n);

    // the largest subset of strs[i..] that fits in z zeros and o ones
    function best(i: number, z: number, o: number): number {
        if (i === L) {
            return 0;
        }

        const key = (i * (m + 1) + z) * (n + 1) + o;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = best(i + 1, z, o); // skip strs[i]
        if (zeros[i] <= z && ones[i] <= o) {
            res = Math.max(res, 1 + best(i + 1, z - zeros[i], o - ones[i])); // take it
        }

        return dp[key] = res;
    }
}
```

Counting the zeros and ones of every string once up front, before the recursion, keeps the work per
state at O(1) — otherwise every one of those 6 million states would re-scan a string.
