[← Back to contents](00-contents.md)

# Top-down DP

## Prerequisites

- DFS chapter
- Bitwise operations
- GCD/LCM basics, eucledian algorithm

## What Top-down DP is all about

Let's consider [House Robber](https://leetcode.com/problems/house-robber/). Stripped of its story, the problem asks for a subset of an array with the highest total sum, under a single restriction: we can't pick two adjacent items.

By now we know how to explore that. Each house is one decision — rob it or don't — so we get the same one-decision-per-index tree we've been drawing since the target sum problem. The adjacency constraint costs us nothing extra: if we decide to rob house `i`, we simply jump over house `i + 1` and continue from `i + 2`. The constraint is baked into the shape of the tree, so every path through it is a valid plan by construction.

Here is the tree for an array of 5 houses. Each node is labelled with the house we are currently deciding about, `END` means we have run off the end of the street, and at each node the left branch skips and the right branch robs:

```
                            i=0
                     /               \
                  i=1                 i=2
                /     \             /     \
             i=2       i=3       i=3       i=4
            /   \     /   \     /   \     /   \
         i=3    i=4  i=4  END  i=4  END  END   END
```

The code is a direct transcription:

```TS
function rob(nums: number[]): number {
    const n = nums.length;

    return best(0);

    // the most we can collect from houses i..n-1
    function best(i: number): number {
        if (i >= n) {
            return 0;
        }

        return Math.max(
            best(i + 1),           // skip house i
            nums[i] + best(i + 2)  // rob house i, so house i + 1 is off limits
        );
    }
}
```

The parameter `i` is the house we are currently at. If we rob, we return `nums[i] + best(i + 2)` — we go to `i + 2` because `i + 1` is no longer allowed. If we don't rob, we simply move to the next house and return `best(i + 1)`. Note that the base case is `i >= n` and not `i === n`: robbing the last house lands us on `n + 1`, one past the end we would expect.

The problem, of course, is that this DFS is far too slow. Two children per node, one level per house", which for `n = 100` gives `2 ** 101 - 1` nodes. The real count is a little kinder, because the rob branch eats two houses instead of one — the node count follows the Fibonacci numbers and works out to roughly `2 ** 71`. It makes no difference. Our magic number from the constraints chapter is 25 million, which is about `2 ** 24`, but `2 ** 71` is astronomic.

## Repeated subtrees

Look at the tree again, this time only at the labels. `i=3` shows up three times. `i=4` shows up four times, and we stopped drawing after three levels. And "the most we can collect from houses 3..n-1" does not depend on how we arrived at house 3 — not on which houses we robbed before it, not on how much we have collected so far, not on how deep in the tree we are. The subtree hanging under the first `i=3` is identical, node for node, to the subtrees under the other two. We are solving the same problem again and again and getting the same answer every time.

So let's stop drawing the same subtree three times and draw it once. Every node labelled `i=3` becomes _the_ node `i=3`, and every arrow that used to point into a copy now points into that single node. Six labels, six nodes:

```
    .---------rob---------. .---------rob---------. .---rob---.
    |                     v |                     v |         v
  i=0 -skip-> i=1 -skip-> i=2 -skip-> i=3 -skip-> i=4 -skip-> END
                |                     ^ |                      ^
                '---------rob---------' '---------rob----------'
```

The skip edges are the straight ones along the middle, each stepping one house to the right. The rob edges are the arcs, each jumping two houses — drawn above the line when they leave an even house and below it when they leave an odd one, purely so they don't run into each other. Both of `i=4`'s edges land past the end of the street, so both point at `END`.

This is no longer a tree. Node `i=2` has two parents — `i=0` reaches it by robbing, `i=1` reaches it by skipping — and once a node has two parents, we are looking at a graph. What we just did is the merge from the very first figure of the DFS chapter, run in reverse: there we removed an edge from a graph to get a tree, here we glued duplicate nodes together to turn a tree back into a graph.

The tree had about `2 ** 71` nodes. The graph has `n + 1`.

It is also a very particular kind of graph: every edge goes from a smaller `i` to a strictly larger `i`. There is no way to come back. A graph with no cycles like this one is called a **DAG** — a directed acyclic graph — and that property is the whole reason the rest of this chapter works.

## DFS with a memo

We already know how to keep DFS from re-walking a graph: when we traverse a graph rather than a tree, we mark nodes as visited so we do not process them twice. Here is that walk in its plainest form — print every node the first time we arrive at it, and never again:

```TS
// adj[u] holds the nodes u points to
function printOnce(n: number, adj: number[][]): void {
    const visited: boolean[] = Array(n).fill(false);

    dfs(0);

    function dfs(u: number): void {
        if (visited[u]) {
            return; // been here already, nothing new below
        }
        visited[u] = true;

        console.log(u);

        for (const v of adj[u]) {
            dfs(v);
        }
    }
}
```

Top-down DP is something slightly stronger. We do not just want to know _that_ we have been to node `i=3` before — we want the answer it gave us last time. So instead of a set of visited nodes, we keep an array of computed answers, and the first lines of the function become "have I solved this one already?".

```TS
function rob(nums: number[]): number {
    const n = nums.length;
    const memo: number[] = Array(n).fill(-1);

    return best(0);

    function best(i: number): number {
        if (i >= n) {
            return 0;
        }

        if (memo[i] !== -1) {
            return memo[i];
        }

        return memo[i] = Math.max(
            best(i + 1),
            nums[i] + best(i + 2)
        );
    }
}
```

That is the entire idea, and that is the whole solution to House Robber. Three lines separate it from the version that would run until the heat death of the sun.

```TS
if (memo[i] !== -1) {
    return memo[i];
}
```

A small but important detail: `-1` works as the "not computed yet" marker only because a real answer can never be `-1` — the values are sums of non-negative numbers. Picking a sentinel that a real answer can also take is a genuinely nasty bug, because the code keeps looking correct and merely returns the wrong number on some inputs. When in doubt, use `null`, or `undefined`, or a separate boolean array.

The cost is now easy to state, and it is the formula we will use for every problem in this chapter:

> **cost = number of states × work per state**

Each node runs its body at most once — every later visit is stopped by the memo check and costs O(1). There are `n` nodes and each does O(1) work outside its recursive calls, so House Robber is O(n) time and O(n) memory. From `2 ** 71` down to `100`.

## Why the DP graph has to be a DAG

Memoization rests on an assumption we never said out loud: when `best(i)` asks for `best(i + 2)`, that call finishes and hands back a finished number. On a DAG that is guaranteed. Every edge moves strictly to the right, so a chain of calls can never lead back to a node that is still on the call stack, still waiting for its own answer.

Break that and the whole thing falls apart. Imagine a version of House Robber where the street is a network of alleys, and from a house we may move to any house at distance 2 or more, forwards _or_ backwards. Now `best(3)` might need `best(1)`, which needs `best(3)` — the recursion asks itself a question it is still in the middle of answering, and the memo has nothing to hand back. Worse, the answer would be wrong even if it did terminate: with backwards moves allowed, "the best I can do from house 3" depends on which houses were already robbed on the way in, so the label `i=3` no longer identifies a subproblem at all.

