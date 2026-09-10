[← Back to contents](README.md)

# Depth-First Search (DFS)

- ~17% of medium to hard leetcode problems involve some kind of DFS

## Prerequisites

- graph
- tree
- recursion
- stack

## What DFS is all about

DFS is a way to visit every node in a graph or a tree. As you may recall, a tree is just a graph that is connected and has no cycles. In the figure below, the graph has cycles: A -> C -> E -> B -> A (removing any one of the edges A-B, A-C, C-E, or B-E would turn it into a tree).

            GRAPH                            TREE

        (A)------(B)                         (A)
         |         |                        /   \
         |         |                      (B)   (C)
         |         |                     /  \   /  \
        (C)-------(E)                  (D) (E) (F) (G)
          \                           / \        \
           \                        (H) (I)      (J)
            (F)

For now, let's focus on trees. The node we start from is called the root. We can choose any node as the root, as long as we treat all the other nodes as its descendants. No matter which node we pick, we can rearrange the rest below it and it will still be a valid tree.

DFS starts at the root and explores each child from left to right. For each child, it goes as deep as possible before coming back up to the parent. It only moves back up when there are no more nodes left to visit below the current one. Once all branches have been explored, the traversal ends back at the root. Consider the figure below. [This](./animations/dfs-no-list.md) is how DFS moves until reaching node J. DFS prefers in a sort of counter-clockwise order on the edges of a tree. Down, left, right, and the back up.

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

A -> B -> D -> G -> D -> H -> D -> B -> A -> C -> E -> I -> E -> J. Think about where it goes next. The answer is: -> E -> C -> F -> K -> F -> L -> F -> C -> A. This is the DFS path.

Sometimes people list only the first visit to each node when describing the DFS path. We could implement DFS that way — visiting each node exactly once — giving us: A -> B -> D -> G -> H -> C -> E -> I -> J. However, many problems require us to run some code when we move back up from a child, so it's worth knowing that the full path is available too. The full path isn't much more expensive: each edge is traversed exactly twice, because once DFS goes back up through an edge, it never comes back down through it.

