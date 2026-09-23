# Regular Expression Matching

This problem fits into the **two-sequence alignment** class of top-down DP problems — a pointer into the string and a pointer into the pattern — and here the graph is tiny while the edge cases are the whole difficulty.

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

The state is the familiar `(i, j)` pair and the table is at most 1000 by 1000. Nothing about the
complexity is interesting. Everything that is hard about this problem lives in three details.

**The string pointer can finish before the pattern does.** Unlike most two-pointer problems, `i` can
reach the end while `j` has not — `("a", "ab*")` is a match. So the first table dimension needs `n + 1`
rows, and `i === n` has to be a legitimate state rather than a base case that returns immediately.

**We must look two characters ahead in the pattern.** Not just `p[j]`, but whether a `*` follows it.
If there is no `*`, we try to match one character and advance both pointers. If there is, we have two
moves: drop the repeated character entirely and jump to `j + 2`, or consume one more occurrence and
advance `i`:

```TS
res = match(i, j + 2) || (matchHere && match(i + 1, j)) ? 1 : 0;
```

**The `i < n` guard on `.`** is easy to forget:

```TS
const matchHere = p[j] === '.' && i < n || p[j] === s[i];
```

Because `i === n` is a valid state, a `.` would otherwise happily "match" past the end of the string
and the following `match(i + 1, j + 1)` would walk into an invalid state.

- **State:** `(i, j)`.
- **Transitions:** two when `p[j + 1] === '*'`, otherwise one.
- **Cost:** `(n + 1) * m` states with O(1) work each.

```TS
function isMatch(s: string, p: string): boolean {
    const n = s.length;
    const m = p.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m).fill(-1));

    return !!match(0, 0);

    // does s[i..] match p[j..]
    function match(i: number, j: number): number {
        if (j === m) {
            return i === n ? 1 : 0;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        const matchHere = p[j] === '.' && i < n || p[j] === s[i];
        let res: number;

        if (p[j + 1] === '*') {
            res = match(i, j + 2) || (matchHere && match(i + 1, j)) ? 1 : 0;
        } else {
            res = matchHere ? match(i + 1, j + 1) : 0;
        }

        return dp[i][j] = res;
    }
}
```

One last trap. It is tempting to handle `x*` with a loop over how many characters it eats:

```TS
    if (p[j + 1] === '*') {
        for(let k = i; k <= s.length; k++) {
            if(match(k, j + 2)) {
                return true
            }
        }
    }
```

This makes intuitive sense and gives the right answer, but it is exactly the mistake from
[Coin Change](https://leetcode.com/problems/coin-change/): every one of those long edges flies over
states the memo is already holding. The single transition `match(i, j + 2)`, combined with
`match(i + 1, j)`, reaches all the same places in short steps.
