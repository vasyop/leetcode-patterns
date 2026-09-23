# Shortest Common Supersequence

This problem fits into the **two-sequence alignment** class of top-down DP problems — a pointer into each string — with the extra requirement that we must reconstruct the answer, not just measure it.

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

The DP itself is Longest Common Subsequence's twin. State `(i, j)`, and from each node we either take
a character from `s1`, from `s2`, or one character that pays for both when `s1[i] === s2[j]`.

The interesting part is returning the actual string. As in
[The Most Similar Path in a Graph](https://leetcode.com/problems/the-most-similar-path-in-a-graph/),
the obvious approach is to record the best transition out of every state. My first draft did exactly
that, with three parallel tables — `nxtI`, `nxtJ` and `char` — so the answer could be read off by
following the chain from `(0, 0)`:

```TS
function shortestCommonSupersequence(s1: string, s2: string): string {
    const len: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(-1e11));
    const nxtI: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));
    const nxtJ: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));
    const char: string[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));

    rec(0, 0);

    let i = 0, j = 0
    const str: string[] = []
    while(i !== -1) {
        str.push(char[i][j]);
        [i, j] = [nxtI[i][j], nxtJ[i][j]];
    }
    return str.join('')

    function rec(i: number, j: number): number {
        if (len[i][j] !== -1e11) {
            return len[i][j];
        }

        if (i === s1.length && j === s2.length) {
            nxtI[i][j] = -1
            nxtJ[i][j] = -1
            char[i][j] = ''
            return len[i][j] = 0;
        }

        if (i === s1.length) {
            nxtI[i][j] = i
            nxtJ[i][j] = j + 1
            char[i][j] = s2[j]
            return len[i][j] = 1 + rec(i, j + 1)
        }

        if (j === s2.length) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j
            char[i][j] = s1[i]
            return len[i][j] = 1 + rec(i + 1, j)
        }

        if (s1[i] === s2[j]) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j + 1
            char[i][j] = s2[j]
            return len[i][j] = 1 + rec(i + 1, j + 1);
        }

        const v1 = rec(i + 1, j);
        const v2 = rec(i, j + 1);

        if(v1 < v2) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j
            char[i][j] = s1[i]
            return len[i][j] = 1 + v1
        }

        nxtI[i][j] = i
        nxtJ[i][j] = j + 1
        char[i][j] = s2[j]
        return len[i][j] = 1 + v2
    }
}
```

That works and it is fast, but it is long and ugly — and unnecessary. Those three tables store
something we can *deduce*: given the pair `(s1[i], s2[j])` and the two child lengths, the best next
state is forced. So we can drop them, keep only the length table, and rebuild the string by walking
forward from `(0, 0)` and asking the memo which way to go at each step.

- **State:** `(i, j)`.
- **Transitions:** when the characters match, one forced move to `(i + 1, j + 1)`; otherwise
  `(i + 1, j)` and `(i, j + 1)`.
- **Cost:** `n * m` states with O(1) work each.

```TS
function shortestCommonSupersequence(s1: string, s2: string): string {
    const n = s1.length;
    const m = s2.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(-1));

    const res: string[] = [];
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
        if (i === n) {
            res.push(s2[j++]); // s1 is done, the rest of s2 has to follow
        } else if (j === m) {
            res.push(s1[i++]);
        } else if (s1[i] === s2[j]) {
            res.push(s1[i++]);
            j++; // one character pays for both
        } else if (len(i + 1, j) < len(i, j + 1)) {
            res.push(s1[i++]);
        } else {
            res.push(s2[j++]);
        }
    }
    return res.join('');

    // the length of the shortest string containing both s1[i..] and s2[j..]
    function len(i: number, j: number): number {
        if (i === n) {
            return m - j; // s1 is done, every character left in s2 still has to be written
        }

        if (j === m) {
            return n - i;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        if (s1[i] === s2[j]) {
            return dp[i][j] = 1 + len(i + 1, j + 1);
        }

        return dp[i][j] = 1 + Math.min(len(i + 1, j), len(i, j + 1));
    }
}
```

The general point: before building parent or successor tables to reconstruct an answer, check whether
the choice can be recomputed from the memo you already have. Usually it can.
