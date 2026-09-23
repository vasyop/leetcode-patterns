# Palindrome Partitioning III

This problem fits into the **cut the sequence into k pieces** shape of top-down DP — a knapsack-flavoured walk where each transition chooses where the next piece ends — and its real lesson is about *work per state*.

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

The first state that comes to mind is the right one: `(i, pieces still to cut)`. The problem is the
other half of the cost formula.

Inside the recursive function we have to try every possible ending for the next piece — that is an
`O(n)` loop — and for each ending count the characters that would have to change to make that
substring a palindrome, which is another `O(n)` loop. So the work per state is `n ** 2`, and with
`n ** 2` states that is `n ** 4`. Not affordable.

The fix is to move that inner count out of the DP entirely. **Before** the recursion, precompute the
cost of turning every substring into a palindrome, using the expand-from-centre technique: for each of
the `2n` centres, walk outwards one pair at a time, incrementing a counter whenever the two characters
disagree. That fills the whole `changes[l][r]` table in `O(n ** 2)`.

Only then the DP. The work per state drops to a single `O(n)` loop with a table lookup inside.

- **State:** `(i, p)` — the first uncut character, and how many pieces are still to be cut.
- **Transitions:** one per possible end of the next piece, so up to `n`.
- **Cost:** `number of states x work per state` = `n * k * n`, and with `n <= 100` that is a million.

Expanding from centre is a small, reusable algorithm worth keeping in mind whenever you read the word
"palindrome".

```TS
function palindromePartition(s: string, k: number): number {
    const n = s.length;

    // changes[l][r] = characters to change to make s[l..r] a palindrome,
    // filled by expanding outwards from every center one pair at a time
    const changes: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    for (let center = 0; center < n; center++) {
        // odd length: l and r start on the same character
        for (let l = center, r = center, c = 0; l >= 0 && r < n; l--, r++) {
            if (s[l] !== s[r]) {
                c++;
            }
            changes[l][r] = c;
        }
        // even length: l and r start on two neighbouring characters
        for (let l = center, r = center + 1, c = 0; l >= 0 && r < n; l--, r++) {
            if (s[l] !== s[r]) {
                c++;
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
        for (let j = i; j < n; j++) { // the next piece is s[i..j]
            res = Math.min(res, changes[i][j] + best(j + 1, p - 1));
        }

        return dp[i][p] = res;
    }
}
```

Unlike Coin Change, the `O(n)` fan-out here is *not* redundant: the pieces are genuinely different
choices, not repetitions of one short step. When you see a wide transition list, the question to ask
is whether each edge lands somewhere a chain of short edges would have reached anyway.
