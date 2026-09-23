# Maximum AND Sum of Array

This problem fits into the **bitmask** class of top-down DP problems, and it is the chapter's best worked example of shrinking a state until the solution fits in the time limit.

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

We have up to 18 numbers to put into at most 9 slots, at most 2 per slot, and by the end every number
must be placed. The obvious state is `(slot, taken, filled)` — which slot we are filling, which
numbers are gone, and how many are already in this slot.

That is `9 * 2 ** 18 * 3 = 7` million states, and each needs a loop over all 18 numbers: 127 million
transitions. Too slow, and indeed this exact code does not pass:

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

The way out is to get rid of `filled`. The only reason it exists is that `n` may be smaller than
`numSlots * 2`, so slots can end up partly empty. Pad the input with dummy numbers until
`n === numSlots * 2` and every slot receives exactly two numbers — no counting needed. Which number is
harmless? `0`: it ANDs to 0 with anything, and since the AND sum is just a sum, it contributes nothing.

```TS
    while (a.length < numSlots * 2) {
        a.push(0); // an empty half-slot, contributing nothing
    }
```

Now we are searching for an optimal permutation of the padded array where the first slot takes
positions 0 and 1, the second takes 2 and 3, and so on. The slot is a function of the position:

```TS
const slot = Math.floor(index / 2) + 1;
```

And replacing `slot` with `index` buys one more thing: `index` doesn't have to be in the state either,
because it is always the popcount of `taken`. A state is identified by `taken` alone.

- **State:** `taken`, the bitmask of placed numbers. `index` and `slot` are both functions of it.
- **Transitions:** one per unplaced number, so up to 18.
- **Cost:** `2 ** 18` states with 18 transitions each — about 4.7 million, down from 127 million.

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

Padding the input so that a special case disappears is a trick worth remembering. It is the same idea
as the stub colour 26 in Minimum Time to Make Rope Colorful — make the awkward case impossible rather
than handling it.
