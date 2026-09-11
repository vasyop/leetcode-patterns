[← Back to contents](README.md)

# Backtracking

## Prerequisites

- DFS chapter

## What Backtracking is all about

In the previous chapter, we saw how DFS can be used to explore decision trees. Sometimes however, the decision tree has to be build while exploring it. Consider the the problem of finding all the permutations of the list of numbers from 1 to 3. There are 6 permutations in total: 123, 132, 213, 231, 312, 321. Notice that the number of possible choices shrinks as we descend down into the tree, because we are not allowed to pick the same number twice. If we choose 1 as first element, we can choose 2 or 3 as second. If we choose 2 as the second, we can only choose 3 as the third.

```
           empty
        /    |    \
   1         2         3         first choice
  /  \      /  \      /  \
 2    3    1    3    1    2      second choice
 |    |    |    |    |    |
 3    2    3    1    2    1      third choice
```

Let's try to implement this in a straightforward, not particularly fast way.

```TS
function permutations(n: number): number[][] {
    const result: number[][] = [];
    const stack: number[] = [];

    bkt();
    return result;

    function bkt() {
        if (stack.length === n) {
            result.push(stack.slice());
            return;
        }

        for (let choice = 1; choice <= n; choice++) {
            if (stack.includes(choice)) {
                continue;
            }
            stack.push(choice);
            bkt();
            stack.pop();
        }
    }
}
```

We try all possible numbers at each depth. As we descend, push on the stack the chosen item, but when we choose an item, we must check the stack - it should not contain that item. let's see how many nodes our tree has. The last level has n! nodes, the second to last also has n!, then n! / 2!, then n! / 3! and so on until the root which is n! / n!. If you solve this sum with math, it's less than 3 \* n!.

For each node, we do a for loop with n iterations, and each iteration has a `stack.includes(choice)` inside. So for each node, we do an additional O(n ^ 2) steps. But there is a smart way to optimize this: The swap trick. Array starts [1..n]. When `bkt(i)` runs, arr[0..i-1] is permutation prefix already chosen, arr[i..n-1] holds exactly the not-yet-used numbers. Membership check now free — anything in suffix is unused by construction.

At depth i, loop over j = i..n-1: each arr[j] is a candidate for slot i. Swap brings it into slot i; suffix arr[i+1..] becomes new unused pool for recursion. After recursion returns, swap back — array is now bit-for-bit identical to before, so next j iteration sees clean state. Same "write before descend, undo after come up" shape as before, except undo is swap instead of pop. The key insight is that the stack only grows in one direction. So calling `bkt(...)` recursively will never disturb the state of parent `bkt(...)` stack frames. `arr` will be in the exact same shape before and after the `bkt(...)` call.

Swap version cost: O(1) per child — two swaps, O(n!) total cost; `result.push(arr.slice())` makes it O(n \* n!). But there is a tradeoff: output order is no longer lexicographic — swaps scramble suffix order, e.g. for n=3 you get 123, 132, 213, 231, 321, 312 (last two flipped). Naive loop 1..n gives sorted order.

```TS
function permutations(n: number): number[][] {
    const result: number[][] = [];
    const arr = Array(n).fill(null).map((_, i) => i + 1);

    bkt(0);
    return result;

    function bkt(i: number) {
        if (i === n) {
            result.push(arr.slice());
            return;
        }

        for (let j = i; j < n; j++) {
            [arr[i], arr[j]] = [arr[j], arr[i]]; // choose arr[j] for slot i
            bkt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]]; // undo, restore order
        }
    }
}
```

Here is the whole decision tree for n = 3. Each node shows `arr` as seen by that `bkt(i)` call, with a bar separating the chosen prefix `arr[0..i-1]` from the unused pool `arr[i..n-1]`. The leftmost child of every node is j = i, the self-swap that leaves `arr` unchanged.

```
                          |123                         i = 0, nothing chosen yet
                   /       |        \
          1|23            2|13            3|21         i = 1, slot 0 filled
         /    \          /    \          /    \
      12|3    13|2    21|3    23|1    32|1    31|2     i = 2, slots 0 and 1 filled
       |       |       |       |       |       |
      123|    132|    213|    231|    321|    312|     i = 3, push a copy of arr
```

