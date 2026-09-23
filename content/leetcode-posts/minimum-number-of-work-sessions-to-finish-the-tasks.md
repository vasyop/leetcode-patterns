# Minimum Number of Work Sessions to Finish the Tasks

This problem fits into the **bitmask** class of top-down DP problems, and it is the chapter's clearest lesson in *what a state should return*.

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

My first thought was a state like `(taken, sessionsCompleted, timeLeftInCurrentSession)`: DFS the
graph, and record the best `sessionsCompleted` whenever `taken` is all ones. The function doesn't even
have to return anything — the memo is just a visited set.

It works, and it is slow. The table is `2 ** 14` masks by `n + 1 = 15` session counts by
`sessionTime + 1 = 16` remaining minutes, so `2 ** 14 * 15 * 16 = 3.9M` states, each with a
14-iteration loop inside — around 55 million steps, well past the 25-million guideline. We are in
luck: it still barely passes, in about 2.5 seconds.

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

The better way is a change of question. Instead of "can this state be reached?" — which forces the
running count into the state so the answer can be read off at the leaves — ask **"what is the minimum
number of sessions required from this state onwards?"**. The count then comes back up through the
return value, and `sessionsCompleted` drops out of the state entirely. That is at least ten times
faster.

- **State:** `(taken, time)` — which tasks are done, and how much of the current session is left.
- **Transitions:** one per remaining task: fit it into the current session, or open a new one
  (charging 1).
- **Cost:** `2 ** 14 * 16` states with 14 transitions each — about 3.7 million.

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

The general rule: a quantity accumulated *on the way down* usually belongs in the return value
instead. Carrying it in the state multiplies the state count by its range, for no information gain.
