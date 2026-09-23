# Minimum XOR Sum of Two Arrays

This problem fits into the **bitmask** class of top-down DP problems — where what we are deciding about is a set rather than a sequence, and the whole set fits in one integer.

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

Sometimes what we are deciding about is a set rather than a sequence: which tasks have been
assigned, who is already on the team, which numbers are used up. A subset of `n` items can be
represented with an `n`-bit integer, so the whole state fits in one number and there are `2 ** n` of
them. These problems always arrive with a tiny `n` — when the constraints say `n <= 14` or
`n <= 20` while everything else in the problem is huge, a subset is very likely the intended state.

Rearranging `nums2` is the same thing as pairing every element of `nums1` with a distinct element of
`nums2`, so the decision tree is the permutations tree. For `nums2 = [1, 2, 3, 4]`:

```
                                         empty
         /                      /                      \                      \
         1                      2                      3                      4            first choice
  /      |      \        /      |      \        /      |      \        /      |      \
  2      3      4        1      3      4        1      2      4        1      2      3     second choice
 / \    / \    / \      / \    / \    / \      / \    / \    / \      / \    / \    / \
3   4  2   4  2   3    3   4  1   4  1   3    2   4  1   4  1   2    2   3  1   3  1   2   third choice
|   |  |   |  |   |    |   |  |   |  |   |    |   |  |   |  |   |    |   |  |   |  |   |
4   3  4   2  3   2    4   3  4   1  3   1    4   2  4   1  2   1    3   2  3   1  2   1   fourth choice
```

We can't walk that with the permutations swap algorithm, because `14! = 87` billion. Fortunately we
don't have to, because exploring permutations does a lot of unnecessary work. Consider these two
partial permutations with the last two spots still empty:

`[1, 2, ?, ?]`
`[2, 1, ?, ?]`

To decide the best order for the last two spots we don't need to know the order on the previous
ones. We are asking the same question twice, and indeed if you follow `2 -> 1` or `1 -> 2` on the
tree above, both subtrees below look identical:

```
  /   \
  3   4
  |   |
  4   3
```

For a tree with 14 levels there are a great many identical subtrees. The question a node really
answers is "what is the best way to arrange these `k` remaining elements on the last `k` spots?" —
and the only thing that identifies it is *which* elements are left.

- **State:** `taken`, a bitmask of the elements of `nums2` already used. `2 ** 14` values.
- **Transitions:** one per element not yet taken, so at most `n`.
- **Cost:** `2 ** n` states with `n` transitions each — `16384 * 14`, about 230 thousand steps, down
  from 87 billion.

```TS
function minimumXORSum(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const dp: number[] = Array(2 ** n).fill(-1);

    return rec(0, 0);

    function rec(taken: number, depth: number): number {
        if (depth === n) {
            return 0;
        }

        if (dp[taken] !== -1) {
            return dp[taken];
        }

        let res = 1e11;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }

            const xor = nums1[depth] ^ nums2[i];
            const other = rec(taken | (1 << i), depth + 1);
            res = Math.min(res, other + xor);
        }

        return (dp[taken] = res);
    }
}
```

The interesting line is `dp[taken]`, not `dp[taken][depth]`. `depth` is a parameter but not part of
the state, because it is not independent information: every pairing consumes exactly one element
from each array, so `depth` is always the number of set bits in `taken`. It rides along only so that
we don't have to count bits on every call. Extra parameters that are functions of the real state are
common in bitmask code, and keeping them out of the memo is what stops the state count from being
multiplied for nothing.
