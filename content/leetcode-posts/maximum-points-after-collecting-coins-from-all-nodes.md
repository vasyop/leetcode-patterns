# Maximum Points After Collecting Coins From All Nodes

This problem fits into the **explicit graph** class of top-down DP problems — the tree is the graph — with one counter in the state, and the counter has a ceiling you have to find yourself.

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

The key observation is about how little the ancestors matter. At a node it does not matter **which**
ancestors were halved — the only relevant piece of information for this node and its entire subtree is
**how many** of them were. That is enough to compute the coins gained at every node below.

The second observation is the ceiling. `coins[i] <= 1e4`, and `1e4` survives at most 14 halvings
before integer division floors it to 0. So if more than 14 halvings happened above, we may simply say
exactly 14 happened: every value below is 0 either way. That `Math.min(14, halved + 1)` is what makes
the state space finite instead of `n` deep.

- **State:** `(node, halved)`, with `halved` capped at 14.
- **Transitions:** two — collect the full value and pay `k`, keeping the halving count; or take half
  the value and pass one more halving down.
- **Cost:** at most `n * 15` states. Each state has at most 2 incoming transitions — one from the
  parent with halving, one without — so the DP graph has at most `(n - 1) * 15` edges.

```TS
function maximumPoints(edges: number[][], coins: number[], k: number): number {
    const n = coins.length;
    const adj: number[][] = Array(n).fill(null).map(() => []);
    for (const [a, b] of edges) {
        adj[a].push(b);
        adj[b].push(a);
    }

    const dp: number[][] = Array(15).fill(null).map(() => Array(n).fill(-1));

    return best(0, -1, 0);

    // the most we can collect from the subtree of `node`, given its values have
    // already been halved `halved` times on the way down
    function best(node: number, parent: number, halved: number): number {
        if (dp[halved][node] !== -1) {
            return dp[halved][node];
        }

        const value = Math.floor(coins[node] / 2 ** halved);
        let keep = 0;   // children under the same number of halvings
        let halve = 0;  // children under one more

        for (const child of adj[node]) {
            if (child === parent) {
                continue;
            }
            keep += best(child, node, halved);
            halve += best(child, node, Math.min(14, halved + 1));
        }

        return dp[halved][node] = Math.max(
            value - k + keep,
            Math.floor(value / 2) + halve,
        );
    }
}
```

Note that `parent` is a parameter, not part of the state: in a tree, a node's parent is determined by
the root, so it carries no extra information — it is only there to stop the DFS from walking back up
the edge it came down.
