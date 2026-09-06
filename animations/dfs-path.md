# DFS traversal - the path list at every step

The node in brackets is where DFS currently is. The list holds the path from the root to the current node.

list: [A]

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

list: [A, B]

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

list: [A, B, D]

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

list: [A, B, D, G]

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

list: [A, B, D]

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

list: [A, B, D, H]

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

list: [A, B, D]

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

list: [A, B]

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

list: [A]

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

list: [A, C]

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

list: [A, C, E]

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

list: [A, C, E, I]

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

list: [A, C, E]

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

list: [A, C, E, J]

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

list: [A, C, E]

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

list: [A, C]

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

list: [A, C, F]

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

list: [A, C, F, K]

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

list: [A, C, F]

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

list: [A, C, F, L]

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

list: [A, C, F]

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

list: [A, C]

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

list: [A]

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
