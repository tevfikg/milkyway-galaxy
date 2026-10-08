# Milky Way Galaxy

An interactive, real-time 3D Milky Way galaxy rendered in the browser with three.js. It features a glowing galactic core, spiral arms, an accretion disc, drifting nebulae, cosmic dust and a meteor shower, finished with cinematic bloom and film-grain post-processing.

## Features

- **38,400-star field** colored by stellar temperature (yellow-white G/K types, hot blue stars, red M-type dwarfs)
- **Galactic core** with a pulsing emissive sphere and three layered glow halos
- **Accretion disc** of 9,500 particles orbiting the core
- **Four spiral arms** (14,000 particles) built on a logarithmic spiral with color gradients
- **Nine procedural nebula clouds** generated at runtime on canvas textures
- **Meteor shower** of 11 shooting stars with fading trails
- **Cosmic dust and light rays** for depth and atmosphere
- **Cinematic post-processing**: bloom glow plus film grain and scanlines
- **Orbit controls** with damping and slow auto-rotation
- Live **FPS counter** and on-screen HUD

## Tech Stack

| Library                          | Version            | Role                                                                       |
| -------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| [three.js](https://threejs.org/) | `0.128.0` (pinned) | WebGL 3D engine: scene, camera, renderer, geometries, materials and lights |
| [Vite](https://vite.dev/)        | latest             | Dev server with hot reload and production bundler                          |

### three.js modules used

- **Core** (`three`): `Scene`, `PerspectiveCamera`, `WebGLRenderer`, `BufferGeometry`, `Points`, `PointsMaterial`, `MeshStandardMaterial`, `CanvasTexture`, `FogExp2`, and point/ambient lights.
- **OrbitControls** (`three/examples/jsm/controls`): lets the user drag to rotate and scroll to zoom around the galaxy, with smooth damping and auto-rotation.
- **EffectComposer** (`three/examples/jsm/postprocessing`): chains post-processing passes on top of the rendered scene.
- **RenderPass**: the first pass, which renders the scene into the composer.
- **UnrealBloomPass**: adds the soft, bright glow around the core, stars and nebulae.
- **FilmPass**: adds subtle film grain and scanlines for a cinematic look.

### Why three.js 0.128.0?

The original pen loads three.js `0.128.0` from a CDN. Newer releases change the `FilmPass` API and how light intensities are calculated, which changes the look of the scene. The version is pinned with `--save-exact` so the result matches the original exactly. Upgrading is possible but needs visual retuning.

## Getting Started

**Requirements:** [Node.js](https://nodejs.org/) LTS (includes npm)

```bash
# install dependencies
npm install

# start the dev server
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Scripts

| Command           | Description                                     |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the local dev server with hot reload      |
| `npm run build`   | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally            |

## Controls

| Input  | Action                              |
| ------ | ----------------------------------- |
| Drag   | Rotate the camera around the galaxy |
| Scroll | Zoom in and out                     |
| `B`    | Toggle the bloom effect             |

## Project Structure

```
milkyway/
├── index.html        # HUD markup and app entry point
├── package.json
└── src/
    ├── main.js       # three.js scene, galaxy generation and animation loop
    └── style.css     # loading screen and HUD styles
```

##MIT Lince