Let's think about how to implement DFS from scratch. The key question is: when we're at some node, where do we go next? The first time we leave a node, we visit its first child, then its second, and so on. After all children are done, we return to the parent — or, if there is no parent (we're at the root), the algorithm ends. So at any point in the traversal, we need to know, for each ancestor node, which child to visit next once we return to it.

Suppose our tree (figure above) is represented by a list of children for each node.

- A -> [B, C]
- B -> [D]
- C -> [E, F]
- D -> [G, H]
- E -> [I, J]
- F -> [K, L]

Say we are at node E and just came from C. We're about to go to I, but before we do, we need to track what comes next when we eventually return to C. At this moment, the list "A, C, E" is enough. When we move back up from E to C, we look at E's position in C's children list and visit the next one: F. We remove E and add F, giving us "A, C, F". We go to K, making the list "A, C, F, K". [Here](./animations/dfs-path.md) is the entire DFS traversal and the state of the list at each step.

There's a clear pattern in how our list evolves over time: we always add and remove nodes from the end. This points to a stack data structure, and a stack is indeed a perfect fit for DFS — every move either pushes or pops the top element, never touching anything below it. Our list can be implemented with a stack. We notice that the stack always contains the path from the root to the current node.

There is one catch: at any given time, we can't tell from the list alone whether we're visiting the last node on the stack for the first time or returning to it after all its children have been visited. Take the last figure of the animation - it looks exactly like the first one. We can solve this by remembering the index of the next child to explore, for each node on the stack. If a node has n children, 0 on the stack means that the first child needs to be explored. n on the stack means that all children have been explored.

[Here](./animations/dfs-next-child-index.md) is how DFS moves, along with the next-child index attached to every node on the stack. Notice that the first and last figures are no longer identical: the root starts with index 0 and ends with index 2. Here is the implementation:

```TS
function dfs(root: number, g: Map<number, number[]>) {
  const st = [{ node: root, nextChild: 0 }];

  while (st.length) {
    const cur = st[st.length - 1];
    const children = g.get(cur.node) ?? [];

    if (cur.nextChild < children.length) {
      // go down
      const child = children[cur.nextChild];
      cur.nextChild++;
      st.push({ node: child, nextChild: 0 });
    } else {
      // go up
      st.pop();
    }
  }
}
```

In practice, this iterative dfs version is rarely used, because there is a more natural way to implement DFS with shorter code - the recursive version:

```TS
const g: Map<number, number[]> = ...

function dfs(node: number) {
  for (const child of g.get(node) ?? []) {
    dfs(child);
  }
}
```

This still uses a stack under the hood — the call stack — but we don't have to manage it ourselves. Each stack frame represents one node in the traversal and each stack frame holds two local variabels: a parameter `node` and the iterator of the for loop. The stack frame at the top of the stack is where DFS currently is. The call stack behaves exactly like the explicit stack from iterative DFS. The logic from the `while` loop of the iteratvie version is baked into the single for loop of the recursive version. `dfs(child)` pushes a new stack frame and advances the iterator just like the first branch of the `if` statement in interative DFS. After all the children have been traversed, the recursive dfs function finishes, returns, and the top stack frame is popped off the call stack, analogous to the `else` branch of iterative DFS. It's very elegant how recursive DFS uses the programming language implementation to its advantage.

The downsides of the recursive version are:

- the call stack has a depth limit (often 100–1000x shallower than a manually allocated stack)
- it's slightly slower (roughly 3x in some languages/runtimes)
- it uses more memory per frame (roughly 5x in some languages/runtimes)

Personally, after thousands of problems, I've yet to run into issues with recursive DFS. Problem authors generally care about choosing the right algorithm, not micro-optimizations such as "only iterative DFS will work here". There are exceptions to this rule, and we'll cover them later in the book, but at the time of writing this, I have never solved a leetcode problem with iterative DFS.

## DFS in the wild

Sometimes a problem gives no obvious hint that DFS is involved — there may not be any graph or tree at all. But DFS is a natural fit for a very common pattern in competitive programming: exploring decisions. Consider a problem where we choose to place a "+" or a "-" between numbers, like [target sum](https://leetcode.com/problems/target-sum/). For each sign "slot", we try both options. In these cases, we can imagine a decision tree where going to the first child means choosing "+" and going to the second means choosing "-". Here is a decision tree for `nums = [1,1,1]; target = 1`:

                         sum = 0
                       /         \
                     +1           -1
                    /               \
               sum = 1             sum = -1
               /     \             /      \
             +1      -1          +1       -1
            /          \        /           \
       sum = 2       sum = 0  sum = 0      sum = -2
        /   \         /   \    /   \         /   \
      +1    -1      +1    -1 +1    -1      +1    -1
      /      \      /      \  /      \      /      \
     3       1✓    1✓      -1 1✓      -1   -1      -3

DFS fits naturally here because we're trying every possible combination — a chain of decisions is exactly a path through a decision tree. Check out the implementation below. The variable `i` represents the index of the decision we need to make next. We pass the running sum down through the tree as a parameter to the DFS function. The call stack handles the rest: as DFS returns from one child back to the parent, the previous sum is already there, ready for the next child to use. When we reach a leaf node (no decisions left), we check whether the final sum matches the target.

```TS
function findTargetSumWays(nums: number[], target: number): number {
    let res = 0;
    const n = nums.length;

    function dfs(i: number, sum: number) {
      if (i === n) {
        if (sum === target) {
          res++;
        }
        return;
      }

      dfs(i + 1, sum + nums[i]);
      dfs(i + 1, sum - nums[i]);
    }

    dfs(0, 0);
    return res;
}
```

In the target sum problem, information flowed one way: _down_. We pushed the running sum into each child as a parameter, and the only thing that mattered happened at the leaves. The DFS function returned nothing — `res` was updated as a side effect. But there's a second, equally common pattern where information flows the other way: _up_. Instead of carrying state into the children, each child computes something about its own subtree and hands it back to the parent, which combines the children's answers with its own value. Here, the return value of the DFS call is the whole point.

Consider [count nodes that are great enough](https://leetcode.com/problems/count-nodes-that-are-great-enough/):

> You are given the root of a binary tree and an integer `k`. A node is **great enough** if its subtree contains at least `k` nodes whose value is strictly smaller than the node's own value. Return how many nodes of the tree are great enough.
>
> Constraints: the tree has between `1` and `10⁴` nodes, `1 <= node.val <= 10⁴`, and `1 <= k <= 10`.

To decide this for a node, we need to know the `k` smallest values sitting below it. There's no way to know that on the way down — the subtree hasn't been explored yet. So we flip the direction: each node asks its children for the smallest values in _their_ subtrees, merges those two lists, and passes the merged list back up to its own parent. The tree is explored bottom-up, with every node building its answer out of the answers its children returned:

```TS
const asc = (a: number, b: number) => a - b
function countGreatEnoughNodes(root: TreeNode, k: number): number {
    let res = 0
    lowestK(root)
    return res
    function lowestK(node: TreeNode | null): number[] {
        if(!node) {
            return []
        }
        // get lowest k for each child
        const left = lowestK(node.left)
        const right = lowestK(node.right)
        // combine the answers
        const values = [...left, ...right].sort(asc).slice(0, k)
        if(values.length === k && node.val > values[k - 1]) {
          // count current node
          res++
        }
        // compute and return lowest k
        values.push(node.val)
        values.sort(asc)
        if(values.length === k + 1) {
            values.pop()
        }
        return values
    }
}
```

The key line is `const left = lowestK(node.left)` followed by `const right = lowestK(node.right)`: we don't do anything with the current node until both recursive calls have returned. By the time we reach the `if`, `left` and `right` already hold the `k` smallest values from each subtree, so we can merge them, keep the smallest `k`, and check whether the node beats all of them. Then we add the node's own value into the list and trim it back down to `k` before returning, so the parent receives exactly what it expects.

One thing to watch here is cost. Every node sorts a list of size up to `k`, so with `n` nodes the work is roughly `O(n · k · log k)` — fine when `k` is small, but worth keeping in mind on large trees, where a costly sort inside the recursion will not be fast enough.

Let's now have a look at [maximum width of binary tree](https://leetcode.com/problems/maximum-width-of-binary-tree/): the width of a level is the distance between its leftmost and rightmost nodes, counting the missing nodes in between. The question is: how do we easily compute the position of each node? Let's quckly draw the tree so we can take a better look at it without wasting brain power to imagine it.

                            1
                          /    \
                        1        2
                      /  \      /  \
                    1     2     3*   4
                  / \    / \   / \   / \
                 1   2  3   4 5   6  7  8

Let's say we are at node 3 (marked with `*`) and we want to compute the position of its children. Before node 3, there are 2 nodes on the same level: 1 and 2. This means that before the first child of node 3, there are 4 children (2 chidren for node 1 and 2 fore node 2). So the position of the left child of node 3 must be `4 + 1 = 5`. So for each node, to find the position of the left child, just multiply its position - 1 by 2 and add 1: `leftPos = (pos - 1) * 2 + 1`. And the right child is immediately after it `rightPos = (pos - 1) * 2 + 2` or simply `pos * 2`. This DFS will explore our tree with the correct position computed and passed down for each node.

```TS
  function dfs(node: TreeNode, pos: number) {
    dfs(node.left, (pos - 1) * 2 + 1);
    dfs(node.right, pos * 2);
  }
```

But we need to watch out: some of the nodes could be missing. `node.left` or `node.right` could be `null`. So we check that.

```TS
  function dfs(node: TreeNode, pos: number) {
    if(!node) {
      return
    }

    dfs(node.left, (pos - 1) * 2 + 1);
    dfs(node.right, pos * 2);
  }
```

Here is the tree (with positions, not values) from the first example of the problem

                            1
                          /    \
                        1        2
                      /  \        \
                     1    2        4

Now, suppose we explore this tree, how to compute the max width on each level?
Let's remember the order of DFS which goes down and left before going up again. DFS guarantees that, for each level, the first node on that level will be reached first and the last node will be reached last. So we can simply pass the level down through the recursion and store the position of the first node of each level. We know it's the first node if there is no currently stored position for that level. Then, if there is a position stored for that level, it means we are at a node which is not the first, and we need to consider the distance between this node and the first node. We don't care if the current node is the last one or not because at some point, DFS will reach the last node on each level.

```TS
function widthOfBinaryTree(root: TreeNode) {
    const minPos: number[] = [];
    let maxWidth = 1;

    dfs(root, 0, 1);
    return maxWidth;

    function dfs(node: TreeNode, level: number, pos: number) {
      if(!node) {
          return;
      }

      if(minPos[level] === undefined) {
        minPos.push(pos);
      } else {
        const diff = pos - minPos[level];
        if(diff + 1 > maxWidth) {
            maxWidth = diff + 1
        }
      }

      dfs(node.left, level + 1, (pos - 1) * 2 + 1);
      dfs(node.right, level + 1, pos * 2);
    }
}
```

For this problem, there one more very subtle missing piece here that doesn't have to do with DFS. The problem statement guarantees that the max width fits in a 32bit integer, but it does not guarantee that `pos` fits into a 32bit integer and indeed running this exact code will fail. Let's imagine a very thin tree that only has a right child for the first 100 levels and on the 101th level it has two leaf children. This tree is very much valid given the problem statement. The issue is that on the last level, `pos` ends up being `2^100`, which greatly exceeds the integer overflow limit in most languages. There are a few ways to fix this, but the simplest one to understand is to use `BigInt`, which has no chance to overflow. It will automatically adjust its internal state as it grows. And `BigInt` is also something to get familiar with, as it proves itself useful quite often.

```TS
function widthOfBinaryTree(root: TreeNode | null): number {
    const minPos: bigint[] = [];
    let maxWidth = 1n;

    dfs(root, 0, 1n);

    return Number(maxWidth);

    function dfs(node: TreeNode | null, level: number, pos: bigint) {
        if (!node) {
          return
        }

        if (minPos[level] === undefined) {
            minPos.push(pos)
        } else {
          const diff = pos - minPos[level]
          if (diff + 1n > maxWidth) {
              maxWidth = diff + 1n
          }
        }

        dfs(node.left, level + 1, (pos - 1n) * 2n + 1n)
        dfs(node.right, level + 1, pos * 2n)
    }
}
```

Those three patterns — passing state _down_ as parameters, returning results _up_ and combining them, and leaning on the _order_ in which nodes are visited — are foundational for DFS. Most DFS problems are just one of these three, or a mix of them, dressed up in different clothing. Once you can spot which flavour a problem wants, the code writes itself: decide what a node needs from above, what it must report below, and whether the order matters. The practice problems below need little more than that. None of them require a new algorithm — only the discipline of asking those three questions before you start typing.

## DFS practice problems

- https://leetcode.com/problems/find-elements-in-a-contaminated-binary-tree/
- https://leetcode.com/problems/sum-root-to-leaf-numbers/
- https://leetcode.com/problems/diameter-of-binary-tree/
- https://leetcode.com/problems/partition-array-into-two-equal-product-subsets/
- https://leetcode.com/problems/smallest-string-starting-from-leaf/
- https://leetcode.com/problems/minimum-time-to-collect-all-apples-in-a-tree/
- https://leetcode.com/problems/number-of-nodes-in-the-sub-tree-with-the-same-label/
- https://leetcode.com/problems/partition-string-into-minimum-beautiful-substrings/
- https://leetcode.com/problems/longest-zigzag-path-in-a-binary-tree/
- https://leetcode.com/problems/lexicographical-numbers/
- https://leetcode.com/problems/longest-path-with-different-adjacent-characters/

## DFS practice problems solved

**[Find Elements in a Contaminated Binary Tree](https://leetcode.com/problems/find-elements-in-a-contaminated-binary-tree/)**

Pass the recovered value down: the root is `0`, the left child is `2x + 1`, the right child is `2x + 2`. Remember every value into a set so we can find it quickly inside `find()`.

```TS
class FindElements {
    private values = new Set<number>();

    constructor(root: TreeNode | null) {
        const dfs = (node: TreeNode | null, value: number) => {
            if (!node) {
                return;
            }
            this.values.add(value);
            dfs(node.left, value * 2 + 1);
            dfs(node.right, value * 2 + 2);
        };
        dfs(root, 0);
    }

    find(target: number): boolean {
        return this.values.has(target);
    }
}
```

**[Sum Root to Leaf Numbers](https://leetcode.com/problems/sum-root-to-leaf-numbers/)**

Pass the number built so far down as a parameter: `current`, adding digits while moving down the tree. After reaching a leaf, add `current` to the result.

```TS
function sumNumbers(root: TreeNode | null): number {
    let res = 0;
    dfs(root, 0);
    return res;

    function dfs(node: TreeNode | null, current: number) {
        if (!node) { // below some node, do nothing
            return;
        }
        const next = current * 10 + node.val;
        if(!node.left && !node.right) { // at leaf, count it
            res += next;
            return;
        }

        dfs(node.left, next);
        dfs(node.right, next)
    }
}
```

**[Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/)**

If we know the max depth starting from each child of a node, we can also compute the max depth of that node. So we can pass up the max depth by returning it. As we do that, we can also compute the maximum path length that passes through that node: the sum of the max depths of the two children.

```TS
function diameterOfBinaryTree(root: TreeNode | null): number {
    let longestDiameter = 0;

    maxDepth(root);
    return longestDiameter;

    function maxDepth(node: TreeNode | null): number {
        if (!node) {
            return 0;
        }

        const dLeft = maxDepth(node.left);
        const dRight = maxDepth(node.right);
        longestDiameter = Math.max(longestDiameter, dLeft + dRight);
        return 1 + Math.max(dLeft, dRight);
    }
}
```

**[Partition Array into Two Equal Product Subsets](https://leetcode.com/problems/partition-array-into-two-equal-product-subsets/)**

Every element goes into one of two subsets, so each node in the decision tree has two branches: multiply the element into the first product or into the second.

```TS
function checkEqualPartitions(nums: number[], target: number): boolean {
    return dfs(0, 1, 1);

    function dfs(i: number, p1: number, p2: number): boolean {
        if (p1 > target || p2 > target) {
          // already past target, no point in continuing
          // we need this to avoid overflow issues
          return false;
        }
        if (i === nums.length) {
            return p1 === target && p2 === target;
        }

        return dfs(i + 1, p1 * nums[i], p2) || dfs(i + 1, p1, p2 * nums[i]);
    }
}
```

**[Smallest String Starting From Leaf](https://leetcode.com/problems/smallest-string-starting-from-leaf/)**

As usual, we can manage the path with a stack. Just be careful to reverse the stack before comparing. What's the worst kind of input for this algorithm? Each leaf costs `O(depth)` to build `candidate` and compare it with `best`, so we want as many leaves as possible, all as deep as possible. If this weren't a binary tree, a chain of 4250 nodes ending in a node with 4250 leaf children would cost about `4250 ^ 2`. In a binary tree a node has at most two children, so the worst shape is a spine of `n / 2` nodes where every spine node also hangs one leaf:

```
            a
           / \
          a   L1
         / \
        a   L2
       / \
      a   L3
     / \
    a   L4
   ...
```

The leaves sit at depths `1, 2, ..., n / 2`, so the total cost is `1 + 2 + ... + n / 2 ≈ (n / 2)² / 2 = 4250² / 2`, about 9 million steps at the maximum `n = 8500`.

```TS
function smallestFromLeaf(root: TreeNode | null): string {
    let best = '';
    const path: string[] = [];

    dfs(root);
    return best;

    function dfs(node: TreeNode | null) {
        if (!node) {
            return;
        }

        path.push(String.fromCharCode(97 + node.val));
        if (!node.left && !node.right) {
            // at leaf, path is root->leaf but the answer reads leaf->root
            const candidate = path.slice().reverse().join('');
            if (best === '' || candidate < best) {
                best = candidate;
            }
        } else {
            dfs(node.left);
            dfs(node.right);
        }
        path.pop();
    }
}
```

**[Minimum Time to Collect All Apples in a Tree](https://leetcode.com/problems/minimum-time-to-collect-all-apples-in-a-tree/)**

We notice that there is no point going down to (and back up from) a child if the child's entire subtree has no apples. So the question is: which are the subtrees without any apples? We can progpagate upwards the count of apples of each subtree:
for any given node, if we know the count of apples of all children subtrees, we can compute the count of apples of that node's subtree. If a child subtree has at least 1 apple, we know we need to go down to that child and back up from it, so we increment the final result by 2.

```TS
function minTime(n: number, edges: number[][], hasApple: boolean[]): number {
    let res = 0;
    const adj: number[][] = Array(n).fill(null).map(() => []);
    for (const [a, b] of edges) {
        adj[a].push(b);
        adj[b].push(a);
    }

    countApples(0, -1);
    return res;

    function countApples(node: number, parent: number): number {
        let apples = hasApple[node] ? 1 : 0
        for (const child of adj[node]) {
            if (child === parent) {
                continue;
            }
            const childApples = countApples(child, node);
            if(childApples) {
              res += 2
              apples += childApples
            }
        }
        return apples;
    }
}
```

**[Number of Nodes in the Sub-Tree With the Same Label](https://leetcode.com/problems/number-of-nodes-in-the-sub-tree-with-the-same-label/)**

If we know the count of each label type for all child subtrees of a given node, we can compute the count of each label type for the current node. We just need to propagate up that frequency array and as we do that, we fill our `result`.
For each node, the for loop has 26 steps. so the total work done is `O(n * 26)`. If we had `1e5` label types, `O(n ^ 2)` would be too slow and this exact algorithm would fail.

```TS
function countSubTrees(n: number, edges: number[][], labels: string): number[] {
    const adj: number[][] = Array(n).fill(null).map(() => []);
    for (const [a, b] of edges) {
        adj[a].push(b);
        adj[b].push(a);
    }
    const result: number[] = new Array(n);

    dfs(0, -1);
    return result;

    // returns letter counts for the subtree
    function dfs(node: number, parent: number): number[] {
        const counts = new Array(26).fill(0);
        counts[labels.charCodeAt(node) - 97]++;

        for (const next of adj[node]) {
            if (next === parent) {
                continue;
            }
            const childCounts = dfs(next, node);
            for (let i = 0; i < 26; i++) {
                counts[i] += childCounts[i];
            }
        }

        result[node] = counts[labels.charCodeAt(node) - 97];
        return counts;
    }
}
```

**[Partition String into Minimum Beautiful Substrings](https://leetcode.com/problems/partition-string-into-minimum-beautiful-substrings/)**

From each index, we try all possible powers of 5 that start from this index. `n <= 15` is very important. Every node of the tree is one way of cutting a prefix of the string into powers of 5, and there are only 14 places to put a cut in a string of 15 characters, so the tree has fewer than `2 ^ 15` nodes no matter what. Note that `1` is a power of 5 too (`5 ^ 0`), so a piece can be a single character and the tree can be 15 levels deep — `"111111111111111"` splits into 15 pieces. For each node, we traverse at most the rest of the string because of the for loop, so the total work is under `2 ^ 15 * 15`, about 500 thousand steps.

```TS
function minimumBeautifulSubstrings(s: string): number {
    // store all powers of 5 in a set
    //
    const powersOf5 = new Set<number>();
    for (let value = 1; value < 2 ** s.length; value *= 5) {
        powersOf5.add(value);
    }

    const best = dfs(0);
    return best === 1e11 ? -1 : best;

    function dfs(i: number): number {
        if (i === s.length) {
            return 0;
        }
        if (s[i] === '0') {
            return 1e11;
        }

        let best = 1e11;
        let value = 0;
        for (let j = i; j < s.length; j++) {
            value = value * 2 + Number(s[j]);
            if (powersOf5.has(value)) {
                best = Math.min(best, 1 + dfs(j + 1));
            }
        }
        return best;
    }
}
```

**[Longest ZigZag Path in a Binary Tree](https://leetcode.com/problems/longest-zigzag-path-in-a-binary-tree/)**

Each node returns two numbers: the zigzag length starting there going left, and going right.

```TS
function longestZigZag(root: TreeNode | null): number {
    let best = 0;

    longest(root);
    return best;

    // returns [zigzag going left, zigzag going right] starting at node
    function longest(node: TreeNode | null): [number, number] {
        if (!node) {
            return [-1, -1];
        }
        // left to node.left, then right from node.left by indexing the second element of longest(node.left)
        const goLeft = longest(node.left)[1] + 1;
        // right to node.right, then left from node.right by indexing the first element of longest(node.right)
        const goRight = longest(node.right)[0] + 1;
        best = Math.max(best, goLeft, goRight);
        return [goLeft, goRight];
    }
}
```

**[Lexicographical Numbers](https://leetcode.com/problems/lexicographical-numbers/)**

The simplest solution would be to generate all the numbers from 1 to n as strings, sort them, and then convert them back to an array. However, that requires `O(n)` extra memory for the array of strings and sorting is generally considered `O(n logn)`. The intended solution though is DFS. Think of the numbers as a tree with 10 children (one for each digit): the roots are `1..9`, and each number `x` has children `10x .. 10x+9`. A pre-order DFS that appends the node before descending visits the numbers in lexicographical order. We construct the current argument, pass it on a stack downwards and once it exceeds `n`, we stop the DFS. So the work is proportional to the `n` numbers we actually emit. Cost: each of the n emitted numbers is one node, and every node makes at most 10 child calls, each O(1) before recursing or bailing at the `num > n` check — O(10 \* n) = O(n) overall, a DFS tree that is linear in its output.

```TS
function lexicalOrder(n: number): number[] {
    const result: number[] = [];

    for (let first = 1; first <= 9; first++) {
        dfs(first);
    }
    return result;

    function dfs(num: number) {
        if (num > n) {
            return;
        }
        result.push(num);
        for (let next = 0; next <= 9; next++) {
            dfs(num * 10 + next);
        }
    }
}
```

**[Longest Path With Different Adjacent Characters](https://leetcode.com/problems/longest-path-with-different-adjacent-characters/)**

Each node returns up its longest downward chain of distinct adjacent labels. The best path through a node joins its two longest child chains — but only chains from children whose label differs from the node's own.

```TS
function longestPath(parent: number[], s: string): number {
    const n = parent.length;
    const children: number[][] = Array(n).fill(null).map(() => []);
    for (let i = 1; i < n; i++) {
        children[parent[i]].push(i);
    }

    let res = 1;
    longest(0);
    return res;

    // returns longest downward chain starting at node
    function longest(node: number): number {
        let first = 0;
        let second = 0;

        for (const child of children[node]) {
            const chainSize = longest(child);
            if (s[child] === s[node]) {
                continue;
            }
            if (chainSize > first) {
                second = first;
                first = chainSize;
            } else if (chainSize > second) {
                second = chainSize;
            }
        }

        res = Math.max(res, first + second + 1);
        return first + 1;
    }
}
```

[← Back to contents](README.md)
