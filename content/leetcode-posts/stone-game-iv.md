# Stone Game IV

This problem fits into the plainest top-down DP shape there is — a single number identifies a state — with the two-player twist that a node returns a win/lose bit rather than a score.

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

There is no state to invent. How the pile got to 17 stones is irrelevant; the only thing that matters
is that there are 17 stones and it is your move. So the state is the number of stones left, and the
answer is one bit: can the player to move force a win?

A position is winning if *any* legal move hands the opponent a losing position. The base case is the
one to get right: 0 stones means the player to move has nothing to take, so they have lost.

- **State:** `stones`, the number left.
- **Transitions:** one per square not exceeding `stones`, so at most `sqrt(stones)`.
- **Cost:** it looks like `n * sqrt(n)` — about 30 million O(1) steps — but the transition count
  shrinks along with the pile. The real total is
  `sqrt(1) + sqrt(2) + ... + sqrt(100000)`, about 21 million. And because the work per step is a
  multiplication and a compare, this runs in 81 ms.

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

Worth noticing: the early `return dp[stones] = 1` is not just a micro-optimisation, it is what keeps
the average transition count well below `sqrt(n)` — as soon as one losing successor is found there is
no reason to look at the rest.
