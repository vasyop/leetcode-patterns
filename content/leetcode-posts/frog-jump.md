# Frog Jump

This problem fits into the **explicit graph** class of top-down DP problems — the ones where somebody has already drawn the graph for us.

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

The stones are handed to us as nodes and the jumping rule as edges, so the graph is almost written
down in the statement. Almost — because the obvious choice of node is wrong.

If we take a node to be a stone, we lose information. Take `stones = [0, 1, 2, 3, 4, 7]` and look
at the two ways of arriving at the stone at position 4 (the arrows are labelled with *positions*,
which is how the statement talks about the river):

```
   0 --jump 1--> 1 --jump 1--> 2 --jump 2--> 4 --jump 3--> 7

   0 --jump 1--> 1 --jump 2--> 3 --jump 1--> 4  (next jump is 1 or 2, and 5 and 6 are both water)
```

In both cases we are standing on stone 4, but it also matters how far we can jump next. So a node
is the pair `(stoneIndex, lastJump)`. Now `(4, 2)` and `(4, 1)` are different states, and only one
of them leads to success. Here is the complete graph for that array — from here on the first number
is the stone's **index**, not its position, which is what the code indexes the memo with:

```
                jump 1               jump 2               jump 3
      (1, 1) ------------> (2, 1) ------------> (4, 2) ------------> (5, 3)
         |                    |
  jump 2 |                    | jump 1
         v                    v
      (3, 2)               (3, 1)
         |                    |
  jump 1 |                    | jump 1
         '-----> (4, 1) <-----'
```

`(5, 3)` is the far bank. `(4, 1)` is the dead end — from that stone the frog can only reach
positions 5 or 6, both water — while `(4, 2)` clears the gap in a single jump of 3. And note that
both `(3, 1)` and `(3, 2)` lead into `(4, 1)`, so it is a node with two parents: a graph, not a
tree.

I like to think of each DP state as a _place_. From any place we can go to at most 3 other places.
If the frog is at place _p_, can it land on the last stone from _p_? If yes, it does not matter how
the frog arrived at _p_ — the answer is always yes. If no, the same holds.

- **State:** `(stoneIndex, lastJump)`.
- **Transitions:** at most three — a jump of `lastJump - 1`, `lastJump` or `lastJump + 1`, kept only
  when a stone actually sits at the landing position.
- **Cost:** the jump can never exceed 2000, since in the worst case it grows by 1 per jump, so at
  most `2000 ** 2 = 4` million states with 3 transitions each.

`idxOf` turns a position back into the index of the stone standing there, which is how a jump of
`jump` units becomes the next node in O(1). And the frog only gets going if `stones[1] === 1`,
since the first jump is fixed at exactly one unit — if the second stone is not at position 1, it
never leaves the bank.

```TS
function canCross(stones: number[]): boolean {
    const idxOf = new Map<number, number>();

    for (const [i, s] of stones.entries()) {
        idxOf.set(s, i);
    }

    // [stone_index][last_jump]
    // last_jump cannot exceed the number of stones
    const dp: number[][] = Array(stones.length)
        .fill(null)
        .map(() => Array(stones.length).fill(-1));

    return stones[1] === 1 && canReachFrom(1, 1);

    // can the frog finish, standing on stone idx having just jumped lastJump
    function canReachFrom(idx: number, lastJump: number): boolean {
        if (dp[idx][lastJump] !== -1) {
            return false;
        }

        if (idx === stones.length - 1) {
            return true;
        }

        for (let jump = Math.max(lastJump - 1, 1); jump <= lastJump + 1; jump++) {
            const nxtIdx = idxOf.get(stones[idx] + jump);

            if (nxtIdx != null && canReachFrom(nxtIdx, jump)) {
                return true;
            }
        }

        dp[idx][lastJump] = 1;
        return false;
    }
}
```

The memo convention here is worth reading twice: `dp[idx][lastJump] = 1` means the frog *cannot*
reach the end from this state, and `-1` means the state has not been explored yet. Only failures
are ever written, because a success returns immediately all the way up.
