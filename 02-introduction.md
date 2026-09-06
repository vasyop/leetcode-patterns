[← Back to contents](README.md)

# Introduction

## Why does this book exist?

This book is intended to cover the space between basic interview preparation and approximately a 2200 LeetCode contest rating, which is around the top 1% of contestants. I have achieved this rating after around 1 year of _grinding_ LeetCode and the goal of this book is to make the journey much quicker for you. It covers the techniques needed for LeetCode, from the most common, to those that are rare, specialized, or somewhat esoteric. It will teach you what is worth learning, how deeply it is worth learning, and in what order. It will also teach you about the thought process you need to apply before deciding on an implementation. There are over 1000 practice problems in this book carefully selected, ordered, and explained.

There is already a lot of material for data structures and algorithms (DSA) interview prep. There is LeetCode, competitive-programming courses, YouTube videos, editorials, problem lists, roadmaps, and thousands of articles. Some of this material is very good. So why do you need another book? The problem is not that there are too few explanations or too few problems it's that most resources do not organize them in a way that reliably takes you from knowing the basics to being able to solve difficult problems on your own. LeetCode is primarily a collection of problems, not a complete curriculum. Some of its tags are useful, but they are much too broad. A problem tagged `Dynamic Programming` on LeetCode could involve:

- interval DP;
- tree DP;
- digit DP;
- bitmask DP;
- rerooting;
- sum over subsets DP;
- others

Knowing that a problem is “DP” is not enough. You need to recognize the much more specific pattern inside it. Many courses have the opposite problem. They spend a lot of time explaining basic data structures, but stop before reaching many of the techniques needed for harder problems. You may get several lenghty videos about stacks, queues, trees, and graphs, followed by a relatively small collection of standard problems. That is useful for a beginner, but it is not enough if your goal is to become genuinely strong at problem solving.

## Patterns

After solving over 2,000 LeetCode problems, participating in contests, watching and conducting technical interviews, I believe the most important question in the DSA interviews and LeetCode contests is how do you get from reading the statement to having an idea that works?

From a certain level upwards, solving each problem requires knowing the right patterns. A pattern is not always an algorithm. It might be a combination of data structures, a certain way of reasoning about the problem, or a specific flavor of a well-known algorithm applied in an unusual way.

Solving LeetCode problems in random order forces you to guess which pattern a problem needs before you have learned to recognize any of them. It is much more effective to focus on the patterns themselves: study one, practice it until it feels familiar, and only then move on.

Many courses do teach patterns, but they present them in no particular order, as a loose catalog of tricks. In this book, each pattern builds on the ones that came before it. And for each pattern, the goal is not just to show the code. You need to understand why it works, what kind of problem it solves, why it fits well in certain scenarios, and — most importantly — when it should come to mind while you are reading a new statement.

