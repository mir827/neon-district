# Coding Agent Guide

This is a TypeScript/Vite/Three.js browser game. Keep rendering and updates in the Three.js loop; do not introduce a backend or SPA router. Preserve strict TypeScript and modular game systems.

## Working rules

- Think through material assumptions before coding and keep changes scoped to the requested outcome.
- Prefer direct, maintainable implementations over speculative abstractions.
- Keep input, physics, rendering, UI, save data, and game rules separated.
- Preserve keyboard, touch, narrow-screen, reduced-motion, loading, and error behavior.
- Use relative/base-aware asset paths so GitHub Pages builds work.
- Verify with format, lint, tests, TypeScript/build, and a browser smoke test when available.
- Never add copyrighted game assets or unclear-license media.
