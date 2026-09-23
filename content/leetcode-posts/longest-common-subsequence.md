# Longest Common Subsequence

This problem is the archetype of the **two-sequence alignment** class of top-down DP problems — a pointer into each sequence, and the only decision is which one to advance.

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

Problems about sequences and subsequences are DP favorites, and unfortunately this is something you
simply need to remember, because at first glance the statement does not suggest a DP graph at all.

The trick is to make the state a pair of pointers, `(i, j)` — `i` into `text1`, `j` into `text2` —
and read off the decisions available at each node:

1. increment both `i` and `j` if `text1[i] === text2[j]`, taking the character;
2. only advance `i`;
3. only advance `j`.

Here is that tree in full for `text1 = "ab"` and `text2 = "cab"`. A `*` marks a node where the two
characters agree, so the only sensible move is to take both; every other node branches left to
advance `i` and right to advance `j`:

```
                        (0,0)
                   /               \
          (1,0)                      (0,1)
        /       \                          \ take "a"
  (2,0)           (1,1)                 (1,2)*
                  /       \                   \ take "b"
            (2,1)           (1,2)*          (2,3)
                                   \ take "b"
                                  (2,3)
```

Both `(1, 2)` subtrees are conveniently identical — which is the whole point. A state `(i, j)` can
return the longest common subsequence length of the suffixes `text1[i..]` and `text2[j..]`, and how
we arrived there does not enter into it.

- **State:** `(i, j)`, one pointer per string.
- **Transitions:** when the characters match, a single forced move to `(i + 1, j + 1)` scoring 1;
  otherwise two moves, `(i + 1, j)` and `(i, j + 1)`.
- **Cost:** `n * m` states with O(1) work each. Both strings go up to 1000 characters, so about a
  million states.

```TS
function longestCommonSubsequence(text1: string, text2: string): number {
    const n = text1.length;
    const m = text2.length;
    const dp: number[][] = Array(n)
        .fill(null)
        .map(() => Array(m).fill(-1));

    return lcs(0, 0);

    // the longest common subsequence of text1[i..] and text2[j..]
    function lcs(i: number, j: number): number {
        if (i === n || j === m) {
            return 0;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        let ret: number;
        if (text1[i] === text2[j]) {
            ret = 1 + lcs(i + 1, j + 1);
        } else {
            ret = Math.max(lcs(i + 1, j), lcs(i, j + 1));
        }

        return (dp[i][j] = ret);
    }
}
```

Once you have seen this shape, you have seen half of the string DP problems on LeetCode: Shortest
Common Supersequence, Edit Distance, Regular Expression Matching and Max Dot Product of Two
Subsequences are all the same two pointers with a different question attached to the node.
