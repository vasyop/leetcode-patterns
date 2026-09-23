# Minimum Time to Kill All Monsters

This problem fits into the **bitmask** class of top-down DP problems — we are choosing an order, and the only thing that identifies a position in that ordering is the set of monsters already dealt with.

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

> You start with 0 mana and a gain rate of `gain = 1`. Every day your mana grows by `gain`, and at
> the end of a day you may defeat one monster if your mana is at least its power. Defeating a monster
> resets your mana to 0 and increases `gain` by 1. `power.length <= 17`.

Everything here depends on the order in which we kill the monsters, so the problem is a search over
permutations — and `n <= 17` is the tell that a bitmask is the intended state.

Two observations shrink the problem to almost nothing:

**There is never a reason to wait longer than necessary.** Once we have picked which monster to kill
next, waiting is forced: `Math.ceil(power[i] / gain)` days, no decision involved. So the only
decisions in the whole problem are the choices of order.

**`gain` is not part of the state.** It is always one more than the number of monsters already killed,
which is the popcount of the mask. It rides along as a parameter so we don't have to count bits, but
it must stay out of the memo key — otherwise the state count is multiplied for nothing.

- **State:** `dead`, the bitmask of monsters already killed.
- **Transitions:** one per surviving monster, so at most 17.
- **Cost:** `2 ** 17` states with 17 transitions each — about 2.2 million.

```TS
function minimumTime(power: number[]): number {
    const n = power.length;
    const ALL = (1 << n) - 1;
    const dp: number[] = Array(1 << n).fill(-1);

    return cost(0, 1);

    // the fewest days needed to kill the monsters outside `dead`,
    // gaining `gain` mana a day (which is popcount(dead) + 1)
    function cost(dead: number, gain: number): number {
        if (dead === ALL) {
            return 0;
        }

        if (dp[dead] !== -1) {
            return dp[dead];
        }

        let res = 1e15;
        for (let i = 0; i < n; i++) {
            if (dead & (1 << i)) {
                continue;
            }
            const wait = Math.ceil(power[i] / gain);
            res = Math.min(res, wait + cost(dead | (1 << i), gain + 1));
        }

        return dp[dead] = res;
    }
}
```
