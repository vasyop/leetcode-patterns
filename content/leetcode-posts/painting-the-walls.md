# Painting the Walls

This problem fits into the **knapsack** class of top-down DP problems — one take-or-skip decision per wall — with a signed counter in the state that has to be clamped at both ends.

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

The greedy instincts all fail here. Giving the paid painter the cheapest walls, or the slowest walls,
or the walls with the best time-per-cost ratio all sound reasonable and all break on some input. So we
fall back on the classic take-no-take walk: consider each wall left to right, with `index` in the
state.

What else does a node need? We are choosing an assignment that minimises cost subject to a global
condition: the total time spent by the paid painter must be at least the number of walls the free
painter takes. Walking left to right, that becomes a running balance — how much time the paid painter
has banked, minus how much the free painter has spent — and it can be negative. Call it `extra`. At the
end of the array it must be non-negative.

The only problem is the range. `extra` can reach `500 * 500`, and `500 ** 3` states is too much. Two
clamps fix it:

**`extra` never usefully exceeds `n`.** If `extra > n`, it does not matter how much higher it is,
because the optimal move from there is for the free painter to take everything left, and there can't be
more than `n` walls left. So for a fixed index, all states with `extra >= n` are equivalent. (Strictly
it is `extra >= n - 1`, since at least one wall must go to the paid painter.)

**`extra` never goes below `-n`.** The free painter can't take more walls than exist.

So `extra` sits comfortably in `[-n, n]`, giving `n * 2n` states. To turn that into a flat memo index,
shift it up by `n` so it lands in `[0, 2n]`:

```TS
const key = i * n * 2 + extra + n;
```

- **State:** `(i, extra)`, with `extra` clamped to `[-n, n - 1]`.
- **Transitions:** two — the paid painter takes wall `i` (pay `cost[i]`, bank `time[i]`), or the free
  painter takes it (spend one unit of `extra`).
- **Cost:** `n * 2n` states with 2 transitions each.

```TS
function paintWalls(cost: number[], time: number[]): number {
    const n = cost.length;
    const dp: number[] = Array(n * n * 2).fill(-1);

    return cheapest(0, 0);

    // the cheapest way to deal with walls i.., given `extra` units of free labour
    // in hand (which may be negative, meaning we owe some)
    function cheapest(i: number, extra: number): number {
        if (i === n) {
            return extra >= 0 ? 0 : 1e15;
        }

        const key = i * n * 2 + extra + n;
        if (dp[key] !== -1) {
            return dp[key];
        }

        return dp[key] = Math.min(
            // paid painter takes it: pay, and extra its time (more than n - 1 is pointless)
            cost[i] + cheapest(i + 1, Math.min(extra + time[i], n - 1)),
            // free painter takes it: spend one unit of the extra
            cheapest(i + 1, extra - 1),
        );
    }
}
```

The `Math.min(extra + time[i], n - 1)` in the transition is the clamp doing its work: without it the
second dimension would be 250000 wide instead of 1000, for states that are all provably identical.