There is an uncomfortable truth about technical-interview preparation: some of it consists of learning things that you may rarely use directly in ordinary software development. You will probably never implement a segment tree, digit DP, or even dijkstra algorithm at work. Others, like DFS, you (or your coding agent) probably will. You may reasonably believe that memorizing such techniques is artificial. In many cases, it is. However, the broader mindset is not artificial. Real engineering does not reward you for reinventing every known solution from first principles. It rewards you for learning existing approaches, recognizing when they apply, understanding their trade-offs, and adapting them correctly. Real engineering may not be much about algorithms, but there are patterns to know regardless. And at the highest competitive-programming ratings, one of the most important skills is recognizing familiar patterns and having enough previous experience with them that the implementation goes smoothly enough. This does not mean memorizing complete answers to individual problems. It means learning the standard building blocks from which problems are constructed. A lot of top level competitive programmers have a number of templates of algorithms that they undestand deeply and only have to adjust slighty during contest (yes, it's allowed).

You will almost always encounter problems made from known ideas. You just have to learn those ideas patiently and practice so you become good at recognizing and combining them. Solving those problems is much much more about knowing these patterns than about being very bright.

There are other skills required to pass a technical interview. Having great communication skills goes a long way, but knowing your interview problem inside out (because you have learned and practiced) reduces stress and improves your communication indirectly. Almost everything is easier in an interview if you know the subject well, including very soft qualities such as mood, passion or general vibe.

Some patterns appear constantly. Others may appear once every few hundred problems. This book does not pretend that they deserve equal attention.

I have measured how frequently different patterns occur and considered how well each one must be understood to maximize your chances of solving problems. Common and highly reusable ideas receive more attention and appear in more practice problems. Rare techniques are taught later and more selectively.

Learning one more obscure data structure may feel productive, but becoming faster and more reliable at prefix sums, binary search, DFS, greedy reasoning, or common forms of dynamic programming will usually improve your results much more.

Many rare techniques are still included. The difference is that they are placed according to their actual usefulness rather than according to how mathematically impressive they look.
For each pattern, at the start of the chapter, I have added an indication of how often you will encounter it.

## Idea generation and implementation

Solving a problem involves at least two separate skills:

1. generating the correct idea;
2. implementing that idea correctly.

This book primarily focuses on idea generation.

That does not mean implementation is unimportant. A correct idea with incorrect code still produces a wrong answer. However, implementation improves largely through writing and debugging a lot of code. Idea generation requires experience and a more deliberate understanding of patterns.

The solutions in this book therefore aim to use the simplest implementation that passes the required constraints. They will not intentionally exploit weak test cases. They will not use hacks that fail for valid inputs. They will also avoid unnecessary optimizations and excessively clever code when a simpler solution is fast enough.

There is often a temptation to make a solution look more advanced than it needs to be. This usually makes it harder to understand, harder to prove, harder to implement, and easier to get wrong. In a contest, the simplest correct solution is usually the safest solution. In an interview, it is also the easiest solution to explain. Your first goal should be to implement the simplest solution that passes. Optimize it only when the constraints require you to.

## How this book came to be

At the time of writing, I have solved over 2,000 LeetCode problems, with a focus on mediums and hards. It took well over a year and required a patient and loving wife. I didn't do it only for DSA interview prep, I was always genuinely interested in the patterns behind algorithms and data structures. During high school, after a few weeks of my introductory programming course, I was thought merge sort, and at that time, I didn't understand it. Reccursion, divide and conquer, and how it all fit into `O(n logn)` were too much for me. I understood how selection sort works, but that was the peak of my performance. I really didn't know much a about programming back then. I wanted to study CS in university, because I liked video games, programming was well paid and it didn't require too much memorizing without understanding to do well in my high school final exam (unlike math for example). But there was a problem - I still had to memorize merge sort without understanding it. This stuck in my head. I did eventually understand merge sort years later in university, but I was still disappointed of the quality of the explainations I found online and offline. In 2019, just after university, I realized that I didn't know how my programming language worked - I had taken no compilers course. I understood how basic CPU instructions worked and the rules of various programming languages, but everything in between was foreign to me. So I built a programming language from scratch and [showed people how it worked](https://github.com/vasyop/miniC-hosting). I eventually abandoned that project, because people were more interested in how _real_ programming languages worked, not in the tricks and patterns used by compilers in general. And in 2025, I decided I wanted to understand how DSA problems work - what are the building blocks? Again, I was disappointed of what I found online.

During my 2,000 leetcode problems year, I used LLMs to explore ideas when I got stuck or couldn't make sense of cryptic explanations. I also used them to implement solutions that I was confident I already knew how to implement, but actually writing the code myself would have added little value. Once I had worked through enough problems, I set out to extract the recurring patterns that show up again and again. I went back through every problem and tagged each one with one or more of these patterns. A pattern might be a classic competitive programming technique like "monotonic queue" or "Dijkstra's algorithm," or a more general way of thinking, such as "reason backwards" or "based on this harmonic series". Tagging everything let me count which patterns come up most often and which are nearly irrelevant until much later. Some patterns are rare enough that learning them early would be a waste of time. Some are straightforward on their own but depend on understanding easier techniques first. Some are short, math-based code snippets that turn out to be surprisingly useful. And some are closely related and share an underlying idea.

This book is organized around those patterns, ordered from the most common to the most rare. There is also a bit of reordering because some patters are very common but are based on less common patters that are much easier.

Each pattern is introduced only after you have seen the concepts it builds on. You'll encounter it first in a clean, isolated form, then in straightforward problems, and finally mixed together with material from earlier chapters. The goal is not to memorize a long list of algorithms. It is to make hard problems feel less foreign.

## Before You Begin

This book is not a complete beginner course, it's intermediate to advanced. However, it does spend some time on "beginner" patterns - some are too important to ignore. Each chapter has a list of prerequisites at the begining (which may include previous chapters and their implicit prerequisites lists).

Every problem mentioned in this book is solved in TypeScript and the ideeas behind the code are explained in detail. Some sections will also discuss JavaScript / TypeScript quirks. Keep in mind that every language has its unique quirks.

Do not _only_ read the chapters. After learning a technique, solve the practice problems for that chapter. Most of them should feel easy, even though the focus of this book is on mediums and hards. These problems are designed to make the new pattern obvious enough that you can focus on understanding it. There are larger practice pools every once in a while that combine several techniques. Later practice pools will include more and more patterns. This is where you simulate a real world interview scenario.

By the end, when you sit down with a new problem, you should be able to break it into familiar pieces, come up with a small number of plausible approaches, rule out the ones that won't fit the constraints, and implement the simplest solution that actually works.

[← Back to contents](README.md)
