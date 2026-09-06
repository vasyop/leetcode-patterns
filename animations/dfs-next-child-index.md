# DFS traversal - stack with next-child indices

Each stack entry is written as `X:i`, where `i` is the index of the next child of `X` to explore. `X:0` means no child of `X` has been explored yet. When `i` equals the number of children of `X`, all of its children are done. The node in brackets is where DFS currently is.

list: [A:0]

            [A]
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

list: [A:1, B:0]

             A
            / \
           /   \
          /     \
         /       \
        /         \
      [B]          C
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:1, B:1, D:0]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
      [D]       E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:1, B:1, D:1, G:0]

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
    [G]  H    I   J K   L

list: [A:1, B:1, D:1]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
      [D]       E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:1, B:1, D:2, H:0]

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
     G  [H]   I   J K   L

list: [A:1, B:1, D:2]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
      [D]       E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:1, B:1]

             A
            / \
           /   \
          /     \
         /       \
        /         \
      [B]          C
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:1]

            [A]
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

list: [A:2, C:0]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B          [C]
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:1, E:0]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D       [E]    F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:1, E:1, I:0]

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
     G   H   [I]  J K   L

list: [A:2, C:1, E:1]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D       [E]    F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:1, E:2, J:0]

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
     G   H    I  [J]K   L

list: [A:2, C:1, E:2]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D       [E]    F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:1]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B          [C]
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:2, F:0]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D        E    [F]
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:2, F:1, K:0]

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
     G   H    I   J[K]  L

list: [A:2, C:2, F:1]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D        E    [F]
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:2, F:2, L:0]

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
     G   H    I   J K  [L]

list: [A:2, C:2, F:2]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B           C
       |          / \
       |         /   \
       D        E    [F]
      / \      / \   / \
     G   H    I   J K   L

list: [A:2, C:2]

             A
            / \
           /   \
          /     \
         /       \
        /         \
       B          [C]
       |          / \
       |         /   \
       D        E     F
      / \      / \   / \
     G   H    I   J K   L

list: [A:2]

            [A]
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
