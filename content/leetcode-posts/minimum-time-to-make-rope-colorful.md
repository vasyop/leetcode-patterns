# Minimum Time to Make Rope Colorful

This problem fits into the **knapsack** class of top-down DP problems, with a **state machine** flavour — the extra thing carried beside the index is not a capacity but a mode: the colour of the last balloon still standing.

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

Another take-no-take walk over the array, left to right, one decision per balloon: pop it or keep
it.

The insight that makes the graph small is this: once we reach balloon `i`, it does not matter *which*
balloons we popped before `i`, nor how much time we spent doing it. The only thing the rest of the
walk depends on is the colour of the last balloon we *kept*, because that is the only thing that can
forbid keeping balloon `i`.

- **State:** `(i, lastColor)`.
- **Transitions:** two — remove balloon `i`, paying `neededTime[i]` and keeping `lastColor`; or keep
  it, which is legal only when its colour differs from `lastColor`, and which makes it the new
  `lastColor`.
- **Cost:** `n * 27` states with 2 transitions each.

The 27 rather than 26 is a small trick: colour 26 is a stub meaning "there is no previous balloon",
so the first balloon can always be kept without a special case in the code.

```TS
function minCost(colors: string, neededTime: number[]): number {
    const n = colors.length;
    const codes = [...colors].map(ch => ch.charCodeAt(0) - 97);
    const dp: number[] = Array(n * 27).fill(-1);

    return cost(0, 26);

    // the cheapest way to clean up colors[i..], given the last balloon we kept was `last`
    function cost(i: number, last: number): number {
        if (i === n) {
            return 0;
        }

        const key = i * 27 + last;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = neededTime[i] + cost(i + 1, last); // remove balloon i
        if (codes[i] !== last) {
            res = Math.min(res, cost(i + 1, codes[i])); // keep it
        }

        return dp[key] = res;
    }
}
```

The memo is a flat array indexed with `i * 27 + last` rather than a `number[][]`: one allocation and
one memory load per access instead of two dependent ones. It costs nothing to write it this way and
in bigger tables the difference is a factor of several.
