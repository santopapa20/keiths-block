# Keith's Block

A 3D interactive portfolio: a floating city block where every building or prop is a section
(About, Skills, Experience, Projects, Certifications, Education, Contact).

Built with Vite, React, three.js and React Three Fiber.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

## Build

```bash
npm run build
```

The finished site is written to `dist/`.

## Where things are

- `src/data/content.js` – all the text shown in the panels
- `src/data/sections.js` – the stops on the tour and their camera positions
- `src/data/models.js` – size and placement of each 3D model
- `src/scene/` – the 3D scene (buildings, props, lighting, camera)
- `src/ui/` – the page around it (navigation, hero, panels, loading screen)
- `public/models/` – the 3D models (GLB)

Add `?quality=high`, `?quality=medium` or `?quality=low` to the address to pin the quality level.
