# Find the Number of Subsequences With Equal GCD

This problem fits into the **knapsack** class of top-down DP problems, except that every element has three destinations rather than two, and what is carried down is an accumulator rather than a capacity.

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

Every element goes into the first subsequence, the second, or neither — three transitions instead of
two. That part is a direct transcription of the statement.

The state is where the thinking is. What does the final verdict depend on? Only the gcd of each side.
Not which elements went where, not how many there are — just the two gcds. And a gcd of numbers up to
200 is itself at most 200, so both fields are small.

- **State:** `(i, g1, g2)` — the first undecided element, and the running gcd of each side.
- **Transitions:** three — skip, add to the first side, add to the second.
- **Cost:** `n * 201 * 201` states with 3 transitions each — `200 * 201 * 201`, about 8 million
  states.

`0` means "this side is still empty", which works out neatly because `gcd(0, x) === x` — the first
element added to a side sets that side's gcd with no special case at all. The base case then only has
to check `g1 !== 0 && g1 === g2`, which rejects the empty-empty walk for free.

```TS
function subsequencePairCount(nums: number[]): number {
    const MOD = 1e9 + 7;
    const n = nums.length;
    // 8 million entries, so a flat array rather than 200 * 201 nested rows
    const dp: number[] = Array(n * 201 * 201).fill(-1);

    return count(0, 0, 0);

    // pairs of disjoint non-empty subsequences of nums[i..] that even out the two
    // running gcds, where 0 means "nothing in this one yet"
    function count(i: number, g1: number, g2: number): number {
        if (i === n) {
            return g1 !== 0 && g1 === g2 ? 1 : 0;
        }

        const key = (i * 201 + g1) * 201 + g2;
        if (dp[key] !== -1) {
            return dp[key];
        }

        const skip = count(i + 1, g1, g2);
        const first = count(i + 1, gcd(g1, nums[i]), g2);
        const second = count(i + 1, g1, gcd(g2, nums[i]));

        return dp[key] = (skip + first + second) % MOD;
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

At 8 million entries the memo layout is no longer a detail: a flat `number[]` indexed with
`(i * 201 + g1) * 201 + g2` is one allocation and one memory load per access, where the nested
`number[][][]` version would be 40000 allocations and three dependent loads.
