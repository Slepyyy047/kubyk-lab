# Design

## Source of truth
Active, 2026-10-04. Updated from the user's requested redesign. Evidence: current React routes in src/App.tsx, Three.js CubeView.tsx, existing CSS, solver tests and browser screenshots. No reference image was supplied.

## Brand
A tactile digital object and a useful learning tool. Direct Ukrainian copy. Avoid marketing filler, tiny pale text, green/cream styling, generic benefit cards and decorative dashboard chrome.

## Product goals
Home is a large interactive 3D object. Solver, lessons, information and manual practice have separate routes. Practice must model real moves for 2×2, 3×3 and 4×4, including inner layers for 4×4. Preserve existing physical-cube solver and local progress.

## Personas and jobs
Curious visitors interact immediately. Beginners learn then practice without buying a cube. Physical-cube owners enter stickers on the solver page.

## Information architecture
`/`: interactive home. `/play`: manual cubing. `/solve`: original 3×3 input/solver. `/lessons`: course. `/about`: expanded history/mechanics. Common header, desktop links, mobile menu. No solver on home.

## Design principles
Lead with the object. Keep practice minimal: cube and one primary shuffle action; model switch and compact instructions are secondary. Expose real state and undo via keyboard, without automatically solving the user's game.

## Visual language
Graphite #17191e / #21242b, warm white #f6f2e9, muted neutral #b4b5bc, orange #ff9b57 accent. Large heavy system typography with readable weights 550–800. No external font required. Borders and restrained rounded corners. Cube uses rounded plastic pieces, directional light, smooth layer motion and pointer feedback. Exploded view is only on home; it does not alter puzzle state.

## Components
Retain CubeView and Player for solver/course. Add NxN geometry/state engine, InteractiveCube renderer and Practice page, reused by Home. CSS owns theme tokens. Preserve palette colors for accurate cube input.

## Accessibility
Visible high-contrast focus; semantic menu; touch and pointer gestures; keyboard U/D/L/R/F/B, Shift inverse, inner-layer modifier on 4×4. Small optional control reference for discoverability. Reduced motion disables idle float, inertia, reveal motion and auto-turns. Accessible alternative move controls when WebGL or gestures are unavailable.

## Responsive behavior
Header becomes an accessible expandable menu below 760px. Home cube takes most of the screen. Practice adapts to portrait height; touch targets at least 44px for controls. Existing solver keeps enlarged mobile face entry.

## Interaction states
Selected size, hover/selected layer, animated atomic turn, shuffle queue, playing, solved, restored local game, blocked storage and unsupported WebGL. Disable model switch and shuffle during turns. Pointer cancellation must restore interaction state.

## Content voice
Concise Ukrainian, no promotional slogans. Explain gestures and modifiers plainly. Label distinct jobs: Головна, Грати, Розв’язати, Уроки, Про кубик.

## Implementation constraints
Existing React/TypeScript/Vite/Three.js dependencies only. NxN state is sticker geometry, not a fake visual scramble. 3×3 turns must match cubejs. Test inverse/four-turn/count invariants for each size, inner slices, input methods, persistence and existing solver.

## Open questions
None blocking. Color direction inferred from user's dissatisfaction; graphite/orange can be adjusted later. Initial model range: 2×2, 3×3, 4×4; no claim of automatic 2×2/4×4 solutions.