Reading the leaves left to right gives exactly the order from above: 123, 132, 213, 231, 321, 312.

One thing to keep in mind: To go from 2|13 to 3|21, we first go undo to 1|23. This makes sure that after each for loop iteration `arr` is in the exact same state as initialilly received on that stack frame.

I've written this swap trick by hand a lot of times, but it still feels smart and powerful. It's also very common - I often want to quickly write a brute force solution so you can validate your optimized solution. If the brute force solution involves trying all possible ways of arranging some items such that some condition is satisfied, I will use this to generate all permutations and validate the permutation before `result.push(arr.slice());`. I hope you've wrapped your head around this (let me know if you don't), because reccursion with moving parts like this one has been confusing for me for a long time.

Let's now explore another flavor of backtracking: let's try generating all the subsets of `[1, 2, 3]`. Order no longer matters — picking 1 and then 3 produces the same subset as picking 3 and then 1. If we reuse the permutations tree, we generate both, and in general every subset of size k appears k! times. So the key question is: how do we build the decision tree so that each subset appears exactly once?

The answer is to change the question we ask at each node. Instead of "which item comes next?", we walk over the items in a fixed order, and for each item we ask something much simpler: do we take it, or not? Every node has exactly two children — take and skip — and after n binary answers, we have fully described one subset. There are no duplicates by construction: two different sequences of answers disagree about at least one item, so they produce two different subsets.

```
                             []
                        /            \
                   [1]                 []       take 1?
               /        \           /      \
           [1,2]        [1]       [2]        []   take 2?
            / \         / \     /    \       /  \
      [1,2,3] [1,2]  [1,3] [1] [2,3] [2]   [3]   []   take 3?
```

The answers live at the leaves: 2 \* 2 \* 2 = 8 leaves, 8 subsets, each exactly once. This tree should look familiar — it has exactly the shape of the target sum tree from the DFS chapter: one decision per index, two branches per decision. The new part is that a running sum is no longer enough; we need to build the actual subsets. For that, we maintain one shared `path` array:

```TS
function subsets(nums: number[]): number[][] {
    const result: number[][] = [];
    const path: number[] = [];

    bkt(0);
    return result;

    function bkt(i: number) {
        if (i === nums.length) {
            result.push(path.slice());
            return;
        }

        // take nums[i]
        path.push(nums[i]);
        bkt(i + 1);
        path.pop();

        // skip nums[i]
        bkt(i + 1);
    }
}
```

The variable `i` is the index of the item we are currently deciding about. The take branch has the same "write before descend, undo after come up" shape as the permutations code: push the item, explore every subset that contains it, then pop it so the skip branch continues from a clean path. This is the whole backtracking discipline in one sentence: one shared array, mutated on the way down, un-mutated on the way back up.

Where did the saving condition go? In the permutations code, we saved when the stack was full. Here we save when `i === nums.length` — when there are no more decisions to make, regardless of how much the path holds. A leaf can carry a path of any size from 0 to n, including the empty subset, and for this problem all of them are answers.

Let's count the cost. The tree is a full binary tree with 2 ^ n leaves, so about 2 \* 2 ^ n nodes in total. Each step is O(1) — a push and a pop — and each saved leaf copies the path, which costs up to O(n). Generating all subsets is therefore O(n \* 2 ^ n). Our magic number from the constraints chapter tells us when to expect this: for n = 20, that is roughly 20 million operations, right at the edge of the 25 million budget. When a problem hands you n <= 16 or n <= 20 and asks for all subsets, all combinations, or the best-scoring selection of items, this tree is probably the intended solution. When n is 1000, it is definitely not.

This "one decision per item, a few branches per decision" tree should come to mind whenever items are independently in or out of the answer and n is small: subsets, combinations, splitting items between two or k groups (the decision becomes "which group?" instead of "in or out?").

The permutations-swap and subsets trees will carry you through most of the problems ahead — the majority of backtracking questions are one of these two with a filter or a different saving condition bolted on. But it's also useful to keep the bare skeleton in mind, because it's more general than either pattern: backtracking is just DFS over a decision tree, with some extra setup as we descend into a child and the matching teardown as we come back up. Whatever the shared state is — a path array, a used set, a swapped prefix, a running sum — mutate it before the recursive call and un-mutate it right after, so every loop iteration and every parent frame sees the state exactly as it received it.

