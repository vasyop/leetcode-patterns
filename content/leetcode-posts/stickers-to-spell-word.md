# Stickers to Spell Word

This problem fits into the **bitmask** class of top-down DP problems — the set of target positions already covered is the entire state.

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

`target.length <= 15` next to 50 stickers of 10 letters each is the tell: the state is a subset of the
target's positions, so there are at most `2 ** 15` of them.

The nice thing is how much room that leaves for work *inside* the function. With only 32768 states we
can afford to try every sticker at every state and simulate what it covers.

Precompute the letter counts of each sticker once, before the recursion. Then, inside the function,
applying a sticker means walking the target's uncovered positions left to right and greedily spending
letters from that sticker's budget. Filling the leftmost uncovered position first is safe here because
the positions are interchangeable as far as the *count* is concerned — what matters is only how many
of each letter we can supply.

If a sticker covers nothing new, there is no point in taking it, so that transition is skipped
entirely.

- **State:** `done`, the bitmask of target positions already covered.
- **Transitions:** one per sticker that makes progress, so up to 50, each costing `O(target.length)`
  to evaluate.
- **Cost:** `2 ** 15 * 50 * 15`, about 25 million.

```TS
function minStickers(stickers: string[], target: string): number {
    const ALL = (1 << target.length) - 1;
    // letter counts of every sticker
    const counts = stickers.map(s => {
        const v = Array(26).fill(0);
        for (const ch of s) {
            v[ch.charCodeAt(0) - 97]++;
        }
        return v;
    });
    const wanted = [...target].map(ch => ch.charCodeAt(0) - 97);
    const dp: number[] = Array(1 << target.length).fill(-1);

    const res = fewest(0);
    return res >= 1e11 ? -1 : res;

    // the fewest stickers needed to fill the positions missing from `done`
    function fewest(done: number): number {
        if (done === ALL) {
            return 0;
        }

        if (dp[done] !== -1) {
            return dp[done];
        }

        let res = 1e11;
        for (const count of counts) {
            const budget = [...count];
            let next = done;

            for (let i = 0; i < wanted.length; i++) {
                if (done & (1 << i)) {
                    continue;
                }
                if (budget[wanted[i]] > 0) {
                    budget[wanted[i]]--;
                    next |= 1 << i;
                }
            }

            if (next === done) {
                continue; // this sticker is useless here
            }

            res = Math.min(res, 1 + fewest(next));
        }

        return dp[done] = res;
    }
}
```

The `1e11` sentinel doubles as the "impossible" answer: if no sequence of stickers can finish the
target, nothing ever beats it, and the final `res >= 1e11 ? -1 : res` turns it into the `-1` the
problem wants.
