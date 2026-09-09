# formula

Vendored copy of the wireframe renderer used by
[Article-23.html](../Article-23.html).

Open `index.html?model=<name>` to view one model. Valid names:

    cube  penger  totoro  300sl  964  w201  catbus

An unknown or missing name falls back to `964`.

Each `<name>.js` declares two globals, `vs` (vertex positions) and `fs`
(index lists — a two-index entry is one edge, a longer entry is a closed
loop), so only one may be loaded at a time. `index.js` builds one instanced
quad per edge and draws the whole model in a single WebGL draw call, with
opacity keyed to depth.

## Credits

`index.js`, `index.html`, `cube.js` and `penger.js` derive from
[tsoding/formula](https://github.com/tsoding/formula) by Alexey Kutepov,
MIT licensed — see `LICENSE`. The penguin mesh comes from
[Max-Kawula/penger-obj](https://github.com/Max-Kawula/penger-obj).

`totoro.js`, `300sl.js`, `964.js`, `w201.js` and `catbus.js` are converted
from third-party meshes that shipped without licence files. They belong to
their original authors; trace the provenance before reusing them.