```
bkt(node):
    if node is an answer:
        save or count it
        return
    for each child of node:
        apply the change        // push, mark used, swap, add
        bkt(child)
        undo the change         // pop, unmark, swap back, subtract
```

## Backtracking practice problems

- https://leetcode.com/problems/the-k-th-lexicographical-string-of-all-happy-strings-of-length-n/
- https://leetcode.com/problems/numbers-with-same-consecutive-differences/
- https://leetcode.com/problems/combinations/
- https://leetcode.com/problems/subsets-ii/
- https://leetcode.com/problems/letter-tile-possibilities/
- https://leetcode.com/problems/beautiful-arrangement/
- https://leetcode.com/problems/fair-distribution-of-cookies/
- https://leetcode.com/problems/construct-the-lexicographically-largest-valid-sequence/

## Backtracking practice problems solved

**[The k-th Lexicographical String of All Happy Strings of Length n](https://leetcode.com/problems/the-k-th-lexicographical-string-of-all-happy-strings-of-length-n/)**

A happy string uses only `a`, `b`, `c` and never repeats a letter twice in a row. If we always try the letters in alphabetical order, DFS visits the strings in exactly lexicographical order, so we just count completed strings and remember the `k`-th one.

Cost: 3 choices for the first letter and 2 for every letter after, so the full tree has 3 \* 2 ^ (n - 1) leaves — 1536 at the max n = 10 — and about twice that many nodes, with O(1) work in each. The single O(n) join happens once, at the answer. Walking the whole tree, even past the answer, is nowhere near any budget.

```TS
function getHappyString(n: number, k: number): string {
    const letters = ['a', 'b', 'c'];
    let remaining = k;
    let answer = '';
    const path: string[] = [];

    bkt();
    return answer;

    function bkt() {
        if (path.length === n) {
            remaining--;
            if (remaining === 0) {
                answer = path.join('');
            }
            return;
        }
        for (const c of letters) {
            if (path.length > 0 && path[path.length - 1] === c) {
                continue;
            }
            path.push(c);
            bkt();
            path.pop();
        }
    }
}
```

An optional optimization: we could stop the moment the `k`-th string is found instead of finishing the walk. Make `bkt` return `true` when it finds the answer and have every caller unwind immediately. It changes nothing here — the tree is tiny — but this "found it, get out" shape is worth knowing for searches where the tree is big and the answer may sit early in it:

```TS
    // returns true once the k-th string is found, to unwind immediately
    function bkt(): boolean {
        if (path.length === n) {
            remaining--;
            if (remaining === 0) {
                answer = path.join('');
                return true;
            }
            return false;
        }
        for (const c of letters) {
            if (path.length > 0 && path[path.length - 1] === c) {
                continue;
            }
            path.push(c);
            if (bkt()) {
                return true;
            }
            path.pop();
        }
        return false;
    }
```

**[Numbers With Same Consecutive Differences](https://leetcode.com/problems/numbers-with-same-consecutive-differences/)**

Build the number one digit at a time. The first digit is `1..9` (no leading zeros, and the constraints give `n >= 2`), and from any digit the only valid next digits are `last + k` and `last - k`, as long as they land in `0..9`. Wrapping the two candidates in a `Set` collapses them into one when `k === 0`, which stops us from emitting each number twice. Of course, we could also avoid creating so many `Set`s with a simple if statement.

Cost: 9 roots, at most two children per node, and `n - 1` levels below each root, so under 9 \* 2 ^ n nodes with O(1) work in each — the max n = 9 gives a few thousand steps.

```TS
function numsSameConsecDiff(n: number, k: number): number[] {
    const result: number[] = [];

    for (let first = 1; first <= 9; first++) {
        bkt(first, 1);
    }
    return result;

    function bkt(num: number, len: number) {
        if (len === n) {
            result.push(num);
            return;
        }
        const last = num % 10;
        for (const next of new Set([last + k, last - k])) {
            if (next >= 0 && next <= 9) {
                bkt(num * 10 + next, len + 1);
            }
        }
    }
}
```

**[Combinations](https://leetcode.com/problems/combinations/)**

Combinations are subsets of a fixed size `k` drawn from `1..n`, so this is the subsets tree with a size cap. We walk the numbers `1..n` in order and, for each, make the same binary decision as in the theory above — take it or skip it — which is exactly what stops any combination from being generated twice: two different take/skip answer sequences disagree about at least one number. We can save and stop the instant the path reaches size `k`, and we abandon a branch once too few numbers remain in `i..n` to ever reach size `k` (the `n - i + 1 < k - path.length` bound, which also covers running off the end at `i > n`). These optimizations are not strictly necessary. Even without them, take-no-take with n = 20 results in a tree with `2 ** 21 - 1` nodes (~2 million) plus O(k) to copy each answer.

```TS
function combine(n: number, k: number): number[][] {
    const result: number[][] = [];
    const path: number[] = [];

    bkt(1);
    return result;

    function bkt(i: number) {
        if (path.length === k) {
            result.push(path.slice());
            return;
        }
        // too few numbers left in i..n to ever fill the combination
        if (n - i + 1 < k - path.length) {
            return;
        }
        // take i
        path.push(i);
        bkt(i + 1);
        path.pop();
        // skip i
        bkt(i + 1);
    }
}
```

**[Subsets II](https://leetcode.com/problems/subsets-ii/)**

Subsets with duplicates. Rather than the sort-and-skip trick, count how many times each distinct value occurs and then build the subsets one distinct value at a time: at each level we pick a frequency from 0 up to that value's count, push that many copies, and recurse to the next value. Because a value's whole multiplicity is fixed in a single step, no two branches can ever assemble the same multiset, so each distinct subset is recorded exactly once — at the leaf, when every value has been decided. The shape and size of the tree depends on the amount of duplicates. With unique values, it's simply take-no-take 2 ^ n. With 2 unique values 5 times each, the fan-out is 6 per level and there are 6 \* 6 = 36 leaves. No matter the input, our tree can't get too large.

Here is the tree for `nums = [1, 2, 2]` — value `1` appears once, value `2` twice. Each level fixes the copy-count of one distinct value, so the fan-out is `count + 1`, not a fixed two:

```
                              []
                       /             \
                   []                      [1]             i = 0, take value 1 (0 or 1 copies)
               /   |   \               /   |    \
            []    [2]   [2,2]      [1]   [1,2]  [1,2,2]    i = 1, take value 2 (0, 1, or 2 copies)
```

```TS
function subsetsWithDup(nums: number[]): number[][] {
    const counts = new Map<number, number>();
    for (const x of nums) {
        counts.set(x, (counts.get(x) ?? 0) + 1);
    }
    const entries = [...counts];
    const result: number[][] = [];
    const path: number[] = [];

    bkt(0);
    return result;

    function bkt(i: number) {
        if (i === entries.length) {
            result.push(path.slice());
            return;
        }
        const [value, count] = entries[i];
        // descend with 0 copies of value, then 1, 2, ... up to count — one more each pass
        for (let freq = 0; freq <= count; freq++) {
            bkt(i + 1);
            path.push(value);
        }
        for (let freq = 0; freq <= count; freq++) path.pop();
    }
}
```

**[Letter Tile Possibilities](https://leetcode.com/problems/letter-tile-possibilities/)**

This is the swap template from the start of the chapter, applied to the tiles. Duplicate tiles make the same string come out of the tree more than once, so instead of counting nodes we throw every sequence into a `Set` and return its size at the end. Also, every prefix counts, not just the full-length arrangements: every call except the root sits on a chosen prefix `arr[0..i-1]`, so we add it on entry and keep descending. There is no explicit base case — at `i === n` the for loop has nothing left to try.

Cost: this is the same tree as the naive permutations one — under 3 \* n! nodes — but each node now does O(n) work to slice, join and hash the prefix, so O(n \* n!) overall. With at most 7 tiles that is around 100k steps, far below the budget.

```TS
function numTilePossibilities(tiles: string): number {
    const arr = tiles.split("");
    const n = arr.length;
    const seen = new Set<string>();

    bkt(0);
    return seen.size;

    function bkt(i: number) {
        if (i) {
            // the prefix chosen so far is one more (possibly repeated) sequence
            seen.add(arr.slice(0, i).join(""));
        }

        for (let j = i; j < n; j++) {
            [arr[i], arr[j]] = [arr[j], arr[i]]; // choose arr[j] for slot i
            bkt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]]; // undo, restore order
        }
    }
}
```

Although this implementation is solid, let's ask ourselves, for educational purposes, if there is a way to solve this without using `Set`. There is a smart way to make sure we never choose the exact same permutation twice. We can simply ensure that any node in the decision tree never picks the same letter twice. Keep track of what was picked so far, and ignore options that were already picked:

```TS
function numTilePossibilities(tiles: string): number {
    const arr = tiles.split("");
    const n = arr.length;
    let total = 0;

    bkt(0);
    return total;

    function bkt(i: number) {
        const picked: boolean[] = new Array(26).fill(false);

        for (let j = i; j < n; j++) {
            const letter = arr[j].charCodeAt(0) - 65;
            if (picked[letter]) {
                continue;
            }
            picked[letter] = true;
            // placing one more tile forms a new sequence
            total++;
            [arr[i], arr[j]] = [arr[j], arr[i]]; // choose arr[j] for slot i
            bkt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]]; // undo, restore order
        }
    }
}
```

Why does this work? Two candidates `arr[j]` with the same letter would put the same character in slot i and leave behind the same pool of remaining tiles — the two subtrees would be identical, and that is exactly where the duplicates came from. Skipping the repeated letter cuts the whole duplicate subtree at its root. If `Array(26).fill(false)` feels like a lot of work for each node in our tree, remember that we can always use a bitmask.

**[Beautiful Arrangement](https://leetcode.com/problems/beautiful-arrangement/)**

This is the permutations swap pattern with a divisibility filter. `arr` starts as `[1..n]`, and the candidates for slot `i` are the unused suffix `arr[i..n-1]` — but we only swap one in if it is divisible by the position or divides it (positions are 1-indexed, so slot `i` is position `i + 1`). When we run out of slots we have built one valid arrangement, so we bump the counter. We never look at the finished permutation, we only count it, so the scrambled order the swap trick produces costs us nothing. Filtering as we descend keeps the tree far smaller than the full `n!`.

Cost: The permutations tree is O(n!) nodes, about 1.3 trillion at n = 15. But the divisibility filter is what might make it fast enough. Indeed, with such a small n and no other input to depend on, we can simply run the code locally and see how much time it takes. For n = 15, only ~750k nodes end up being visited.

```TS
function countArrangement(n: number): number {
    const arr = Array(n).fill(null).map((_, i) => i + 1);
    let count = 0;

    bkt(0);
    return count;

    function bkt(i: number) {
        if (i === n) {
            count++;
            return;
        }
        const pos = i + 1;
        for (let j = i; j < n; j++) {
            if (arr[j] % pos === 0 || pos % arr[j] === 0) {
                [arr[i], arr[j]] = [arr[j], arr[i]]; // choose arr[j] for slot i
                bkt(i + 1);
                [arr[i], arr[j]] = [arr[j], arr[i]]; // undo, restore order
            }
        }
    }
}
```

**[Fair Distribution of Cookies](https://leetcode.com/problems/fair-distribution-of-cookies/)**

Here the decision at each node is "which of the `k` children gets this bag?" — a `k`-way branch, one level per bag. We keep a running total per child and, at the leaf, the unfairness is the largest total; we minimise that over all assignments. There are opportunities to "prune" (exclude some parts of the DFS tree that are not worth exploring) here — never hand a bag to a child whose total would already reach the best answer so far, and stop trying more children once we've tried an empty one, since all empty children are interchangeable — but let's first see how far the plain version gets.

Cost: k choices per bag over n bags is k ^ n leaves — up to 8 ^ 8 ≈ 16 million. And we still have to do `Math.max(...sums)` for all of them. This unoptimized version still passes even though our 25 million rule of thumb says it shouldn't.

```TS
function distributeCookies(cookies: number[], k: number): number {
    const sums: number[] = new Array(k).fill(0);
    let best = 1e11;

    bkt(0);
    return best;

    function bkt(i: number) {
        if (i === cookies.length) {
            best = Math.min(best, Math.max(...sums));
            return;
        }
        for (let child = 0; child < k; child++) {
            sums[child] += cookies[i];
            bkt(i + 1);
            sums[child] -= cookies[i];
        }
    }
}
```

To convince ourselves that we're not just being lucky, one simple but effective optimization we can do is to get rid of ` Math.max(...sums)` for each leaf and instead carry over the intermediate max downwads. This makes it run in ~500ms instead of ~1600ms at the time of writing.

```TS
function distributeCookies(cookies: number[], k: number): number {
    const sums: number[] = new Array(k).fill(0);
    let best = 1e11;

    bkt(0, 0);
    return best;

    function bkt(i: number, maxSum: number) {
        if (i === cookies.length) {
            best = Math.min(best, maxSum);
            return;
        }
        for (let child = 0; child < k; child++) {
            sums[child] += cookies[i];
            bkt(i + 1, Math.max(maxSum, sums[child]));
            sums[child] -= cookies[i];
        }
    }
}
```

**[Construct the Lexicographically Largest Valid Sequence](https://leetcode.com/problems/construct-the-lexicographically-largest-valid-sequence/)**

Ignore speed for a moment: we could solve this by trying every permutation of `1..size`. At `size = 20` that's 20! permutations, a number with 19 digits — not something we can run to completion, but it is exactly the tree our code walks.

Each permutation maps to at most one sequence: walk it in order and drop every number into the leftmost free slot. A number above `1` also claims the cell that many positions to the right, so numbers placed early reserve cells that later ones skip over. That leftmost-free-slot rule is the `while` loop at the top of `bkt`, which is why the function needs no position argument — where the next number goes is decided by what's already on the board. We try the largest numbers first, so the sequences come out in descending lexicographical order and the first one we complete is the answer. That's what the chain of `return true` is for. Notice that we can't use the swap trick here because we need to try permutations in descending lexicographical order.

Not every permutation yields a sequence. Place 3, then try 2: the 3 takes slot 0 and claims slot 3, the 2 takes slot 1 and needs slot 3 for its second copy — taken. Every permutation starting with 3, 2 is a dead end.

Cost: how many of those 20! permutations are dead ends? Worst case, we wade through all of them before landing on the first valid one. But the shape of the tree depends on the choices made above each node — every placement changes which cells are free, and that changes how many children the next node has — so there's no clean way to count it. We can't easily bound this tree.

Fortunately, we don't have to. `size` is small and it's the only input, so we can run all 20 possible inputs and time them. That's not a complexity bound, but it is proof the code is fast enough. It's also what I'd do in a contest or an interview: write the straightforward version, run it, and look at the clock. If it took more than a couple of seconds I'd hunt for another prune. It takes under 10ms, so I'd move on.

Problems where this is the best you can do are rare, but it's a good reminder of what time complexity is for. It's a tool for convincing ourselves our code is fast enough, not a goal in itself. Real code is sometimes messy enough that an empirical answer like this one is all we get.

```TS
function constructDistancedSequence(size: number): number[] {
    const arr: number[] = Array(size * 2 - 1).fill(-1);
    const used: number[] = Array(size + 1).fill(0);

    bkt();

    function bkt(): boolean {
        let slot = 0;

        // Find the first unoccupied position.
        while (slot < arr.length && arr[slot] !== -1) {
            slot++;
        }

        // No empty positions remain.
        if (slot === arr.length) {
            return true;
        }

        // Try larger numbers first for the lexicographically largest answer.
        for (let value = size; value >= 1; value--) {
            if (used[value]) {
                continue;
            }

            if (
                value > 1 &&
                (slot + value >= arr.length || arr[slot + value] !== -1)
            ) {
                continue;
            }

            used[value] = 1;
            arr[slot] = value;

            if (value > 1) {
                arr[slot + value] = value;
            }

            if (bkt()) {
                return true;
            }

            used[value] = 0;
            arr[slot] = -1;

            if (value > 1) {
                arr[slot + value] = -1;
            }
        }

        return false;
    }

    return arr;
}
```

[← Back to contents](README.md)
