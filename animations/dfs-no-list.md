# DFS traversal - the path list at every step

The node in brackets is where DFS currently is.

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