Cycles like that are not exotic. Games are where they turn up most often, because play can return to a position it has already been in. [Cat and Mouse](https://leetcode.com/problems/cat-and-mouse/) is the classic example — its state graph has cycles, which is exactly why a draw is one of the possible outcomes, and memoized DFS cannot solve it. Its sequel [Cat and Mouse II](https://leetcode.com/problems/cat-and-mouse-ii/) caps the game at 1000 moves, which puts a strictly increasing counter into the state and makes the graph a DAG again. We will come back to both later in the book.

## The moment has passed

Back in the DFS chapter we said: for now, let's focus on trees. That moment has passed. DP is all about graphs.

That is the entire point of the technique, and it is worth saying plainly: **DP turns a decision tree that is too large to walk into a graph that is small enough to walk.** Everything else in this chapter is bookkeeping. The hard part of a DP problem is never the memo — it is defining the graph such that many different paths through the decision tree arrive at the same node.

From here on we will use the standard vocabulary. A node of that graph is a **state**, and a move from one state to another is a **transition**. In House Robber the state is a single number `i`, and the two transitions out of it are "skip" and "rob". Most of the problems ahead need two or three numbers to pin down a state, and the work is deciding which ones.

One more term you will run into everywhere: **overlapping subproblems**. It sounds grander than it is. It is simply the thing we noticed in the House Robber tree — the same subtree, repeated. When a problem is described as having overlapping subproblems, it means its decision tree draws the same subtree over and over, which is precisely what lets us collapse it into a small graph. If the subtrees never repeated, there would be nothing to merge, no graph smaller than the tree, and no DP.

DP works on directed acyclic graphs (DAGs), but often it's not very obvious how to define the DAG after being given a problem statement. Sometimes, it's not even clear if the problem asks for a DP solution or not. So we're now going to explore some common _themes_ in top down DP - problems that look similar in some way and have structures that are easily convertible to a DAG.

## Explicit graph

Some of the more obvious DP problems to spot are the ones where somebody has already drawn the graph for us. Let's look at [Frog Jump](https://leetcode.com/problems/frog-jump/). A frog crosses a river on stones sitting at the sorted positions in `stones`. It starts on the first stone, its first jump must be exactly 1 unit, and from then on, if the jump it just made was `k` units, the next one must be `k - 1`, `k` or `k + 1` units. Jumps always go forward. Can the frog land on the last stone?

If we consider stones as nodes, there is an issue. Take `stones = [0, 1, 2, 3, 4, 7]` and look at the two ways of arriving at the stone at position 4:

```
   0 --jump 1--> 1 --jump 1--> 2 --jump 2--> 4 --jump 3--> 7

   0 --jump 1--> 1 --jump 2--> 3 --jump 1--> 4  (next jump is 1 or 2, and 5 and 6 are both water — the frog is stuck)
```

In both cases, we are at stone 4, but it also matters how much we can jump. The correct approach is therefore to define each node on our DP graph as the pair `(stoneIndex, lastJump)`. `(4, 2)` and `(4, 1)` are now different states, and only one leads to success. Here is the complete DP graph for this array (only valid jumps are drawn).

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

`(5, 3)` is the far bank. `(4, 1)` is the dead end — from position 4 with a last jump of 1 the frog can only reach 5 or 6, and both are water — while `(4, 2)` clears the gap in a single jump of 3. And look at `(4, 1)` once more: both `(3, 1)` and `(3, 2)` lead into it, so it is a node with two parents, which makes this a graph and not a tree.

In such problems, I like to think of each DP state as a _place_. From any place, we can go to at most 3 other places. If the frog is at some place _p_, can it land on the last stone starting from this place _p_? If yes, it does not matter how the frog arrived at _p_, the answer is always yes. If not, the same holds, it does not matter, the answer is always no.

How many nodes are in this graph worst case? The max jump cannot exceed 2000 because in the worst case, we always increase the jump distance by 1 after each jump. So that gives us at most 2000² = 4 million nodes. And each node can have at most 3 outgoing transitions, so our graph has a manageable size.

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

`idxOf` turns a position back into the index of the stone standing there, which is how a jump of `jump` units becomes the next node in O(1). And the frog only gets going if `stones[1] === 1`, since the first jump is fixed at exactly one unit — if the second stone is not at position 1, it never leaves the bank.

By convention, `dp[idx][lastJump] = 1` means that frog cannot reach the end from this state. `dp[idx][lastJump] = -1` means that this state has not been explored yet.

## Knapsack

The knapsack family is the take-or-skip tree from the previous backtracking chapter — one item per level, in or out, but unlike House Robber, there is additional state carried down beside the index: money left to spend, capacity left, how many items we still have to pick, the running sum modulo something, etc.

In [Greatest Sum Divisible by Three](https://leetcode.com/problems/greatest-sum-divisible-by-three/), the tree is the obvious one: one decision per element, take it or leave it, `2 ** n` leaves. With `n` up to 40000 that is not a tree anyone is going to walk, so we need to turn it into a graph.

Let's think again about each index as a place. Taking `a[i]` and skipping it both leave us standing at `i + 1`, so the two transitions out of every place land on the very same next place. Here is the whole graph for an array of 3 elements:

```
    .----take---.           .----take---.
    |           v           |           v
   i=0 -skip-> i=1 -skip-> i=2 -skip-> END
                |           ^
                '----take---'
```

Eight leaves collapse into four nodes, exactly as they did for House Robber. The trouble is that we need to satisfy the modulo constraint. By the time we reach `END`, our sum needs to be divisible by 3. So instead of thinking about each `i` as a single place, we need to consider the 3 versions of each `i`, one version for each modulo 3 of the sum so far.

Here is that graph for `a = [1, 2, 1]`. A node `i|m` means "standing at index `i`, with the sum so far leaving `m` when divided by 3". `i=3` means there is no subarray left to make decisions on. We start at `0|0` and try to reach `3|0` such that the sum is maximized.

```
     |
m=2  |                               ----------------->2|2 ---------->3|2
     |                               |                     \       /
     |                               |                      \    /
     |                               |                       \ /
     |                               |                        X
     |                               |                      /  \
m=1  |              ----------->1|1 ----------------->2|1 /-----\--->3|1
     |             /             |   |                           \  /
     |            /              |   |                            X
     |           /               |------------------->|         /  \
     |          /                    |                |       /     \
     |         /                  ___|                |     /        \
m=0  | -> 0|0 ----------------->1|0 ----------------->2|0 ----------->3|0
     |
     +--------------------------------------------------------------------
          i=0                   i=1                   i=2             i=3
```

Every horizontal arrow is a _skip_ — the index advances, the modulo does not change. Every diagonal is a _take_ — the index advances and the modulo shifts up by `a[i] % 3`, wrapping around from row 2 back to row 0. That is why the take out of `2|2` dives all the way down to `3|0`: `(2 + 1) % 3 === 0`. The three grid positions with no node on them (`0|1`, `0|2`, `1|2`) are simply unreachable, there is no prefix of `a` summing to those remainders. The walk enters at the bottom-left corner and the answer lives in the bottom-right one; `3|1` and `3|2` are final states too, but they fail the divisibility test.

There is only one thing omitted from this graph. For each state we compute and return the maximum sum that can be achieved starting from there. For example, to compute `2|0`, we need to compute `3|0` and `3|1` first. We either skip `a[2] = 1` and end up at `3|0` or take it and end up at `3|1`. Then, we assign the maximum value of the two choices to `2|0`. Relevant piece of code:

```TS
    Math.max(
        a[i] + rec(i + 1, (mod3 + a[i]) % 3), // take a[i]
        rec(i + 1, mod3) // skip it
    )
```

Here is the entire code:

```TS
function maxSumDivThree(a: number[]): number {
    const n = a.length;
    const dp: number[][] = Array(3)
        .fill(null)
        .map(() => Array(n).fill(-1));

    return rec(0, 0);

    // the largest sum we can still add from a[i..], given the sum so far is mod3 (mod 3)
    function rec(i: number, mod3: number): number {
        if (i === n) {
            return mod3 === 0 ? 0 : -1e11;
        }

        if (dp[mod3][i] !== -1) {
            return dp[mod3][i];
        }

        return (dp[mod3][i] = Math.max(
            a[i] + rec(i + 1, (mod3 + a[i]) % 3), // take a[i]
            rec(i + 1, mod3) // skip it
        ));
    }
}
```

Two things to mention here. First, `Array(3).fill(null).map(() => Array(n).fill(-1))` is much faster than `Array(n).fill(null).map(() => Array(3).fill(-1))`, so `dp[mod3][i]` instead of `dp[i][mod3]` is intentional, even though the code would pass regardless (for other problems, it won't).

Secondly, return a very low value `-1e11` for terminal states with `m != 0`. `-1e11` is even smaller than `-sum(a)` This ensures that `Math.max(...)` will never prefer the direction toward a final state with `m != 0`, and it shouldn't, only `n|0` is a valid final state. The implicit convention here is that if our function returns a negative value (other than -1), there is no subset of elements starting from that index such that the sum will be 0. With an array such that `[2, 2]`, there is no way to pick a subset that has `sum % 3 === 0`. In this case, the best subset is the empty subset that always has `m === 0`.

Cost: `3 * n` nodes with 2 transitions for each one. With `n = 1e4`, this is not even 1 million steps.

There is a way to make the `-1e11` trick more explicit - return some special value such that `-Infinity` to indicate a state that is invalid because it only leads to invalid states. The code is more explicit, but somewhat uglier:

```TS
function maxSumDivThree(a: number[]): number {
    const n = a.length;
    const dp: number[][] = Array(3)
        .fill(null)
        .map(() => Array(n).fill(-1));

    return rec(0, 0);

    // the largest sum we can still add from a[i..], or -Infinity when this state
    // has no valid continuation at all
    function rec(i: number, mod3: number): number {
        if (i === n) {
            return mod3 === 0 ? 0 : -Infinity;
        }

        if (dp[mod3][i] !== -1) {
            return dp[mod3][i];
        }

        let best = -Infinity;

        const take = rec(i + 1, (mod3 + a[i]) % 3);
        if (take !== -Infinity) {
            best = Math.max(best, a[i] + take);
        }

        const skip = rec(i + 1, mod3);
        if (skip !== -Infinity) {
            best = Math.max(best, skip);
        }

        return (dp[mod3][i] = best);
    }
}
```

Every combination now has to ask "is the thing I am about to add to even a real answer?" before adding to it, which is three extra branches to say what one very negative number said on its own. Note that `-1` still works as the "not computed yet" marker, since a stored value is now either a non-negative sum or `-Infinity`.

## Two-sequence alignment

Let's consider [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/). Problems with sequences and subsequences are DP favorites and unfortunately, this is something you need to remember, because at first glance, the problem statement does not suggest a DP graph at all. But conider the following decision tree: the state is `(i, j)` where `i` is a pointer inside `text1` and `j` is a pointer inside `text2`. To build any subsequence including the longest one, at each node, have the following choices:

1. increment both `i` and `j` if `text1[i] === text2[j]` and take the character
2. only advance `i` to `i + 1`
3. only advance `j` to `j + 1`

Here is that tree in full for `text1 = "ab"` and `text2 = "cab"`. A `*` marks a node where the two characters agree, so the only sensible move is to take them both; every other node branches left to advance `i` and right to advance `j`.

```
                        (0,0)
                   /               \
          (1,0)                      (0,1)
        /       \                          \ take "a"
  (2,0)           (1,1)                 (1,2)*
                  /       \                   \ take "b"
            (2,1)           (1,2)*          (2,3)
                                   \ take "b"
                                  (2,3)

```

Both the `(1, 2)` subtrees are conveniently identical, so each state `(i, j)` can return the longest common subsequence length of the substrings `text1[i..]` and `text2[j..]`. And we only have to compute each state once.
The number of states is `text1.length * text2.length`.

```TS
function longestCommonSubsequence(text1: string, text2: string): number {
    const n = text1.length;
    const m = text2.length;
    const dp: number[][] = Array(n)
        .fill(null)
        .map(() => Array(m).fill(-1));

    return lcs(0, 0);

    // the longest common subsequence of text1[i..] and text2[j..]
    function lcs(i: number, j: number): number {
        if (i === n || j === m) {
            return 0;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        let ret: number;
        if (text1[i] === text2[j]) {
            ret = 1 + lcs(i + 1, j + 1);
        } else {
            ret = Math.max(lcs(i + 1, j), lcs(i, j + 1));
        }

        return (dp[i][j] = ret);
    }
}
```

Cost: `n * m` states with O(1) work in each. Both strings go up to 1000 characters, so about a million states.

## State machines

A [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) problem is a sequence walked from left to right with a little bit of "what just happened" carried along: whether we are holding a stock, which of two arrays we are walking, the colour of the last house we painted, how many switches we have left. The state is `(index, mode)`, there is a handful of modes, and the transitions are the legal ways to move between them. The index is obvious. Inventing the mode is the whole job. In [Greatest Sum Divisible by Three](https://leetcode.com/problems/greatest-sum-divisible-by-three/) we saw a state machine with 3 states, one of each modulo 3, and each one has two choices, either take the item or not. Each choice led to another (possibly the same) state. In more complex state machine problems, the difficulty is handling many states and many transitions between them, while keeping the graph small enough.

The stock problems are this family's home turf, and [Best Time to Buy and Sell Stock V](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-v/) is the one with every piece on the table at once. We walk `prices` day by day and may complete at most `k` transactions, of two kinds: the normal one, buy now and sell later for `prices[j] - prices[i]`, and the short sale, sell now and buy back later for `prices[i] - prices[j]`. Only one transaction may be open at a time, and the day we close one is not a day we can open the next.

"Only one at a time" is what turns this into a machine with a handful of modes. At the start of any day we are in exactly one of three positions: short (we sold and still owe a buy-back), flat (nothing open), or long (we bought and still have to sell). Better still, the three of them sit on a line — a buy always moves one step right, a sell always moves one step left:

```
                buy                buy
       short ---------> flat ---------> long
             <---------      <---------
                sell               sell
```

Numbering them `-1`, `0` and `1` makes the code somewhat intuitive. `0` means we don't have it, `1` means we have it, `-1` means we owe it. A buy is legal whenever `status < 1`, costs `prices[i]`, and lands on `status + 1`; a sell is legal whenever `status > -1`, collects `prices[i]`, and lands on `status - 1`. Opening a long and covering a short are both "buy" and both pay the same money, which is why the two kinds of transaction need no separate code at all.

What the arrows don't say is _when_ a transaction is closed. When should we count one less transaction to be made? The choice here is to charge it when a position is closed, which is what `status === 0 ? remK : remK - 1` says in both branches: leaving `0` is free, arriving at `0` costs one - we are closing that transaction. That completes the state — `(day, position, transactions left)` — and there are `3 * n * (k + 1)` of them.

```TS
function maximumProfit(prices: number[], k: number): number {
    const n = prices.length;
    // status: -1 short (owes a buy), 0 flat, 1 long (owes a sell)
    const dp: (number | null)[][][] = Array(3).fill(null).map(() =>
        Array(n).fill(null).map(() => Array(k + 1).fill(null)),
    );

    return rec(0, 0, k);

    // the most we can still make from day i on, in this position and budget
    function rec(i: number, status: number, remK: number): number {
        if (i === n) {
            return status === 0 ? 0 : -1e11; // may not end mid-transaction
        }

        const row = dp[status + 1][i]; // status + 1 keeps the index in 0..2
        const hit = row[remK];
        if (hit !== null) {
            return hit;
        }

        let best = rec(i + 1, status, remK); // do nothing today
        if (!remK) {
            return (row[remK] = best);
        }

        if (status < 1) {
            // buy: open a long, or cover a short and end a transaction
            const newRemK = status === 0 ? remK : remK - 1;
            best = Math.max(best, -prices[i] + rec(i + 1, status + 1, newRemK));
        }

        if (status > -1) {
            // sell: open a short, or close a long and end a transaction
            const newRemK = status === 0 ? remK : remK - 1;
            best = Math.max(best, prices[i] + rec(i + 1, status - 1, newRemK));
        }

        return (row[remK] = best);
    }
}
```

The base case returns `-1e11` when the walk ends anywhere other than `0`, because a transaction plan that leaves a position open is not a valid plan, and a hugely negative number is again the standard way to say "impossible" inside a `Math.max` — it can never win one. And the early `if (!remK) return best` looks like it might strand us holding a stock with no budget left to sell it, but it can't: budget is only ever spent on closing, so a position opened while `remK >= 1` still has that unit waiting to pay for its own close.

Cost: `3 * n * (k + 1)` states with O(1) work in each. With `n <= 1000` and `k <= n / 2`, that is at most about 1.5 million.

## Bitmask

Sometimes what are deciding about is a set rather than a sequence: which tasks have been assigned, who is already on the team, which numbers are used up. A subset of `n` items can be represented efficiently with an `n`-bit integer, so the whole state fits in one number and there are `2 ** n` of them. Each 1-bit means we take that element in the subset, each 0-bit means we don't. If the `n`-bit integer is `1001` for instance, it means that only the first and last element of the set are in that subset. These problems always arrive with a tiny `n` — when the constraints say `n <= 14` or `n <= 20` while everything else in the problem is huge, a subset is very likely the intended state. Sometimes we have to iterate through all the subsets. In these cases we simply have to iterate from 0 to `2 ** n` - each number in this interval represents a valid subset.

Let's consider [Minimum XOR Sum of Two Arrays](https://leetcode.com/problems/minimum-xor-sum-of-two-arrays/): two arrays of at most 14 numbers each. Rearrange `nums2` however we like, pay the sum of `nums1[i] XOR nums2[i]` over every index, and make that payment as small as possible.

Rearranging one array is the same thing as pairing every element of `nums1` with a distinct element of `nums2`, so the decision tree is the permutations tree from the backtracking chapter. Permutations tree for `nums2 = [1, 2, 3, 4]`:

```
                                         empty
         /                      /                      \                      \
         1                      2                      3                      4            first choice
  /      |      \        /      |      \        /      |      \        /      |      \
  2      3      4        1      3      4        1      2      4        1      2      3     second choice
 / \    / \    / \      / \    / \    / \      / \    / \    / \      / \    / \    / \
3   4  2   4  2   3    3   4  1   4  1   3    2   4  1   4  1   2    2   3  1   3  1   2   third choice
|   |  |   |  |   |    |   |  |   |  |   |    |   |  |   |  |   |    |   |  |   |  |   |
4   3  4   2  3   2    4   3  4   1  3   1    4   2  4   1  2   1    3   2  3   1  2   1   fourth choice

```

But we can't use the permutations swap algorithm we saw in the last chapter because 14! = 87 billion. Fortunately, we don't have to, because exploring permutations involves unnecessary work. For `nums2 = [1, 2, 3, 4]`, let's consider the following permutations where the last 2 spots are not yet filled:

`[1, 2, ?, ?]`
`[2, 1, ?, ?]`

Notice that to decide the best order for the last two spots, we don't need to know the order on the previous spots. So we are asking the same question twice. And indeed if you follow 2 -> 1 or 1 -> 2 on the tree above, both the subtrees below look identical:

```
  /   \
  3   4
  |   |
  4   3
```

For a giant decision tree with 14 choices, there is a lot of identical subtrees. So we must use DP and turn it into a much smaller graph.
The question we are asking is what is the best way to arrange k elements on the last k spots? We can try either one of those k, and then the question becomes what is the best way to arrange k - 1 elements (without the one we just chose) on the last k - 1 spots?

So we model our state as `taken` (which elements were already taken), an integer that can get as high as `2 ** 14`, where every bit being on/off means that element was already taken or not. For each branch in our decision tree, we try every possible element that was not already taken. This is basically DFS where instead of passing down a stack of indicies of elements already taken, we encapsulate that information into the integer taken - our `bitmask`. Then, we notice the repeating subtrees, turn the tree into a graph and store the the result so we don't have to re-compute it

Here is the entire code:

```TS
function minimumXORSum(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const dp: number[] = Array(2 ** n).fill(-1);

    return rec(0, 0);

    function rec(taken: number, depth: number): number {
        if (depth === n) {
            return 0;
        }

        if (dp[taken] !== -1) {
            return dp[taken];
        }

        let res = 1e11;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }

            const xor = nums1[depth] ^ nums2[i];
            const other = rec(taken | (1 << i), depth + 1);
            res = Math.min(res, other + xor);
        }

        return (dp[taken] = res);
    }
}
```

The interesting line is `dp[taken]`, not `dp[taken][depth]`. `depth` is a parameter but not part of the state, because it is not independent information: every pairing consumes exactly one element from each array, so `depth` is always the number of set bits in `taken`. It rides along only so that we don't have to count bits on every call. Extra parameters that are functions of the real state are common in bitmask code, and keeping them out of the memo is what stops the state count from being multiplied for nothing.

Cost: `2 ** n` states with `n` transitions each — `16384 * 14`, about 230 thousand steps, down from 87 billion.

## Top-down DP pattern summary

The recurring pattern for top-down DP is:

1. Find the decision tree.
2. Notice it is too big to walk with DFS.
3. Notice that the same subtrees appear in it over and over.
4. Glue those copies into a single node, and the tree should become a graph small enough to walk.

That is the whole ideea — the memo is only the bookkeeping that makes each node run its body once.

Everything hard about a DP problem is in the state, the label we put on a node. It has to carry everything the rest of the walk depends on, and nothing else. Carry too little and the label stops identifying a subproblem: the frog standing on stone 4 has a different future depending on the jump that landed it there, so the state is `(stone, lastJump)` and not `stone`. Carry too much and the state count multiplies for no reason: `depth` in the bitmask solution is always the number of set bits in `taken`, so it rides along as a parameter but stays out of the memo. Once the state is right, the transitions are usually just a transcription of the rules — take or skip, buy or sell, which pointer to advance.

The cost is always based on the same formula: **cost = number of states × work per state**.

Two conventions showed up in nearly every solution. `-1` marks "not computed yet", and it is only safe because no real answer can be `-1` — pick a sentinel a real answer can take and you get a bug that looks correct and quietly returns wrong numbers. And a hugely negative number like `-1e11` marks "this state has no valid ending", so that `Math.max` can never prefer it.

## Flat arrays

Once a state needs two or three numbers to pin it down, the memo becomes a multi-dimensional table, and how that table is laid out in memory turns out to be a significant detail.

The natural thing to write in JavaScript is `number[][]`, and the trouble is that this is not a rectangle in memory. It is an array of _references_, each pointing at a separately allocated row object that the engine put wherever there happened to be room. So `dp[i][j]` is not one lookup, it is two dependent ones: load the pointer for row `i`, then index into whatever corner of the heap that row landed in. The second load usually misses the CPU cache, and it cannot even be started until the first has finished. A three-dimensional `dp[i][j][k]` makes it three. On top of that, an `n`-row table costs `n + 1` separate allocations to build, and gives the garbage collector `n + 1` objects to keep track of.

A flat array avoids all of it: one allocation, one contiguous block, one load per access — and because the array only ever holds numbers, the engine can keep the values packed directly in it rather than as pointers to number objects. We already met a smaller version of this argument back in Greatest Sum Divisible by Three, where `Array(3).fill(null).map(() => Array(n).fill(-1))` beat the other nesting order. Fewer, longer rows is the same idea as one very long row, just not carried all the way.

The price is that we have to compute the index ourselves. The rule is the one C compilers use: fix an order for the dimensions, let the last one vary fastest, and the multiplier for each dimension is the product of every dimension after it. For a table of dimensions `[a][b][c]`, the index of `(i, j, k)` is `i * b * c + j * c + k`, which is nicer written folded up as `(i * b + j) * c + k`. Here is the stock table from Best Time to Buy and Sell Stock V both ways:

```TS
// nested — 3 * n * (k + 1) entries, but 1 + 3 + 3 * n separate allocations
const dp: (number | null)[][][] = Array(3).fill(null).map(() =>
    Array(n).fill(null).map(() => Array(k + 1).fill(null)),
);
dp[status + 1][i][remK] = best;

// flat — the same table, one allocation, one load per access
const K1 = k + 1;
const dp: number[] = Array(3 * n * K1).fill(-1);
dp[((status + 1) * n + i) * K1 + remK] = best;
```

The difference is not subtle. Filling and reading back every entry of a 300 by 300 by 16 table — 1.44 million of them, the size Count Paths With the Given XOR Value actually uses — takes about 13 ms nested and about 3.5 ms flat on Node 22. Going one step further to `new Int32Array(size)` gets it to about 2 ms. This makes it almost 7 times faster. In more serious DP problems, you can legitimately run into 1000ms (guaranteed pass) vs 6500ms (guaranteed fail) situations. In some DP problems, we can have 3D, 4D and 5D nested arrays, so this optimization becomes a must. Even though the time complexity and number of steps are exactly the same, object layout in memory is always a hidden threat to watch out for, at least in the JS world.

## Closing notes on top-down DP

DP will get harder and then much harder in later chapters, but what was covered here is foundational. leetcode likes top down DP very much - over 100/2000 mediums/hards solved by me involving nothing but top down DP and over 250/2000 involving top down DP along with other patterns discussed later in the book.

Even though all DP problems in this chapter follow these patterns, there are still some common pitfalls to fall into - too many to mention without concrete examples. This is way I can't recommend enough attempting to solve the practice problems on your own. Almost each one will teach you some small detail. Make sure you check the solution before moving to the next.

## Top-down DP practice problems

- https://leetcode.com/problems/length-of-the-longest-subsequence-that-sums-to-target/
- https://leetcode.com/problems/minimum-time-to-make-rope-colorful/
- https://leetcode.com/problems/max-dot-product-of-two-subsequences/
- https://leetcode.com/problems/count-vowels-permutation/
- https://leetcode.com/problems/dice-roll-simulation/
- https://leetcode.com/problems/stone-game-iii/
- https://leetcode.com/problems/sum-of-k-subarrays-with-length-at-least-m/
- https://leetcode.com/problems/can-i-win/
- https://leetcode.com/problems/stone-game-iv/
- https://leetcode.com/problems/longest-non-decreasing-subarray-from-two-arrays/
- https://leetcode.com/problems/paint-house-iii/
- https://leetcode.com/problems/ones-and-zeroes/
- https://leetcode.com/problems/minimum-swaps-to-make-sequences-increasing/
- https://leetcode.com/problems/find-the-number-of-subsequences-with-equal-gcd/
- https://leetcode.com/problems/count-paths-with-the-given-xor-value/
- https://leetcode.com/problems/minimum-time-to-kill-all-monsters/
- https://leetcode.com/problems/maximum-amount-of-money-robot-can-earn/
- https://leetcode.com/problems/maximum-profit-from-valid-topological-order-in-dag/
- https://leetcode.com/problems/maximum-path-score-in-a-grid/
- https://leetcode.com/problems/special-permutations/
- https://leetcode.com/problems/coin-change/
- https://leetcode.com/problems/maximum-non-negative-product-in-a-matrix/
- https://leetcode.com/problems/count-ways-to-choose-coprime-integers-from-rows/
- https://leetcode.com/problems/minimum-number-of-work-sessions-to-finish-the-tasks/
- https://leetcode.com/problems/the-most-similar-path-in-a-graph/
- https://leetcode.com/problems/palindrome-partitioning-iii/. Before you try, make sure you know how to find all palindromes in a string in O(n^2) [by expanding from center](https://medium.com/@k.manu00005/find-all-palindrome-substrings-778675759dac). This is a simple and useful algorithm to keep in mind whenever you read the word "palindrome".
- https://leetcode.com/problems/maximum-score-of-spliced-array/
- https://leetcode.com/problems/shortest-common-supersequence/
- https://leetcode.com/problems/stickers-to-spell-word/
- https://leetcode.com/problems/minimum-increments-for-target-multiples-in-an-array/
- https://leetcode.com/problems/minimum-total-distance-traveled/
- https://leetcode.com/problems/regular-expression-matching/
- https://leetcode.com/problems/apply-operations-to-make-two-strings-equal/
- https://leetcode.com/problems/maximum-points-after-collecting-coins-from-all-nodes/
- https://leetcode.com/problems/find-all-possible-stable-binary-arrays-i/
- https://leetcode.com/problems/maximum-and-sum-of-array/
- https://leetcode.com/problems/minimum-time-to-build-blocks/
- https://leetcode.com/problems/number-of-great-partitions/
- https://leetcode.com/problems/painting-the-walls/

## Top-down DP practice problems solved

**[Length of the Longest Subsequence That Sums to Target](https://leetcode.com/problems/length-of-the-longest-subsequence-that-sums-to-target/)**

Classic take-no-take. For each state, track the first undecided number and the remaining sum needed. State = `(i, remainingSum)`.
Cost: `nums.length * (target + 1)` states with 2 transitions each — 1000 \* 1001.

```TS
function lengthOfLongestSubsequence(nums: number[], target: number): number {
    const n = nums.length;
    const dp: number[][] = Array(target + 1).fill(null).map(() => Array(n).fill(-1));

    const res = best(0, target);
    return res < 0 ? -1 : res;

    // the longest subsequence of nums[i..] that sums to exactly rem
    function best(i: number, rem: number): number {
        if (rem === 0) {
            return 0;
        }

        if (i === n || rem < 0) {
            return -1e11; // ran out of numbers, or overshot
        }

        if (dp[rem][i] !== -1) {
            return dp[rem][i];
        }

        return dp[rem][i] = Math.max(
            best(i + 1, rem),                // skip nums[i]
            1 + best(i + 1, rem - nums[i]),  // take it
        );
    }
}
```

**[Minimum Time to Make Rope Colorful](https://leetcode.com/problems/minimum-time-to-make-rope-colorful/)**

Another knapsack take-no-take. Once we reach some balloon index `i`, regardless of what we choose to pop before `i`, the only other relevant piece of information is what is the color of the last unpopped balloon. So this is our state: `(i, lastColor)`. We just need to compute and return the minimum cost from each state - and we can either choose to remove or not remove. But keeping is possible only if it has a different color than the last.

There is another trick needed: we use stub color 26 to indicate that there is no previous balloon, so we can keep any balloon next.

Cost: `n * 26` states with 2 transitions each.

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

**[Max Dot Product of Two Subsequences](https://leetcode.com/problems/max-dot-product-of-two-subsequences/)**

We track how far we are in nums1 and nums2 in our state. The only wrinkle here is that the subsequences must be non-empty. With all-negative numbers in one array and all-positive in the other, the best dot product is negative, and an empty pairing scoring 0 would beat it. So a third field records whether anything has been paired yet, and we only accept walks that paired at least once. State = `(i, j, tookAtLeastOnce)`.

Cost: `(n + 1) * (m + 1) * 2` states with 3 transitions each.

```TS
function maxDotProduct(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const m = nums2.length;
    const dp: number[] = Array((n + 1) * (m + 1) * 2).fill(-1);

    return best(0, 0, 0);

    // the best dot product still obtainable from nums1[i..] and nums2[j..],
    // where took says whether we have already paired something
    function best(i: number, j: number, took: number): number {
        if (i === n && j === m) {
            return took ? 0 : -1e15; // both subsequences must be non-empty
        }

        const key = (i * (m + 1) + j) * 2 + took;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = -1e15;
        if (i < n && j < m) {
            res = Math.max(res, nums1[i] * nums2[j] + best(i + 1, j + 1, 1)); // pair them
        }
        if (i < n) {
            res = Math.max(res, best(i + 1, j, took)); // drop nums1[i]
        }
        if (j < m) {
            res = Math.max(res, best(i, j + 1, took)); // drop nums2[j]
        }

        return dp[key] = res;
    }
}
```

**[Count Vowels Permutation](https://leetcode.com/problems/count-vowels-permutation/)**

If the last letter was `last`, how many valid stings of length `len` are possible? State = `(len, last)`.

Cost: `n * 5` states with at most 4 transitions each — `20000 * 5 = 100000`.

```TS
function countVowelPermutation(n: number): number {
    const MOD = 1e9 + 7;
    // which vowel may follow which: a=0, e=1, i=2, o=3, u=4
    const next: number[][] = [
        [1],          // a -> e
        [0, 2],       // e -> a, i
        [0, 1, 3, 4], // i -> a, e, o, u
        [2, 4],       // o -> i, u
        [0],          // u -> a
    ];
    const dp: number[][] = Array(5).fill(null).map(() => Array(n + 1).fill(-1));

    let res = 0;
    for (let v = 0; v < 5; v++) {
        res += count(n - 1, v)
        res %= MOD
    }
    return res;

    // how many valid strings of length "len" start with the last letter being "last"
    // and the last one being vowel `last`
    function count(len: number, last: number): number {
        if (len === 0) {
            return 1;
        }

        if (dp[last][len] !== -1) {
            return dp[last][len];
        }

        let res = 0;
        for (const v of next[last]) {
            res += count(len - 1, v)
            res %= MOD;
        }

        return dp[last][len] = res;
    }
}
```

**[Dice Roll Simulation](https://leetcode.com/problems/dice-roll-simulation/)**

Our state is "which number came up last, and how many times in a row". The streak is at most 15, the face is one of 6, and the sequence length is the third dimension. Rolling a different face resets the streak to 1; rolling the same face extends it, and is simply not allowed once the cap is reached.

Cost: `n * 7 * 16` states with 6 transitions each.

```TS
function dieSimulator(n: number, rollMax: number[]): number {
    const MOD = 1e9 + 7;
    const dp: number[] = Array(n * 7 * 16).fill(-1);

    return count(0, 0, 0); // face 0 with a streak of 0 means "nothing rolled yet"

    // how many ways to fill the remaining n - size rolls, given the last roll was
    // `last`, repeated `streak` times in a row
    function count(size: number, last: number, streak: number): number {
        if (size === n) {
            return 1;
        }

        const key = (size * 7 + last) * 16 + streak;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 0;
        for (let face = 1; face <= 6; face++) {
            if (face !== last) {
                res += count(size + 1, face, 1);
            } else if (streak < rollMax[face - 1]) { // rollMax is 0-indexed by face - 1
                res += count(size + 1, face, streak + 1);
            }
        }

        return dp[key] = res % MOD;
    }
}
```

**[Stone Game III](https://leetcode.com/problems/stone-game-iii/)**

The correct question to define our DP states and transitions is "what is the best score achievable by any player from position `i`?" (with all items in subarray `[0..i - 1]` having been taken already). The state is just the position, and we simply try to take from 1 to 3 stones (if possible).

Cost: `n` states with 3 transitions each.

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

**[Sum of K Subarrays With Length at Least M](https://leetcode.com/problems/sum-of-k-subarrays-with-length-at-least-m/)**

Exactly `k` non-overlapping subarrays, each at least `m` long. Walking left to right, the state is `(i, subarrays already closed, length of the one currently open)` — and the open length can be capped at `m`, because once a subarray is long enough the exact length stops mattering. That cap is the difference between an `n * k * n` table and an `n * k * m` one.

We can either take `nums[i]` into the open subarray while we still have subarrays to spend. Skipping it is only legal when nothing is open. And closing an open subarray is legal only at exactly length `m` or more — which, thanks to the cap, is the single value `m`.

Cost: `n * (k + 1) * (m + 1)` states with 2 transitions each.

```TS
function maxSum(nums: number[], k: number, m: number): number {
    const n = nums.length;
    const dp: (number | null)[] = Array((n + 1) * (k + 1) * (m + 1)).fill(null);

    return best(0, 0, 0);

    // the best total from nums[i..], with `closed` subarrays already finished and
    // an open one of length `size` (capped at m, 0 meaning none open)
    function best(i: number, closed: number, size: number): number {
        if (i === n) {
            if (size === 0) {
                return closed === k ? 0 : -1e11;
            }
            // the open one still has to be closed, and only a full-length one may be
            return size === m && closed + 1 === k ? 0 : -1e11;
        }

        const key = (i * (k + 1) + closed) * (m + 1) + size;
        const hit = dp[key];
        if (hit !== null) {
            return hit;
        }

        let res = -1e11;
        if (closed < k) {
            res = Math.max(res, nums[i] + best(i + 1, closed, Math.min(m, size + 1)));
        }
        if (size === 0) {
            res = Math.max(res, best(i + 1, closed, 0)); // skip nums[i]
        } else if (size === m) {
            res = Math.max(res, best(i, closed + 1, 0)); // close before nums[i]
        }

        return dp[key] = res;
    }
}
```

**[Can I Win](https://leetcode.com/problems/can-i-win/)**

Because both players play optimally, we don't need to store in the state whose turn it is - the state is the same for either of them.
Any player can win from a given state if there is a move available that results in a state that is unwinnnable. So we need to decide which are the winnable states. `maxChoosableInteger <= 20` so we can encode which numbers are still avaialable to be taken in a bitmask.

The remaining terget sum `rem` doesn't need to be part of the state because it's determined by which numbers were taken so far, regardless of who took them.

The problem statement is a bit vague about what happens if the sum of all integers is less than `desiredTotal`. Test cases suggest that the first player can't force a win in this case, regardless if it would be his turn or not when there are no more integers to choose from. To get rid of this edge case, we check it in the beginning.

Cost: `2 ** 20` states with 20 transitions each in the worst case, at most 20 million transitions.

```TS
function canIWin(maxChoosableInteger: number, desiredTotal: number): boolean {
    const n = maxChoosableInteger;

    if ((n * (n + 1)) / 2 < desiredTotal) {
        return false; // even taking everything cannot reach the target
    }

    const dp: number[] = Array(2 ** n).fill(-1);

    return !!isWinnable(0, desiredTotal);

    function isWinnable(taken: number, rem: number): number {
        if (dp[taken] !== -1) {
            return dp[taken];
        }

        let res = 0;
        for (let i = 1; i <= n; i++) {
            const bit = 1 << (i - 1);
            if (taken & bit) {
                continue;
            }
            if (i >= rem || !isWinnable(taken | bit, rem - i)) {
                res = 1; // i finishes the game, or leaves the opponent losing
                break;
            }
        }

        return dp[taken] = res;
    }
}
```

**[Stone Game IV](https://leetcode.com/problems/stone-game-iv/)**

Our state is the number of stones left and each state has at most `sqrt(n)` transitions.
That's about 30 million O(1) steps, but we need to remember that as the number of stones decreases, the number of possible transitions decreases as well. Actually, sqrt(1) + sqrt(2) + ... + sqrt(100000) = 21 million. And because the actual operations are so basic, this code runs in 81ms.

```TS
function winnerSquareGame(n: number): boolean {
    const dp: number[] = Array(n + 1).fill(-1);

    return !!canWin(n);

    // can the player facing `stones` force a win
    function canWin(stones: number): number {
        if (stones === 0) {
            return 0; // nothing to take, the player to move has lost
        }

        if (dp[stones] !== -1) {
            return dp[stones];
        }

        for (let take = 1; take * take <= stones; take++) {
            if (!canWin(stones - take * take)) {
                return dp[stones] = 1;
            }
        }

        return dp[stones] = 0;
    }
}
```

**[Longest Non-decreasing Subarray From Two Arrays](https://leetcode.com/problems/longest-non-decreasing-subarray-from-two-arrays/)**

We want to return the length of the longest non-decreasing subarray starting from each state. State only needs to hold the array and the index in that array.
Each `nums3[i]` must either be `nums1[i]` or `nums2[i]`, so we from any state we either move to the next index in `nums1` or in `nums2`.
However, we don't know where the optimal non-decreasing subarray starts, so we should consider all states as potential starting points:

```TS
    for (let i = 0; i < n; i++) {
        res = Math.max(res, len(i, 0), len(i, 1));
    }
```

Complete solution:

```TS
function maxNonDecreasingLength(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const arrs = [nums1, nums2];
    const dp: number[] = Array(n * 2).fill(-1);

    let res = 0;
    for (let i = 0; i < n; i++) {
        res = Math.max(res, len(i, 0), len(i, 1));
    }
    return res;

    // the longest non-decreasing run that starts at i by taking arrs[arr][i]
    function len(i: number, arr: number): number {
        const key = i * 2 + arr;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 1;
        if (i + 1 < n) {
            for (let nxt = 0; nxt <= 1; nxt++) {
                if (arrs[nxt][i + 1] >= arrs[arr][i]) {
                    res = Math.max(res, 1 + len(i + 1, nxt));
                }
            }
        }

        return dp[key] = res;
    }
}
```

Cost: `n * 2` states with 2 transitions each.

**[Paint House III](https://leetcode.com/problems/paint-house-iii/)**

The correct recursive question to ask here is: If we are at house `i` and the previous house has color `lastColor` and `groups` groups of same color houses have already been formed, what is the smallest cost to achieve target groups in total from here?

That's a total of `m * (n + 1) * (target + 1)` states, and we can afford to explore each possible color as a transition from each of them.

Total cost: 100 \* 21 \* 101 \* 20, about 4 million.

```TS
function minCost(houses: number[], cost: number[][], m: number, n: number, target: number): number {
    const INF = 1e15;
    // [house][previous colour, 0 for none][neighbourhoods so far]
    const dp: number[][][] = Array(m).fill(null).map(() =>
        Array(n + 1).fill(null).map(() => Array(target + 1).fill(-1)),
    );

    const res = best(0, 0, 0);
    return res >= INF ? -1 : res;

    // the cheapest way to paint houses[i..] given the previous colour and group count
    function best(i: number, lastColor: number, groups: number): number {
        if (groups > target) {
            return INF; // already too fragmented
        }

        if (i === m) {
            return groups === target ? 0 : INF;
        }

        if (dp[i][lastColor][groups] !== -1) {
            return dp[i][lastColor][groups];
        }

        let res = INF;
        if (houses[i] !== 0) {
            const c = houses[i];
            res = best(i + 1, c, groups + (c !== lastColor ? 1 : 0));
        } else {
            for (let c = 1; c <= n; c++) {
                res = Math.min(
                    res,
                    cost[i][c - 1] + best(i + 1, c, groups + (c !== lastColor ? 1 : 0)),
                );
            }
        }

        return dp[i][lastColor][groups] = res;
    }
}
```

**[Ones and Zeroes](https://leetcode.com/problems/ones-and-zeroes/)**

Take-no-take, we only need to track two capacities instead of one: zeroes and ones. The total amount of zeroes or ones in all strings can get as high as 60000, and `60000 * 60000 * 600` would be way too much. So we use this very important piece of information: `m, n <= 100`.

Cost: `strs.length * (m + 1) * (n + 1)` states with 2 transitions each — 600 \* 101 \* 101, about 6 million.

```TS
function findMaxForm(strs: string[], m: number, n: number): number {
    const L = strs.length;
    const zeros: number[] = Array(L).fill(0);
    const ones: number[] = Array(L).fill(0);

    for (let i = 0; i < L; i++) {
        for (const ch of strs[i]) {
            if (ch === '0') {
                zeros[i]++;
            } else {
                ones[i]++;
            }
        }
    }

    const dp: number[] = Array(L * (m + 1) * (n + 1)).fill(-1);

    return best(0, m, n);

    // the largest subset of strs[i..] that fits in z zeros and o ones
    function best(i: number, z: number, o: number): number {
        if (i === L) {
            return 0;
        }

        const key = (i * (m + 1) + z) * (n + 1) + o;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = best(i + 1, z, o); // skip strs[i]
        if (zeros[i] <= z && ones[i] <= o) {
            res = Math.max(res, 1 + best(i + 1, z - zeros[i], o - ones[i])); // take it
        }

        return dp[key] = res;
    }
}
```

**[Minimum Swaps To Make Sequences Increasing](https://leetcode.com/problems/minimum-swaps-to-make-sequences-increasing/)**

If the current state is at some index i, we can assume that all previous indicies already have increasing values. We only need to look back and `nums1[i - 1]` and `nums2[i - 1]` which may or may not have been swapped, and this previous boolean decision is what the state needs. The transitions are simply swap or no-swap.

Cost: `n * 2` states with 2 transitions each.

```TS
function minSwap(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const dp: number[] = Array(n * 2).fill(-1);

    return Math.min(count(1, 0), 1 + count(1, 1));

    // the fewest swaps over indices i.., given whether index i - 1 was swapped
    function count(i: number, prevSwapped: number): number {
        if (i === n) {
            return 0;
        }

        const key = i * 2 + prevSwapped;
        if (dp[key] !== -1) {
            return dp[key];
        }

        // what actually ends up behind us in the two arrays
        const a = prevSwapped ? nums2[i - 1] : nums1[i - 1];
        const b = prevSwapped ? nums1[i - 1] : nums2[i - 1];

        let res = 1e11;
        if (a < nums1[i] && b < nums2[i]) {
            res = Math.min(res, count(i + 1, 0));
        }
        if (a < nums2[i] && b < nums1[i]) {
            res = Math.min(res, 1 + count(i + 1, 1));
        }

        return dp[key] = res;
    }
}
```

**[Find the Number of Subsequences With Equal GCD](https://leetcode.com/problems/find-the-number-of-subsequences-with-equal-gcd/)**

Every element goes into the first subsequence, the second, or neither — three transitions instead of two — and the only thing the verdict needs is the gcd of each side, which never exceeds 200. So the state is `(i, gcd of the first, gcd of the second)`.

`0` means "this side is still empty", which works out nicely because `gcd(0, x) === x`, so the first element added to a side sets that side's gcd without any special case.

Cost: `n * 201 * 201` states with 3 transitions each — 200 \* 201 \* 201, about 8 million states.

```TS
function subsequencePairCount(nums: number[]): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    const dp: number[][][] = Array(n).fill(null).map(() =>
        Array(201).fill(null).map(() => Array(201).fill(-1)),
    );

    return count(0, 0, 0);

    // pairs of disjoint non-empty subsequences of nums[i..] that even out the two
    // running gcds, where 0 means "nothing in this one yet"
    function count(i: number, g1: number, g2: number): number {
        if (i === n) {
            return g1 !== 0 && g1 === g2 ? 1 : 0;
        }

        if (dp[i][g1][g2] !== -1) {
            return dp[i][g1][g2];
        }

        const skip = count(i + 1, g1, g2);
        const first = count(i + 1, gcd(g1, nums[i]), g2);
        const second = count(i + 1, g1, gcd(g2, nums[i]));

        return dp[i][g1][g2] = (skip + first + second) % MOD;
    }

    function gcd(a: number, b: number): number {
        while (b !== 0) {
            const t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
```

**[Count Paths With the Given XOR Value](https://leetcode.com/problems/count-paths-with-the-given-xor-value/)**

Each cell on the grid maps to 16 different states, one for each possible value that can result from xoring previous cells on

Cost: `m * n * 16` states with 2 transitions each — at the maximum 300 by 300 grid, 1.4 million states.

```TS
function countPathsWithXorValue(grid: number[][], k: number): number {
    const MOD = 1e9 + 7;
    const m = grid.length;
    const n = grid[0].length;
    const dp: number[] = Array(m * n * 16).fill(-1);

    return count(0, 0, 0);

    function count(i: number, j: number, acc: number): number {
        if (i === m || j === n) {
            return 0;
        }

        acc ^= grid[i][j];

        if (i === m - 1 && j === n - 1) {
            return acc === k ? 1 : 0;
        }

        const key = (i * n + j) * 16 + acc;
        if (dp[key] !== -1) {
            return dp[key];
        }

        return dp[key] = (count(i + 1, j, acc) + count(i, j + 1, acc)) % MOD;
    }
}
```

**[Minimum Time to Kill All Monsters](https://leetcode.com/problems/minimum-time-to-kill-all-monsters/)**

> You are given an integer array `power`, where `power[i]` is the power of the `i`-th monster. You start with `0` mana and a gain rate of `gain = 1`. Every day your mana grows by `gain`, and at the end of a day you may defeat one monster if your mana is at least its power. Defeating a monster resets your mana to `0` and increases `gain` by `1`. Return the minimum number of days needed to defeat every monster.
>
> Constraints: `1 <= power.length <= 17`, `1 <= power[i] <= 10⁹`.

Here we need to find the optimal order to kill monsters as everything else depends on that order. Once we choose a monster, we can only wait some time for the power to grow. But once the power exceeds the monster power, there is no reason to wait any longer. Our state is simply the set of monsters that were already killed. The `gain` parameter depends solely on how many monsters were killed, so we don't need to make it part of the state.

Cost: `2 ** 17` states with 17 transitions each — about 2.2 million.

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

**[Maximum Amount of Money Robot Can Earn](https://leetcode.com/problems/maximum-amount-of-money-robot-can-earn/)**

Right-and-down grid again. We need to find the path that leads to the most amount of money. And one small piece of state state: how many neutralizations do we have left? That makes 3 versions of each cell on the grid. And when choosing to go down or right, we can also choose to neutralize then go down or right.

Because the grid ends at some point, we should check to make sure we're not ever getting right of the rightmost column or below the last row. But we can also simply return our favorite `-1e11` after getting outside the grid and because of `Math.max`, we won't have to worry about an invalid path ever being picked.

Cost: `m * n * 3` states with 4 transitions each.

```TS
function maximumAmount(coins: number[][]): number {
    const m = coins.length;
    const n = coins[0].length;
    // [row][col][neutralizations left]
    const dp: (number | null)[] = Array(m * n * 3).fill(null);

    return best(0, 0, 2);

    // the most we can still collect walking from (r, c) to the corner
    function best(r: number, c: number, left: number): number {
        if (r === m || c === n) {
            return -1e11; // walked off the grid
        }

        const key = (r * n + c) * 3 + left;
        const hit = dp[key];
        if (hit !== null) {
            return hit;
        }

        const v = coins[r][c]; // cell value

        if (r === m - 1 && c === n - 1) {
            // the last cell: take it, or neutralize it if it hurts and we still may
            return dp[key] = v < 0 && left > 0 ? 0 : v;
        }

        // don't neutralize
        let res = v + Math.max(best(r + 1, c, left), best(r, c + 1, left));

        // neutralize, if possible
        if (v < 0 && left > 0) {
            res = Math.max(
                res,
                best(r + 1, c, left - 1),
                best(r, c + 1, left - 1)
            );
        }

        return dp[key] = res;
    }
}
```

**[Maximum Profit From Valid Topological Order in DAG](https://leetcode.com/problems/maximum-profit-from-valid-topological-order-in-dag/)**

With `n = 22`, bitwise DP should quickly come to mind. Here, we need to find an optimal permutation, so our state becomes the set of nodes that were already taken and we want to find the best (with highest score) way to arrage the remaining nodes.

Cost: `2 ** n` states with `n` transitions each — 4 million \* 22, about 88 million, down from 22! orderings. That's almost 4 times slower than our 25 million guideline, and indeed it passes in 1.4s, not exactly the fastest, but that's ok.

The reason it passes at all is because in a big complex DAG with a lot of dependencies, a lot of states can't be reached. For some new A -> B dependency, each permutation where node B comes before node A is no longer valid so its entire subgraph is no longer reachable - the entire DAG shrinks. The work done inside the for loop is also very little: a shift, an or, two compares, and no recursive call at all unless the node is ready, so 92 million is acceptable in this case.

```TS
function maxProfit(n: number, edges: number[][], score: number[]): number {
    const parents: number[] = Array(n).fill(0);
    for (const [a, b] of edges) {
        parents[b] |= 1 << a;
    }

    const dp: number[] = Array(1 << n).fill(-1);

    return best(0, 0);

    // the most we can still earn, having placed the nodes in `placed`
    // in the first `count` positions (count is popcount(placed))
    function best(count: number, placed: number): number {
        if (count === n) {
            return 0;
        }

        if (dp[placed] !== -1) {
            return dp[placed];
        }

        let res = 0;
        for (let i = 0; i < n; i++) {
            const node = 1 << i;
            const ready = (parents[i] | placed) === placed; // all parents already placed
            if (!(placed & node) && ready) {
                res = Math.max(res, (count + 1) * score[i] + best(count + 1, placed | node));
            }
        }

        return dp[placed] = res;
    }
}
```

**[Maximum Path Score in a Grid](https://leetcode.com/problems/maximum-path-score-in-a-grid/)**

Another "find best path in grid" type problem, but this time we need to find a path (if any) such that its total cost does not exceed k. There are `k + 1` different states for each cell, one for each possible budget left once that cell is reached.

Cost: `m * n * k` states with 2 transitions each — about 16 million at the top end, all of it O(1) work.

```TS
const SCORE = [0, 1, 2];
const COST = [0, 1, 1];

function maxPathScore(grid: number[][], k: number): number {
    const m = grid.length;
    const n = grid[0].length;
    const dp: number[] = Array(m * n * (k + 1)).fill(-1);

    return Math.max(-1, score(0, 0, k));

    // the best score from (i, j) to the corner, with this much budget left
    function score(i: number, j: number, budget: number): number {
        if(i === m || j === n) {
            return -1e11;
        }
        const cost = COST[grid[i][j]];
        if (budget < cost) {
            return -1e11; // cannot even afford to stand here
        }

        const s = grid[i][j];
        if (i === m - 1 && j === n - 1) {
            return s;
        }

        const key = (i * n + j) * (k + 1) + budget;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const right = score(i, j + 1, budget - cost)
        const down = score(i + 1, j, budget - cost)

        return dp[key] = s + Math.max(right, down);
    }
}
```

**[Special Permutations](https://leetcode.com/problems/special-permutations/)**

We need all the permutations that satisfy the constraint. Our state is simply the last number in the permutation and a bitmask that stores which numbers were taken.

Cost: `n * 2 ** n` states with `n` transitions each — about 3 million.

```TS
function specialPerm(nums: number[]): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    const ALL = (1 << n) - 1;
    const dp: number[][] = Array(n).fill(null).map(() => Array(1 << n).fill(-1));

    let res = 0;
    for (let i = 0; i < n; i++) {
        res = count(i, 1 << i)
        res %= MOD;
    }
    return res;

    // the number of ways to lay out the numbers outside `used` after nums[last]
    function count(last: number, taken: number): number {
        if (taken === ALL) {
            return 1;
        }

        if (dp[last][taken] !== -1) {
            return dp[last][taken];
        }

        let res = 0;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }
            if (nums[last] % nums[i] === 0 || nums[i] % nums[last] === 0) {
                res += count(i, taken | (1 << i));
                res %= MOD;
            }
        }

        return dp[last][taken] = res;
    }
}
```

**[Coin Change](https://leetcode.com/problems/coin-change/)**

The first time I solved this I made the state `(i, rem)` — which coin type we are looking at and how much change is still owed — and let the recursive call decide how many coins of that type to take before moving on to the next one. The problem statement says we have an infinite number of each coin, so "how many of this one?" reads like the decision being asked for. The relevant piece of code:

```TS
let res = 1e11;
for (let c = 0; c * coins[i] <= rem; c++) {
    res = Math.min(res, c + rec(i + 1, rem - c * coins[i]));
}
```

That is a valid graph and it returns the right answer. The trouble is the transitions. A node `(i, rem)` gets one transition for every count that fits, so with a coin of value 1 and `rem = 10000`, that one node has ten thousand of them. And nearly all are redundant: the transition taking four coins at once lands on `(i + 1, rem - 4 * coins[i])`, which is exactly where we arrive by taking one coin four times over — and the states it passes through on the way, `(i, rem - coins[i])` and the rest, are already sitting in the table. Every long transition flies over nodes the memo is holding anyway, recomputing what one short step and a lookup would have handed back.

It is the same mistake as solving House Robber by trying to skip 1, 2, 3, ... `n` houses in a row from every house. All of those skips are legal and the answer still comes out right, but a skip of four is only four skips of one, and the tree we drew at the start of the chapter never needed more than two branches per node.

So we let the recursion do the repeating. From `(i, rem)` the question is which is the minimum number of coins with `coinIndex >= i` that have values that sum up to `rem`. There are exactly two moves: Take one more coin of type `i` and stay on `i`, or give up on type `i` for good and move to `i + 1`.

```TS
    take = 1 + rec(i, rem - coins[i])
    skip = rec(i + 1, rem)
```

I would be ashamed to admit that I also screwed this problem up the second time I solved it a few months later, so I won't.

Cost: `n * (amount + 1)` states with 2 transitions each — `12 * 10001`, about 120 thousand steps, down from roughly 105 million for the version above.

```TS
function coinChange(coins: number[], amount: number): number {
    const n = coins.length;
    const dp: number[] = Array(n * (amount + 1)).fill(-1);

    const res = rec(0, amount);
    return res >= 1e11 ? -1 : res;

    // the fewest coins from coins[i..] that add up to exactly rem
    function rec(i: number, rem: number): number {
        if (rem === 0) {
            return 0;
        }

        if (i === n) {
            return 1e11; // out of coin types with change still owed
        }

        const key = i * (amount + 1) + rem;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = rec(i + 1, rem); // done with this coin type
        if (coins[i] <= rem) {
            res = Math.min(res, 1 + rec(i, rem - coins[i])); // take one more
        }

        return dp[key] = res;
    }
}
```

**[Maximum Non Negative Product in a Matrix](https://leetcode.com/problems/maximum-non-negative-product-in-a-matrix/)**

Right-and-down grid again, but a single number per state is not enough this time. If the current cell is negative, the path we want below it is the one with the _smallest_ product, because multiplying by a negative flips the ordering. So a state returns a pair — the smallest and the largest product reachable from it — and both are needed to compute the pair one step up.

One practical detail: the grid is at most 15 by 15 and cells go up to 4 in magnitude, so a product can reach `4 ** 29`, which is well past the `2 ** 53` that a JavaScript number holds exactly. The comparisons have to be exact for the DP to be right, so the products are `BigInt` and the modulo is applied once, at the end.

Cost: `m * n` states, each returning a pair of numbers — 225 states.

```TS
function maxProductPath(grid: number[][]): number {
    const MOD = 1000000007n;
    const m = grid.length;
    const n = grid[0].length;
    // [smallest product, largest product] over all paths from (i, j) to the corner
    const dp: ([bigint, bigint] | null)[][] = Array(m).fill(null).map(() => Array(n).fill(null));

    const [, largest] = range(0, 0);
    return largest < 0n ? -1 : Number(largest % MOD);

    function range(i: number, j: number): [bigint, bigint] {
        const v = BigInt(grid[i][j]);

        if (i === m - 1 && j === n - 1) {
            return [v, v];
        }

        const hit = dp[i][j];
        if (hit !== null) {
            return hit;
        }

        let lo: bigint | null = null;
        let hi: bigint | null = null;
        for (const [ni, nj] of [[i + 1, j], [i, j + 1]]) {
            if (ni === m || nj === n) {
                continue;
            }
            const [clo, chi] = range(ni, nj);
            for (const cand of [v * clo, v * chi]) {
                if (lo === null || cand < lo) {
                    lo = cand;
                }
                if (hi === null || cand > hi) {
                    hi = cand;
                }
            }
        }

        return dp[i][j] = [lo!, hi!];
    }
}
```

**[Count Ways to Choose Coprime Integers from Rows](https://leetcode.com/problems/count-ways-to-choose-coprime-integers-from-rows/)**

One number is picked from every row, and the whole selection is judged by a single quantity: the gcd of everything picked so far. That is the state — `(row, gcd so far)` — and it stays small because a gcd of numbers up to 150 is itself at most 150.

Cost: `m * 151` states with one transition per entry in the row, so `150 ^ 3 = 3.3 million` overall. There is also the cost of calling `gcd`, but with numbers so small, it's quite neglijable. `log2(150) = 7`. Also, because there are only 150 possible values in our grid and gcd only gets smaller, we can even precompute all possible gcd(x <= 150, y <= 150) values, but the code below is already very fast.

```TS
function countCoprime(mat: number[][]): number {
    const MOD = 1e9 + 7;
    const m = mat.length;
    const dp: number[][] = Array(m).fill(null).map(() => Array(151).fill(-1));

    return count(0, 0);

    // the number of ways to pick from rows idx.. so that the gcd of everything,
    // this row and the g accumulated above, is 1
    function count(idx: number, g: number): number {
        if (idx === m) {
            return g === 1 ? 1 : 0;
        }

        if (dp[idx][g] !== -1) {
            return dp[idx][g];
        }

        let res = 0;
        for (const value of mat[idx]) {
            res = (res + count(idx + 1, gcd(g, value))) % MOD;
        }

        return dp[idx][g] = res;
    }

    // gcd(0, x) is x, which is exactly what the first row needs
    function gcd(a: number, b: number): number {
        while (b !== 0) {
            const t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
```

**[Minimum Number of Work Sessions to Finish the Tasks](https://leetcode.com/problems/minimum-number-of-work-sessions-to-finish-the-tasks/)**

We need to order tasks such that they fit into as few fixed-time sessions as possible. My first thought was a state such as `(taken, sessionsCompleted, timeLeftInCurrentSession)` and simply dfs + memo in this graph tryting to reach states where `taken` is just ones and sessionsCompleted is as low as possible. We don't even have to return anything but, the issue is that it's quite slow. `2 ** 14 * 16 * 10 = 2.6M` states, each with a for loop inside, that's just above our 25 million cutoff point. We are in luck however, because this still barely passes taking around 2.5 seconds.

```TS
function minSessions(tasks: number[], sessionTime: number): number {
    const n = tasks.length;
    const ALL = (1 << n) - 1;
    // dp[taken][sessions][time]: fewest total sessions to finish from this exact position
    const dp: number[][][] = Array(1 << n).fill(null).map(() =>
        Array(n + 1).fill(null).map(() => Array(sessionTime + 1).fill(-1)),
    );

    let res = 1e11
    dfs(0, 1, sessionTime);
    return res;

    function dfs(taken: number, sessions: number, time: number) {
        if (taken === ALL) {
            res = Math.min(res, sessions)
            return;
        }

        if (dp[taken][sessions][time] !== -1) {
            return
        }

        dp[taken][sessions][time] = 1

        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }

            if (time >= tasks[i]) {
                // fits in the session we are in
                dfs(taken | (1 << i), sessions, time - tasks[i])
            } else {
                // open a fresh session and start it with this task
                dfs(taken | (1 << i), sessions + 1, sessionTime - tasks[i])
            }
        }
    }
}
```

There is however a better way to think about this which will make the solution at least 10 times faster. Instead of asking "Can this state be reached?" we can ask "What is the minimum number of sessions required from this state?" and we can get rid of `sessionsCompleted` from the state. Our new state is simply `(taken, time)` and we can either choose another task in this session, or start a new session. `2 ** 14 * 16` states with 14 transitions each — about 3.7 million transitions.

```TS
function minSessions(tasks: number[], sessionTime: number): number {
    const n = tasks.length;
    const ALL = (1 << n) - 1;
    const dp: number[][] = Array(1 << n).fill(null).map(() => Array(sessionTime + 1).fill(-1));

    return best(0, sessionTime);

    function best(taken: number, time: number): number {
        if (taken === ALL) {
            return 1; // the session we are sitting in still counts
        }

        if (dp[taken][time] !== -1) {
            return dp[taken][time];
        }

        let res = 1e11;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }
            if (time >= tasks[i]) {
                res = Math.min(res, best(taken | (1 << i), time - tasks[i])); // same session
            } else {
                res = Math.min(res, 1 + best(taken | (1 << i), sessionTime - tasks[i])); // new session
            }
        }

        return dp[taken][time] = res;
    }
}
```

**[The Most Similar Path in a Graph](https://leetcode.com/problems/the-most-similar-path-in-a-graph/)**

> You are given `n` cities numbered `0` to `n - 1`, a list of bidirectional `roads` forming a connected graph, and `names`, where `names[i]` is the three-letter name of city `i`. Names are not necessarily unique. Given `targetPath`, an array of three-letter strings, find a valid path through the graph of exactly the same length — every two consecutive cities must be joined by a road — whose edit distance to `targetPath` is the smallest possible. Because the two have equal length, that edit distance is simply the number of positions `i` where `names[path[i]] !== targetPath[i]`. Return the cities of such a path in order; if several tie, any of them is accepted. The path may visit the same city more than once.
>
> Constraints: `2 <= n <= 100`, `n - 1 <= roads.length <= n * (n - 1) / 2`, `1 <= targetPath.length <= 100`, every name is exactly three uppercase letters.

If we are at city c and we have already traveled on i roads, where is the best place to go next? It's the state that minimizes the distance between the remaining targetPath and the chose path. We try all transitions from city c. Our state is `(pathIndex, cityIndex)` and for each state we try all neighbors for a total maximum cost of `100 points on the path * 100 cities * 100 place to go = 1 million`.

But there is a slight complication: the answer must be the actual most similar path, not the minimum distance from it. So we must store where is the best place to go next from each state. There is no need to return that best state since the caller doesn't needed it - we only need it at the end when reconstructing the best path from each possible starting point.

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

**[Palindrome Partitioning III](https://leetcode.com/problems/palindrome-partitioning-iii/)**

The first state that comes to mind is `(i, pieces still to cut)`, but the problem is that we need to try all possible centers and all possible endings inside the recursive function. So our work inside the function will be `n ^ 2` and with `n ^ 2` states that gives us `n ^ 4` which we can't afford without forcing our luck.

The key: Before jumping to DP, we can precompute the cost of turning all possible substrings into a plindrome by using the expand from center technique.

Only then the DP itself: state = `(i, pieces still to cut)`, and inside the function we now only need to _spend_ `O(n)` to try all possible endings, and query our precomputed table for each.

Cost = `number of states × work per state` says `n * k * n`, and with `n <= 100` that is a million.

```TS
function palindromePartition(s: string, k: number): number {
    const n = s.length;

    // changes[l][r] = characters to change to make s[l..r] a palindrome
    const changes: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let l = 0; l < n; l++) {
        for (let r = l; r < n; r++) {
            let c = 0;
            for (let a = l, b = r; a < b; a++, b--) {
                if (s[a] !== s[b]) {
                    c++;
                }
            }
            changes[l][r] = c;
        }
    }

    const dp: number[][] = Array(n).fill(null).map(() => Array(k + 1).fill(-1));

    return best(0, k);

    // the fewest changes to cut s[i, n - 1] into exactly p palindromes
    function best(i: number, p: number): number {
        if (i >= n) {
            return p === 0 ? 0 : 1e11;
        }

        if (p === 0) {
            return 1e11; // characters left over with no piece to put them in
        }

        if (dp[i][p] !== -1) {
            return dp[i][p];
        }

        let res = 1e11;
        for (let j = i; j < n; j++) { // the last piece is s[j..i]
            res = Math.min(res, changes[i][j] + best(j + 1, p - 1));
        }

        return dp[i][p] = res;
    }
}
```

**[Maximum Score of Spliced Array](https://leetcode.com/problems/maximum-score-of-spliced-array/)**

This might not look like a DP problem, but let's think about what swapping a subarray from nums1 to nums2 or vice-versa means for the optimal solution to our problem.

For any optimal solution that is not simply nums1 or nums2, we will either start from nums1 or nums2, take some number of contiguous elements, then move to the other array and again take same number of contiguous elements (the swapped part) and then back to the original array, and take elements until its end. Alternatively, if the swapped array is a suffix or prefix, we only have to "move" once to the other array.

So our state is essentially which array we we looking at, at what index, and how many "moves" do we have left - we can do 0, 1 or 2 moves.

Cost: `n * 2 * 3` states with 2 transitions each.

```TS
function maximumsSplicedArray(nums1: number[], nums2: number[]): number {
    const n = nums1.length;
    const arrs = [nums1, nums2];
    const dp: number[] = Array(n * 2 * 3).fill(-1);

    return Math.max(score(0, 0, 2), score(0, 1, 2));

    // the most we can still collect from index i on, reading from arrs[arr],
    // with `moves` array changes left
    function score(i: number, arr: number, moves: number): number {
        if (i === n) {
            return 0;
        }

        const key = (i * 2 + arr) * 3 + moves;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = arrs[arr][i] + score(i + 1, arr, moves); // read this one and move on
        if (moves > 0) {
            res = Math.max(res, score(i, 1 - arr, moves - 1)); // change arrays, same index. "1 - arr" gives 0 when arr is 1, and vice-versa
        }

        return dp[key] = res;
    }
}
```

**[Shortest Common Supersequence](https://leetcode.com/problems/shortest-common-supersequence/)**

If we track the positions in s1 and s2 in each state, we can build the supersequence by either taking a character from s1, from s2, or from both (if equal). As in [The Most Similar Path in a Graph](https://leetcode.com/problems/the-most-similar-path-in-a-graph/), we need to return the actual string though, so we can keep track of which is the best state to transition to from each state. The first draft looks like this:

```TS
function shortestCommonSupersequence(s1: string, s2: string): string {
    const len: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(-1e11));
    const nxtI: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));
    const nxtJ: number[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));
    const char: string[][] = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1));

    rec(0, 0);

    let i = 0, j = 0
    const str: string[] = []
    while(i !== -1) {
        str.push(char[i][j]);
        [i, j] = [nxtI[i][j], nxtJ[i][j]];
    }
    return str.join('')

    function rec(i: number, j: number): number {
        if (len[i][j] !== -1e11) {
            return len[i][j];
        }

        if (i === s1.length && j === s2.length) {
            nxtI[i][j] = -1
            nxtJ[i][j] = -1
            char[i][j] = ''
            return len[i][j] = 0;
        }

        if (i === s1.length) {
            nxtI[i][j] = i
            nxtJ[i][j] = j + 1
            char[i][j] = s2[j]
            return len[i][j] = 1 + rec(i, j + 1)
        }

        if (j === s2.length) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j
            char[i][j] = s1[i]
            return len[i][j] = 1 + rec(i + 1, j)
        }

        if (s1[i] === s2[j]) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j + 1
            char[i][j] = s2[j]
            return len[i][j] = 1 + rec(i + 1, j + 1);
        }

        const v1 = rec(i + 1, j);
        const v2 = rec(i, j + 1);

        if(v1 < v2) {
            nxtI[i][j] = i + 1
            nxtJ[i][j] = j
            char[i][j] = s1[i]
            return len[i][j] = 1 + v1
        }

        nxtI[i][j] = i
        nxtJ[i][j] = j + 1
        char[i][j] = s2[j]
        return len[i][j] = 1 + v2
    }
}
```

This works well and very fast, but it's somewhat long and ugly and it turns out it can be simplified if we realize that we can also rebuild the string without the `nxtI`, `nxtJ` and `char` tables. Depending on each `(s1[i], s2[j])` pair, we can deduce what is the next state to transition to.

```TS
function shortestCommonSupersequence(s1: string, s2: string): string {
    const n = s1.length;
    const m = s2.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(-1));

    const res: string[] = [];
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
        if (i === n) {
            res.push(s2[j++]); // s1 is done, the rest of s2 has to follow
        } else if (j === m) {
            res.push(s1[i++]);
        } else if (s1[i] === s2[j]) {
            res.push(s1[i++]);
            j++; // one character pays for both
        } else if (len(i + 1, j) < len(i, j + 1)) {
            res.push(s1[i++]);
        } else {
            res.push(s2[j++]);
        }
    }
    return res.join('');

    // the length of the shortest string containing both s1[i..] and s2[j..]
    function len(i: number, j: number): number {
        if (i === n) {
            return m - j; // s1 is done, every character left in s2 still has to be written
        }

        if (j === m) {
            return n - i;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        if (s1[i] === s2[j]) {
            return dp[i][j] = 1 + len(i + 1, j + 1);
        }

        return dp[i][j] = 1 + Math.min(len(i + 1, j), len(i, j + 1));
    }
}

```

**[Stickers to Spell Word](https://leetcode.com/problems/stickers-to-spell-word/)**

Our state can simply  be which letter indicies were already covered on our target so that restricts the number of nodes to 2 ^ 15. We still have enough steps to spend inside the function body to try each possible word and see if it reduces our state. If it doesn't, there's no point in taking that sticker. We can precompute the counts of each letter in each sticker before the recursion. Then, inside the recursive function, to check how each sticker changes our state, we check each letter in our target from left to right. The overall cost is 2 ^ 15 \* 50 \* 10 = 25 million.

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

**[Minimum Increments for Target Multiples in an Array](https://leetcode.com/problems/minimum-increments-for-target-multiples-in-an-array/)**

At each index, we can choose to raise the current element enough so that it divides any subset of items from the target array that don't have any multiples in nums so far, so there is one transition per subset. Our state is the index and a bitmask that stores which elements in target are already satisfied. We can precompute the LCM of all `2 ** 4` subsets of the elements in the target array before our recursive call.

Cost: `n * 2 ** 4` states, each trying up to `2 ** 4` subsets, so `5e4 * 16 * 16` = 13 million.

```TS
function minimumIncrements(nums: number[], target: number[]): number {
    const n = nums.length;
    const t = target.length;
    const ALL = (1 << t) - 1;

    // the lcm of every subset of targets, folding one target in at a time
    const subsetLcm: number[] = Array(1 << t).fill(1);
    for (let sub = 1; sub <= ALL; sub++) {
        for (let i = 0; i < t; i++) {
            if (sub & (1 << i)) {
                subsetLcm[sub] = lcm(subsetLcm[sub], target[i]);
            }
        }
    }

    const dp: number[] = Array((ALL + 1) * n).fill(-1);

    return fewest(0, 0);

    // the fewest increments over nums[i..] so that every target outside `done`
    // ends up dividing one of them
    function fewest(i: number, done: number): number {
        if (done === ALL) {
            return 0;
        }

        if (i === n) {
            return 1e15;
        }

        const key = done * n + i;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = fewest(i + 1, done); // leave nums[i] alone

        for (let sub = 1; sub <= ALL; sub++) {
            if (sub & done) {
                continue; // this subset aims at an already satisfied target
            }

            const lcmVal = subsetLcm[sub];
            // the smallest multiple of lcmVal that is not below nums[i]: if
            // nums[i] is smaller we lift it all the way up to lcmVal itself,
            // otherwise to the first multiple at or above it (staying put when
            // nums[i] already divides evenly)
            const raiseTo = Math.ceil(nums[i] / lcmVal) * lcmVal;
            res = Math.min(res, raiseTo - nums[i] + fewest(i + 1, done ^ sub));
        }

        return dp[key] = res;
    }

    // the smallest number that both a and b divide; dividing before multiplying
    // keeps the intermediate value from growing past the result
    function lcm(a: number, b: number): number {
        return a / gcd(a, b) * b;
    }

    function gcd(a: number, b: number): number {
        while (b !== 0) {
            const t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
```

**[Minimum Total Distance Traveled](https://leetcode.com/problems/minimum-total-distance-traveled/)**

One ideea is to assign robots to factories one at a time from left to right, and that brings the robot index `ri` into our state. For the rest of the state, we somehow need to compress the state of the factories as much as possible. We could add to the state the factory index `fi` and how many repairs were already performed at that factory as `used`. `fi = 3` and `used = 2` would mean that the factory at index 3 has `factory[3] - 2` repairs left and all the next factories have no used repairs. Potential cost: `robots * factories * (robots + 1)` states with 2 transitions each — 100 \* 100 \* 101, about a million.

But that would mean that we can never express a state such as "3 factories, first and third are fully unused, and second is fully used", which can of course, happen. We need to explore the following question: Consider two robots `r1` and `r2`, is it ever a good ideea for `r1` to go to some factory `f1` and `r2` to go to another factory before f1 (say `f0`)? Suppose we have this situation. The cost is `(r1 - f1) + (r2 - f0)`. If we make `r1` go to `f0` and `r2` go to `f1`, the cost is `(r1 - f0) + (r2 - f1)`, which is exactly the same. This means that if an solution exists such that a higher index robot goes to a lower index factory, it can always be converted to a solution where this is not the case. (this might seem intuitive, but it's always a good ideea to write a small proof like this to make sure). So indeed the `(ri, fi, used)` state ideea is correct.

```TS
function minimumTotalDistance(robot: number[], factory: number[][]): number {
    robot.sort((a, b) => a - b);
    factory.sort((a, b) => a[0] - b[0]);

    const r = robot.length;
    const f = factory.length;
    const dp: number[] = Array(r * f * (r + 1)).fill(-1);

    return cost(0, 0, 0);

    // the cheapest way to place robot[ri..] using factory[fi..],
    // with `used` slots of factory fi already taken
    function cost(ri: number, fi: number, used: number): number {
        if (ri === r) {
            return 0;
        }

        if (fi === f) {
            return 1e13; // robots left with no factory to take them
        }

        const key = (ri * f + fi) * (r + 1) + used;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const skipFactory = cost(ri, fi + 1, 0);
        if (used === factory[fi][1]) {
            return dp[key] = skipFactory; // this factory is full
        }

        return dp[key] = Math.min(
            skipFactory,
            Math.abs(robot[ri] - factory[fi][0]) + cost(ri + 1, fi, used + 1),
        );
    }
}
```

**[Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/)**

Here the state is the familiar `(i, j)` pair, and the graph is tiny, but the difficulty comes from the edge cases. More details below the solution.

```TS
function isMatch(s: string, p: string): boolean {
    const n = s.length;
    const m = p.length;
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m).fill(-1));

    return !!match(0, 0);

    // does s[i..] match p[j..]
    function match(i: number, j: number): number {
        if (j === m) {
            return i === n ? 1 : 0;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        const matchHere = p[j] === '.' && i < n || p[j] === s[i];
        let res: number;

        if (p[j + 1] === '*') {
            res = match(i, j + 2) || (matchHere && match(i + 1, j)) ? 1 : 0;
        } else {
            res = matchHere ? match(i + 1, j + 1) : 0;
        }

        return dp[i][j] = res;
    }
}
```

Unlike similar problems, `i` can reach the end without `j` reaching the end, but we can still have a match for something like (`a`, `ab*`), so we need `n + 1` for our first DP table dimension.

We must check two stepts ahead in our pattern, not only `p[j]`, but also for a `*` after it. If there is no `*` at `p[j + 1]`, we try to match 1 character, but if there is, we can choose to either drop the repeating character and move j to j + 2, or to match one more occurance of the repeating character and move i to i + 1.

```TS
res = match(i, j + 2) || (matchHere && match(i + 1, j)) ? 1 : 0;
```

Here, also need to explicitly check `i < n`:

```TS
const matchHere = p[j] === '.' && i < n || p[j] === s[i];
```

This is because there can be are valid states with `i === n`, but if `p[j] === '.' && i === n`, we will reach an invalid state with the `match(i + 1, j + 1)` that follows.

Finally, we might be tempted to try to match 0 or more chracters with a for loop once we encounter a character followed by a `*`.

```TS
    if (p[j + 1] === '*') {
        for(let k = i; k <= s.length; k++) {
            if(match(k, j + 2)) {
                return true
            }
        }
    }
```

However, even if this makes intuitive sense, we would be making the same mistake we discussed earlier with [Coin Change](https://leetcode.com/problems/coin-change/): adding unnecessary edges to our graph. We only really need the transition to `match(i, j + 2)`.

**[Apply Operations to Make Two Strings Equal](https://leetcode.com/problems/apply-operations-to-make-two-strings-equal/)**

We need to choose which pairs of adjacent indices to toggle, as well as the additional pairs of indices to toggle at a cost of `x`.

For any adjacent pair `(index, index + 1)` we either toggle it or we don't — there is no point in toggling the same pair more than once, since every two toggles cancel each other out.

The order of the operations does not matter either. Say four ops in total involve bit 5: it gets toggled four times, so it ends up with the value it started with, no matter the order and no matter the type of each op. Extending that to every bit, we can assume that all the adjacent toggles happen first and all the non-adjacent ones after.

So once the set of adjacent toggles is fixed, the rest of the cost is forced: count the indices that are still mismatched, pair them up two by two, and toggle each pair at a cost of `x`.

The only thing left to decide is the optimal set of adjacent toggles, which makes this little more than take-or-no-take for each index. Moving from the pair `(0, 1)` to the pair `(1, 2)` we need to know whether index 1 was toggled, so a `prevToggled` flag goes into the state. We also need to know how many indices our toggles have left mismatched, so we can count the non-adjacent flips owed at the end — which gives `(index, prevToggled, mismatched)`.

Implementing it that way would work fine, but there is one more thing to notice: the cost of `(index, prevToggled, 10)` is the cost of `(index, prevToggled, 0)` plus `5 * x`, for every `index` and `prevToggled`. We already know what `mismatched` is going to cost us, so there is no need to carry it all the way to the end state — we can add the contribution of each pair as we walk the DP DAG. Instead of transitioning into `(index, prevToggled, 2)` we transition into `(index, prevToggled, 0)` and add `x` to the result, which leaves `mismatched` as a single parity bit.

Cost: `n * 2 * 2` states with 2 transitions each.

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

**[Maximum Points After Collecting Coins From All Nodes](https://leetcode.com/problems/maximum-points-after-collecting-coins-from-all-nodes/)**

At node `node`, it doens't matter **which** ancestors have been halved, the only relevant piece of information for `node` and its entire subtree, is **how many** ancestors have been halved. That's enough to compute the coins gained for each node in the `node` subtree. So our state is `(i, halved)`. And we can either halve or not halve the current node.

We also need to realize that `coins[i] <= 1e4`, so no amount of coins at any given node an survive more than 14 halvings. If more than 14 halvings occured above, we can say exactly 14 have occured, since the value for every node below is 0 anyay. So the total amount of states in our DP graph cannot exceed `n * 15` (0 to 14 halvings for each node).

For each state in the DP graph, there are at most 2 transitions **towards** that state, one from the parent node state with halving, and one from the parent node without halving. So the total number of edges in our DP graph cannot exceed `(n - 1) * 15`.

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

**[Find All Possible Stable Binary Arrays I](https://leetcode.com/problems/find-all-possible-stable-binary-arrays-i/)**

That third condition might seem intimidating, but the key is to keep in mind that each array item is either 0 or 1. So we can rephrase it as: "there can never be more than `limit` consecutive zeros, nor more than `limit` consecutive ones". That rephrasing alone suggests a state such as `(index, lastChar, lastCharStreak)`, and of course we must never allow transitions to states with `lastCharStreak > limit`.

`index` on its own is not enough though, because what we are still allowed to place depends on how many zeros and ones are left. And once we track those two, they give us the index for free (whatever is not left has been placed), so it drops out of the state entirely: `(zerosLeft, onesLeft, lastChar, lastCharStreak)`. The recursive question is "how many stable arrangements of the remaining zeros and ones are there, given that they continue a run of `lastCharStreak` copies of `lastChar`?".

A streak of 0 is the "nothing placed yet" state: no run is in progress, so the first item is free to be either value.

Cost: `200 * 200 * 2 * 200` = 16 million states \* 2 transitions each = 32 million.

```TS
function numberOfStableArrays(zero: number, one: number, limit: number): number {
    const MOD = 1e9 + 7;
    // dimensions: [zeros left][ones left][last char][streak of that char]
    const dp: number[] = Array((zero + 1) * (one + 1) * 2 * (limit + 1)).fill(-1);

    return count(zero, one, 0, 0);

    // arrangements of the remaining zeros and ones which keep every run at most limit long
    function count(zeros: number, ones: number, last: number, streak: number): number {
        if (!zeros && !ones) {
            return 1;
        }

        const key = ((zeros * (one + 1) + ones) * 2 + last) * (limit + 1) + streak;
        if (dp[key] !== -1) {
            return dp[key];
        }

        let res = 0;
        // placing the same char extends the run, placing the other one starts a fresh run
        if (zeros && !(last === 0 && streak === limit)) {
            res += count(zeros - 1, ones, 0, last === 0 ? streak + 1 : 1);
        }
        if (ones && !(last === 1 && streak === limit)) {
            res += count(zeros, ones - 1, 1, last === 1 ? streak + 1 : 1);
        }

        return dp[key] = res % MOD;
    }
}
```

**[Maximum AND Sum of Array](https://leetcode.com/problems/maximum-and-sum-of-array/)**

We have 18 numbers to put into at most 9 slots. We can choose to put 0, 1 or 2 items into each slot but by the end we need to put all of them. This suggests a state such as `(slot, taken(bitmask), filled)`, where filled is 0, 1, or 2.

But the number of states is `9 slots * 2 ** 18 * 3 = 7 million`, which is already too high because we also need a for loop inside the function to try each possible number (127 million transitions in total). And indeed, this exact code is not fast enough on LeetCode:

```TS
function maximumANDSum(nums: number[], numSlots: number): number {
    const n = nums.length;
    const full = (1 << n) - 1;
    // dimensions: [slot][taken][filled]
    const dp: number[] = Array((numSlots + 1) * (1 << n) * 3).fill(-1);

    return best(1, 0, 0);

    // the most we can still gain from slot onwards, with `taken` numbers gone
    // and `filled` of them already sitting in this slot
    function best(slot: number, taken: number, filled: number): number {
        if (taken === full) {
            return 0;
        }
        if (slot > numSlots) {
            return -Infinity; // numbers left over with no slot to hold them
        }

        const key = (slot * (1 << n) + taken) * 3 + filled;
        if (dp[key] !== -1) {
            return dp[key];
        }

        // close this slot, however many numbers it ended up with
        let res = best(slot + 1, taken, 0);
        if (filled < 2) {
            for (let i = 0; i < n; i++) {
                if (taken & (1 << i)) {
                    continue;
                }
                res = Math.max(res, (nums[i] & slot) + best(slot, taken | (1 << i), filled + 1));
            }
        }

        return dp[key] = res;
    }
}

```

One way to optimize this: try to get rid of `filled`. We can overcome the problem that `n` can be lower than `numSlots * 2` by creating some dummy numbers that don't affect the final result so that `n === numSlots * 2` always. This way, each slot will receive exactly two numbers so we don't have to keep track of how many numbers it received (`filled`). And which number gives 0 when &-ed with anything? 0 itself - and since the AND sum is just a sum, a 0 contributes exactly nothing."

```TS
    while (a.length < numSlots * 2) {
        a.push(0); // an empty half-slot, contributing nothing
    }
```

We are now effectively searching for an optimal permutation of numbers (some of which are dummy `0`s) where the first slot takes the first 2 numbers, the 2nd slot takes the 3rd and 4th number and so on, so we don't need `filled` anymore. Our state is now `(index, taken(bitmask))`. Notice that `index` is the index of the next number to take (not the slot), and we can compute slot based on index:

```TS
const slot = Math.floor(index / 2) + 1;
```

And by replacing `slot` with `index`, we also gain something else: `index` doesn't have to be part of the state anymore. `index` is just the number of set bits in `taken`, so `index` fully depends on `taken`. We can now identify a state by looking at `taken` alone, which gives us `2 ** 18 states * 18 transitions = 4.7 million` total cost.

```TS
function maximumANDSum(nums: number[], numSlots: number): number {
    const a = [...nums];
    while (a.length < numSlots * 2) {
        a.push(0); // an empty half-slot, contributing nothing
    }

    const n = a.length;
    const dp: number[] = Array(2 ** n).fill(-1);

    return best(0, 0);

    // the most we can still gain filling positions index.., with `taken` numbers gone
    // (index is popcount(taken), so it is not part of the state)
    function best(index: number, taken: number): number {
        if (index === n) {
            return 0;
        }

        if (dp[taken] !== -1) {
            return dp[taken];
        }

        const slot = Math.floor(index / 2) + 1;
        let res = 0;
        for (let i = 0; i < n; i++) {
            if (taken & (1 << i)) {
                continue;
            }
            res = Math.max(res, (a[i] & slot) + best(index + 1, taken | (1 << i)));
        }

        return dp[taken] = res;
    }
}
```

**[Minimum Time to Build Blocks](https://leetcode.com/problems/minimum-time-to-build-blocks/)**

> You are given an integer array `blocks`, where `blocks[i]` is the time needed to build the `i`-th block, and an integer `split`. Every block must be built by exactly one worker, and a worker builds at most one block — after that, it goes home. Instead of building, a worker can split into two workers, which takes `split` time. Workers act in parallel, so two workers splitting at the same moment still cost `split` overall, and two workers building at the same time finish after the slower of the two blocks. You start with a single worker. Return the minimum time until every block is built.
>
> Constraints: `1 <= blocks.length <= 1000`, `1 <= blocks[i] <= 10⁵`, `1 <= split <= 100`.

The first observation is that there is no reason so ever start a faster block before a slower block, so we need to sort `blocks` descending, as workers will start working on them from left to right.

Then, at any point in time, if there are `w` available workers, we can either choose to assign one or more of them to the blocks that follow, or split them and wait `split`. Of course, to avoid an unencessary for loop to **assign one or more of them**, we can simply assign the first one and transition to the same point in time, so instead of one or more transistions, there is just one - so we can avoid unnencessary edges, as explained in [Coin Change](https://leetcode.com/problems/coin-change/).

Cost: `n * n` states with 2 transitions each.

```TS
function minBuildTime(blocks: number[], split: number): number {
    const n = blocks.length;
    blocks.sort((x, y) => y - x);
    const dp: number[][] = Array(n).fill(null).map(() => Array(n + 1).fill(-1));

    return best(0, 1);

    // the time needed to finish blocks[i..] with w workers available
    function best(i: number, w: number): number {
        if (i === n) {
            return 0;
        }

        if (w >= n - i) {
            return blocks[i]; // a worker each, so the slowest block decides
        }

        if (w === 0) {
            return 1e15;
        }

        if (dp[i][w] !== -1) {
            return dp[i][w];
        }

        const assign = Math.max(blocks[i], best(i + 1, w - 1));
        const wait = split + best(i, w * 2);

        return dp[i][w] = Math.min(assign, wait);
    }
}
```

**[Number of Great Partitions](https://leetcode.com/problems/number-of-great-partitions/)**

By now your intuition should point to a state such as `(index, sum1, sum2)`. `sum1` and `sum2` don't need to go higher than `k` since we don't care how high they go exactly as long as they are higher than `k`. The recursive question becomes "How many partitions are there from `index` onwards such that `sum1` reaches `k` or more and `sum2` reaches `k` or more?". But that would still make our number of states too high at `n * (k + 1) * (k + 1)`.

There is one important observation we need to make to reduce the number of states: we can use just `sum1` and `index` to identify a state because `sum2` is always the same as long as `sum1` and `index` don't change: `total sum up until index` - `sum1`. So the actual number of states is `n * maxPossibleSum`. And we can even pass `sum2` as an argument to the recursive function, but the state key does not depend on it. So our state is simply `(index, sum1)`, but we still have the problem that `maxPossibleSum` can get much higher than `k`.

Next point to realize (bear with me) is if both `sum1` and `sum2` are >= `k`, we have reached a point in our DAG where all following `nums` can go either to `sum1` or `sum2`. So if both `sum1` and `sum2` are >= `k`, for a fixed `index`, no matter what the current state `(index, sum1)` returns, all `(index, sum1)` states will return the same value, because the `>=k` condition has already been satisfied for both sums. So for some fixed `index`, if `sum1` and `sum2` are >= `k`, all `(index, sum1)` states are equivalent. So we can identify our state as `(index, Math.min(sum1, sum2, k))`. Remember the recursive question: "How many partitions are there from `index` onwards such that `sum1` reaches `k` or more and `sum2` reaches `k` or more?".

In one sentance: The only thing that makes a state unique is the lower of the two sums, and only if it's lower than k.

If this is starting to get frustratingly hard for you, I have good news: this is leetcode ~2400 rating. Already less than 1% of contestants can tackle this problem, even though we don't need to juggle a lot of concepts (just top-down DP is enough) to solve it.

```TS
function countPartitions(nums: number[], k: number): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    const dp: number[][] = Array(n).fill(null).map(() => Array(k + 1).fill(-1));

    return count(0, 0, 0);

    function count(i: number, s1: number, s2: number): number {
        if (i === n) {
            return s1 >= k && s2 >= k ? 1 : 0;
        }

        const key = Math.min(s1, s2, k);
        if (dp[i][key] !== -1) {
            return dp[i][key];
        }

        return dp[i][key] = (
            count(i + 1, s1 + nums[i], s2) +
            count(i + 1, s1, s2 + nums[i])
        ) % MOD;
    }
}
```

**[Painting the Walls](https://leetcode.com/problems/painting-the-walls/)**

We generally want to give the paid painter walls that take a long time to paint and are as cheap as possible. Simply giving the paid painter however many walls which are cheapest, or take the most amount of time to paint or have the highest time/cost ratio might sound intuitive, but it's not a valid strategy due to various edge cases.

Let's start from the classic take-no-take DP idea, consider each wall from left to right, with `index` part of the state. We need to assign walls such that cost is minimized and the total time spent by the paid painter is at least the total time spent by the free painter. So in the DP state, we also need to have how much `extra` time will the paid painter spend compared with the free painter so far (`extra` could be negative). At the end of the array, that extra time must be non-negative.

The only problem with this approach is that `extra` can get as high as `500 * 500` and that would mean `500 ** 3` total states which is too much. Here we need to notice that if in some state `extra > n`, it doesn't matter how much higher `extra` is compared to `n`, because the optimal choice at this point is always for the free painter to take everything left and there can't be more than `n` of anything left. In other words, for a fixed index, with `extra >= n` all `(index, extra)` states are equivalent (it's actually `extra >= n - 1` because at least 1 wall must go to the paid painter so `extra === n - 1` is always enough for the free painter to take everything else). Also `extra` will never go below `-n` because the free painter can't take more than every wall. So `extra` actually sits comfortably between `-n` and `n`. This means only `n * 2n` total states.

Now to compute a unique key for each state, we just need to add `n` to `extra` to make it sit between `0` and `2 * n`. And because the second dimension has `2 * n` possible slots, we multiply `index` by `2 * n`:

```TS
const key = i * n * 2 + extra + n;
```

Entire solution:

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

[← Back to contents](00-contents.md)
