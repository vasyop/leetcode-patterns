# Dice Roll Simulation

This problem fits into the **state machine** class of top-down DP problems — a sequence built left to right with a small amount of "what just happened" carried along.

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

The constraint is about runs, so the mode has to describe the run we are in the middle of. Nothing
else about the prefix matters: two different sequences of 10 rolls that both end on three 5s in a
row have exactly the same set of valid continuations.

So the mode is a pair — which number came up last, and how many times in a row. The streak is at
most 15 (the cap on `rollMax`), the face is one of 6, and the sequence length is the third
dimension.

- **State:** `(size, last, streak)` — how many rolls are already placed, the last face, and its run
  length.
- **Transitions:** six, one per face. Rolling a different face resets the streak to 1; rolling the
  same face extends it, and is simply not allowed once `rollMax[face - 1]` is reached.
- **Cost:** `n * 7 * 16` states with 6 transitions each.

Face `0` with a streak of `0` is the "nothing rolled yet" state, which is why the table has 7 face
slots rather than 6 — the stub value avoids a special case for the very first roll.

```TS
function dieSimulator(n: number, rollMax: number[]): number {
    const MOD = 1e9 + 7;
    const dp: number[] = Array(n * 7 * 16).fill(-1);

    return count(0, 0, 0); // face 0 with a streak of 0 means "nothing rolled yet"

    // how many ways to fill the remaining n - size rolls, given the last roll was
    // `last`, repeated `streak` times in a row
    function count(size: number, last: number, streak: number): number {
        if (size === n) {
            return 1;
        }

        const key = (size * 7 + last) * 16 + streak;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 0;
        for (let face = 1; face <= 6; face++) {
            if (face !== last) {
                res += count(size + 1, face, 1);
            } else if (streak < rollMax[face - 1]) { // rollMax is 0-indexed by face - 1
                res += count(size + 1, face, streak + 1);
            }
        }

        return dp[key] = res % MOD;
    }
}
```

The flat memo index `(size * 7 + last) * 16 + streak` is the standard row-major formula: fix an
order for the dimensions, let the last one vary fastest, and the multiplier for each dimension is
the product of every dimension after it.
