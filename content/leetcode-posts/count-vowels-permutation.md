# Count Vowels Permutation

This problem fits into the **state machine** class of top-down DP problems, and it is about as literal an example as the family gets: the five vowels *are* the states, and the rules *are* the transition table.

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

The rules in the statement all have the same shape — "a may only be followed by e", "e may only be
followed by a or i", and so on. Written as an adjacency list, they are a five-node automaton, and
the problem is asking how many walks of a given length exist in it.

The recursive question is: if the last letter was `last`, how many valid strings of length `len` can
we still append?

- **State:** `(len, last)` — how many letters are left to place, and which vowel is behind us.
- **Transitions:** one per allowed successor of `last`, so at most 4.
- **Cost:** `n * 5` states with at most 4 transitions each — `20000 * 5 = 100000`.

The answer sums over all five choices of first letter, which is why the entry point is a loop rather
than a single call.

```TS
function countVowelPermutation(n: number): number {
    const MOD = 1e9 + 7;
    // which vowel may follow which: a=0, e=1, i=2, o=3, u=4
    const next: number[][] = [
        [1],          // a -> e
        [0, 2],       // e -> a, i
        [0, 1, 3, 4], // i -> a, e, o, u
        [2, 4],       // o -> i, u
        [0],          // u -> a
    ];
    const dp: number[][] = Array(5).fill(null).map(() => Array(n + 1).fill(-1));

    let res = 0;
    for (let v = 0; v < 5; v++) {
        res += count(n - 1, v)
        res %= MOD
    }
    return res;

    // how many ways to append `len` more letters after a string whose last vowel is `last`
    function count(len: number, last: number): number {
        if (len === 0) {
            return 1;
        }

        if (dp[last][len] !== -1) {
            return dp[last][len];
        }

        let res = 0;
        for (const v of next[last]) {
            res += count(len - 1, v)
            res %= MOD;
        }

        return dp[last][len] = res;
    }
}
```

Writing the rules out as a table instead of five `if` branches is worth the two minutes: the
recursion then contains no problem-specific logic at all, which is a good sign that the state is the
right one.
