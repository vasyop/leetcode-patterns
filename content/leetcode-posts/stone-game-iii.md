# Stone Game III

This problem fits into the simplest shape in top-down DP — the same one-decision-per-index walk as House Robber — with the two-player twist that the score returned is always from the point of view of whoever is to move.

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

The thing to get right here is the *question*, not the state. The state is just the position; the
state space is `n` nodes; there is no clever compression to find. What trips people up is what a node
should return.

The correct question is: **what is the best score achievable by the player to move, from position
`i`?** — with everything in `[0..i - 1]` already taken. Not Alice's score, not Bob's score: the score
of whoever is standing there. Because both play optimally, the answer does not depend on *which*
player it is, so the player's identity stays out of the state.

That makes the recurrence a subtraction. If I take `taken` stones' worth of value and hand you
position `i + take`, my net advantage is `taken - bestScore(i + take)` — your best result from there
counts against me. The minus sign is what flips sides.

- **State:** `i`, the first stone not yet taken.
- **Transitions:** three — take 1, 2 or 3 stones, when they exist.
- **Cost:** `n` states with 3 transitions each.

```TS
function stoneGameIII(stoneValue: number[]): string {
    const n = stoneValue.length;
    const dp: (number | null)[] = Array(n).fill(null);

    const score = bestScore(0);
    return score > 0 ? 'Alice' : score < 0 ? 'Bob' : 'Tie';

    function bestScore(i: number): number {
        if (i === n) {
            return 0;
        }

        const hit = dp[i];
        if (hit !== null) {
            return hit;
        }

        let res = -1e11;
        let taken = 0;
        for (let take = 1; take <= 3 && i + take <= n; take++) {
            taken += stoneValue[i + take - 1];
            res = Math.max(res, taken - bestScore(i + take)); // the minus flips sides
        }

        return dp[i] = res;
    }
}
```

Note the `null` sentinel: the answer here is a *difference* of scores, so it can legitimately be
negative, and `-1` is a perfectly reachable value. Using `-1` as "not computed yet" would be a bug
that only shows up on some inputs.
