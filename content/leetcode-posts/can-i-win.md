# Can I Win

This problem fits into the **bitmask** class of top-down DP problems — the set of numbers already used *is* the state, and it fits in a single integer.

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

Two things here are worth more than the code.

**Whose turn it is stays out of the state.** Because both players play optimally, the question "can
the player to move force a win from here?" has the same answer whoever that player happens to be. So
a node is labelled by the position only, and the answer is a single bit.

**The remaining target stays out of the state too.** `rem` looks like independent information, but it
is not: it is `desiredTotal` minus the sum of the numbers already taken, and which numbers were taken
is exactly what the bitmask records — regardless of who took them. So it rides along as a parameter,
never as part of the key. Keeping parameters that are functions of the real state out of the memo is
what stops the state count from being multiplied for nothing.

With `maxChoosableInteger <= 20`, the mask has at most `2 ** 20` values. A player wins from a state
if there is *any* move leading to a state that is unwinnable for the opponent.

- **State:** `taken`, a bitmask of the integers already chosen.
- **Transitions:** one per integer still available, so at most 20.
- **Cost:** `2 ** 20` states with 20 transitions each in the worst case — at most 20 million
  transitions.

One edge case: the statement is vague about what happens when the sum of *all* the integers is below
`desiredTotal`. The test cases say the first player cannot force a win there, so we check it up front
and get rid of the case entirely rather than trying to encode "we ran out of numbers" into the
recursion.

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
