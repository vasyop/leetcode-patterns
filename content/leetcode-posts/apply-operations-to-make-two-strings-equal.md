# Apply Operations to Make Two Strings Equal

This problem fits into the **state machine** class of top-down DP problems — a left-to-right walk with two bits of mode — but most of the work happens before the DP even starts.

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

Four observations turn a messy operation-choosing problem into take-or-no-take.

**No pair is ever toggled twice.** Two toggles of the same pair cancel out, so for each adjacent pair
`(index, index + 1)` there is a single binary decision: toggle it or don't.

**Order does not matter.** Say four operations in total involve bit 5: it gets toggled four times, so
it ends up as it started, whatever the order and whatever the type of each operation. Extending that
to every bit, we may assume all the adjacent toggles happen first and all the `x`-cost ones after.

**Once the adjacent toggles are fixed, the rest of the cost is forced.** Count the indices still
mismatched, pair them up two by two, and toggle each pair at a cost of `x`.

So the only thing left to decide is the optimal set of adjacent toggles. Moving from pair `(0, 1)` to
pair `(1, 2)` we need to know whether index 1 was already toggled, which gives a `prevToggled` flag.
And we need to know how many indices our toggles have left mismatched, to count the `x`-flips owed at
the end — giving `(index, prevToggled, mismatched)`.

**And `mismatched` collapses to one bit.** Notice that the cost of `(index, prevToggled, 10)` is the
cost of `(index, prevToggled, 0)` plus `5 * x`, for every `index` and `prevToggled`. We already know
what a pending mismatch is going to cost us, so there is no need to carry the count to the end state —
we can charge `x` as we walk, each time a mismatch finds its partner. Instead of transitioning into
`(index, prevToggled, 2)` we transition into `(index, prevToggled, 0)` and add `x`. That leaves
`mismatched` as a single parity bit.

- **State:** `(index, prevToggled, mismatched parity)`.
- **Transitions:** two — leave the pair `(index, index + 1)` alone, or toggle it.
- **Cost:** `n * 2 * 2` states with 2 transitions each.

```TS
function minOperations(s1: string, s2: string, x: number): number {
    const n = s1.length;
    const INF = 1e9;
    const dp: number[] = Array(n * 4).fill(-1);

    const res = cost(0, 0, 0);
    return res >= INF ? -1 : res;

    // the cheapest way to fix positions index.., where `prevToggled` says the
    // adjacent pair (index - 1, index) was toggled and `mismatched` is the
    // parity of the mismatches still waiting for an x-partner
    function cost(index: number, prevToggled: number, mismatched: number): number {
        if (index === n) {
            // a toggle hanging off the end, or a mismatch with nobody to pair with
            return prevToggled || mismatched ? INF : 0;
        }

        const key = (index * 2 + prevToggled) * 2 + mismatched;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const differs = (s1[index] !== s2[index]) !== (prevToggled === 1);

        return dp[key] = Math.min(
            // leave (index, index + 1) alone
            differs
                ? (mismatched ? x : 0) + cost(index + 1, 0, 1 - mismatched)
                : cost(index + 1, 0, mismatched),
            // toggle it, which flips index and owes index + 1 a flip too
            1 + (differs
                ? cost(index + 1, 1, mismatched)
                : (mismatched ? x : 0) + cost(index + 1, 1, 1 - mismatched)),
        );
    }
}
```

"Charge the cost as you walk instead of carrying the count to the end" is a reusable trick. Any time a
state field is a running total whose final contribution is a fixed linear function of itself, you can
usually pay it along the way and shrink that field to a parity bit — or delete it entirely.
