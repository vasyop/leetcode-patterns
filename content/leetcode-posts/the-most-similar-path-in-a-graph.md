# The Most Similar Path in a Graph

This problem fits into the **explicit graph** class of top-down DP problems — the road network is literally the graph — crossed with the two-pointer shape of sequence alignment.

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

> `n` cities, a connected set of bidirectional `roads`, and `names[i]`, the three-letter name of city
> `i`. Given `targetPath`, find a valid path through the graph of exactly the same length whose edit
> distance to `targetPath` is smallest. Because the lengths are equal, that distance is just the
> number of positions where the names differ. Return the cities of such a path.
> `n <= 100`, `targetPath.length <= 100`.

The recursive question: if we are in city `c` having already travelled `i` roads, where is the best
place to go next? Whichever neighbour minimises the mismatches over the rest of `targetPath`. How we
reached city `c` does not matter at all.

- **State:** `(pathIndex, cityIndex)`.
- **Transitions:** one per neighbour of the current city.
- **Cost:** 100 positions on the path times 100 cities times up to 100 neighbours = 1 million.

Note that the road graph has cycles and the path may revisit a city — but the **DP** graph is still a
DAG, because `pathIndex` strictly increases along every transition. That is the pattern to remember
whenever a problem lets you walk a cyclic structure a bounded number of steps: the step counter in
the state is what makes memoization legal.

The real complication is the output. We must return the actual most similar path, not the distance, so
alongside the distance table we keep a `nxt` table recording which neighbour was best from each
state. There is no need to *return* that choice — the caller doesn't need it — we only need it at the
end, to walk the chain of best choices from the best starting city.

```TS
function mostSimilar(n: number, roads: number[][], names: string[], targetPath: string[]): number[] {
    const k = targetPath.length;
    // graph is stored as adjacency list
    const adj: number[][] = Array(n).fill(null).map(() => []);

    for (const [a, b] of roads) {
        adj[a].push(b);
        adj[b].push(a);
    }

    const dp: number[][] = Array(k).fill(null).map(() => Array(n).fill(-1));
    const nxt: number[][] = Array(k).fill(null).map(() => Array(n).fill(-1));

    let start = 0;
    let best = 1e11;
    for (let u = 0; u < n; u++) {
        const d = distance(0, u);
        if (d < best) {
            best = d;
            start = u;
        }
    }

    const res: number[] = [];
    let u = start;
    for (let i = 0; i < k; i++) {
        res.push(u);
        u = nxt[i][u];
    }
    return res;

    // the fewest mismatches over targetPath[pi..], standing in city ci at step pi
    function distance(pi: number, ci: number): number {
        if (dp[pi][ci] !== -1) {
            return dp[pi][ci];
        }

        const here = names[ci] === targetPath[pi] ? 0 : 1;
        if (pi === k - 1) {
            return dp[pi][ci] = here;
        }

        let rest = 1e11;
        let nextBestState = -1;
        for (const nei of adj[ci]) {
            const d = distance(pi + 1, nei);
            if (d < rest) {
                rest = d;
                nextBestState = nei;
            }
        }

        nxt[pi][ci] = nextBestState;
        return dp[pi][ci] = here + rest;
    }
}
```

The starting city is not given either, so every city has to be tried as a start — the memo makes that
loop essentially free.
