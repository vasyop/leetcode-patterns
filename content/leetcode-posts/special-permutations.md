# Special Permutations

This problem fits into the **bitmask** class of top-down DP problems, with one extra field: which number is currently at the end of the permutation.

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

We are counting permutations subject to a rule that only ever compares *neighbours*. That is the
whole reason a DP works: to extend a partial permutation, the only two things that matter are which
numbers are still unused and what the last number is. The order of everything before the last element
has already been validated and can be forgotten.

- **State:** `(last, taken)` — the index of the number at the end of the permutation so far, and the
  bitmask of numbers already used.
- **Transitions:** one per unused number, kept only when it divides `nums[last]` or is divisible by
  it.
- **Cost:** `n * 2 ** n` states with `n` transitions each — about 3 million.

Unlike Minimum XOR Sum or Maximum AND Sum, `last` genuinely has to be in the state here: it is not a
function of the mask. Two different permutations using the same set of numbers can end on different
elements and have completely different continuations.

The entry point sums over every possible first element, since any number may start the permutation.

```TS
function specialPerm(nums: number[]): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    const ALL = (1 << n) - 1;
    const dp: number[][] = Array(n).fill(null).map(() => Array(1 << n).fill(-1));

    let res = 0;
    for (let i = 0; i < n; i++) {
        res += count(i, 1 << i)
        res %= MOD;
    }
    return res;

    // the number of ways to lay out the numbers outside `taken` after nums[last]
    function count(last: number, taken: number): number {
        if (taken === ALL) {
            return 1;
        }

        if (dp[last][taken] !== -1) {
            return dp[last][taken];
        }

        let res = 0;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }
            if (nums[last] % nums[i] === 0 || nums[i] % nums[last] === 0) {
                res += count(i, taken | (1 << i));
                res %= MOD;
            }
        }

        return dp[last][taken] = res;
    }
}
```
