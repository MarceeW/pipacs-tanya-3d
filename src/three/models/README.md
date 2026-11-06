# Model authoring guide (Pipacs Tanya 3D)

All 3D art is procedural (Three.js primitives, no external assets). Art direction: a bright,
saturated, storybook cartoon farm in the spirit of classic browser farm games of the
early 2010s: chunky rounded forms, slightly exaggerated proportions, lush colours,
cosy details (trims, window frames, shingles, planks, flower boxes). All designs must be ORIGINAL –
do not reproduce logos, characters or specific assets of any existing game.

## Rules
* Build only with helpers from `src/three/lib.js` (`box`, `cyl`, `cone`, `ball`, `capsule`, `mesh`,
  `GEO.*`, `gableRoof`, `windowPane`, `door`, `blobShadow`, `group`, `place`) and materials from
  `M(color, opts)` / `leafMat(color)`. Never create `new THREE.*Material` yourself – the shared
  materials carry the global effects (snow on upward faces in winter, wind sway, night window glow,
  season-coloured foliage).
  * Plants/foliage: `leafMat(color)` (sways + changes colour with seasons). Evergreens: `leafMat(c, { evergreen: true })`.
  * Swaying non-leaf parts (wheat ears, flower heads, fruit on plants): `M(color, { sway: 0.02 })`.
  * Glowing at night (windows, lamps): `M(color, { emissive: '#ffe9a3', glow: true })`.
  * Things that should never get snow (water, glass, undersides): `M(color, { snow: 0 })`.
  * Transparent: `M(color, { transparent: true, opacity: 0.5, snow: 0 })`.
* 1 tile = 1 world unit; footprint `n` → centred on origin within x,z ∈ [-n/2+0.05, n/2-0.05]; y=0 is the ground.
  The model's front faces **+z**; the default camera sees the +z and +x faces (isometric, from +x+z).
* Use `rbox` (rounded box, via `box(w,h,d,color,{r:0.04})`) for most blocks; low-poly icospheres
  (`ball(r, c, {low:true})`) for foliage clumps.
* Keep it light: share geometry via the cached helpers; tiny details `{ shadow: false }`.
  Budgets: crop/item ≤ 40 meshes, animal ≤ 30, building ≤ 150.
* Animation: `group.userData.anim = (t, dt) => {}` is called every frame by the world.
  Mutable state the game sets lives in `group.userData.state` (documented per module).
* Each module exports `CATALOG = { name: () => Object3D }` listing every model/variant for the gallery.

## Preview / verify
Dev server: `http://localhost:5173` (run `npx vite --port 5173` in the project root if it is not up).
Gallery: `/gallery.html?set=<plants|animals|buildings|decos|items>[&filter=substr][&season=winter][&night=1][&yaw=0..3][&cols=N]`
Screenshot (headless Chrome, prints console errors or `ok`):
a headless-Chrome screenshot script of your choice (e.g. puppeteer)
Look at the PNG (Read tool) and iterate until it looks great, in summer, winter and night.
