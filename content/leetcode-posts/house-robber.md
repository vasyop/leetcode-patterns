# House Robber

This problem is the opening example of the **take-or-skip** class of top-down DP problems — one decision per index, and nothing in the state but the index.

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

Stripped of its story, House Robber asks for the subset of an array with the highest total sum
under a single restriction: we can't pick two adjacent items. Each house is one decision — rob it
or don't — so we get the plain one-decision-per-index tree. The adjacency constraint costs us
nothing extra: if we decide to rob house `i`, we simply jump over house `i + 1` and continue from
`i + 2`. The constraint is baked into the shape of the tree, so every path through it is a valid
plan by construction.

Here is the tree for 5 houses, each node labelled with the house we are deciding about, left
branch skipping and right branch robbing:

```
                            i=0
                     /               \
                  i=1                 i=2
                /     \             /     \
             i=2       i=3       i=3       i=4
            /   \     /   \     /   \     /   \
         i=3    i=4  i=4  END  i=4  END  END   END
```

For `n = 100` that tree has roughly `2 ** 71` nodes (the count follows the Fibonacci numbers,
because the rob branch eats two houses instead of one). Hopeless. But look only at the labels:
`i=3` shows up three times, `i=4` four times, and we stopped drawing after three levels. And "the
most we can collect from houses `3..n-1`" does not depend on how we arrived at house 3 — not on
which houses we robbed before it, not on how much we have collected so far, not on how deep in the
tree we are. So every node labelled `i=3` becomes _the_ node `i=3`, and six labels become six
nodes:

```
    .---------rob---------. .---------rob---------. .---rob---.
    |                     v |                     v |         v
  i=0 -skip-> i=1 -skip-> i=2 -skip-> i=3 -skip-> i=4 -skip-> END
                |                     ^ |                      ^
                '---------rob---------' '---------rob----------'
```

Node `i=2` has two parents — `i=0` reaches it by robbing, `i=1` by skipping — so this is a graph,
not a tree. Every edge goes from a smaller `i` to a strictly larger `i`, which makes it a DAG, and
that is precisely what makes the memo legal: when `best(i)` asks for `best(i + 2)`, that call is
guaranteed to finish and hand back a finished number.

- **State:** `i`, the house we are currently deciding about. One number, nothing else.
- **Transitions:** skip, landing on `i + 1`; rob, collecting `nums[i]` and landing on `i + 2`.
- **Cost:** `n` states with O(1) work each, so O(n) time and O(n) memory. From `2 ** 71` down to
  `100`.

Two details worth stating. The base case is `i >= n` and not `i === n`, because robbing the last
house lands us one past the end we would expect. And `-1` works as the "not computed yet" marker
only because a real answer can never be `-1` here — the values are sums of non-negative numbers.
Picking a sentinel that a real answer can also take is a genuinely nasty bug, because the code
keeps looking correct and merely returns the wrong number on some inputs.

```TS
function rob(nums: number[]): number {
    const n = nums.length;
    const memo: number[] = Array(n).fill(-1);

    return best(0);

    // the most we can collect from houses i..n-1
    function best(i: number): number {
        if (i >= n) {
            return 0;
        }

        if (memo[i] !== -1) {
            return memo[i];
        }

        return memo[i] = Math.max(
            best(i + 1),           // skip house i
            nums[i] + best(i + 2)  // rob house i, so house i + 1 is off limits
        );
    }
}
```

Three lines separate this from the version that would run until the heat death of the sun.
