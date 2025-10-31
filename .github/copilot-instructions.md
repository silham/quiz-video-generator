## Quick orientation for AI coding agents

This repository is a small Remotion-based video project that renders compositions built from React components. The goal of contributors is to create a "quiz" workflow (single-question composition, then the full quiz). Keep guidance concise and repo-specific.

Key entry points
- `src/Root.tsx` — registers Remotion <Composition> entries shown in Studio (see `id`, `component`, `schema`, and `defaultProps`). Use the `id` to render via the CLI (e.g. `npx remotion render HelloWorld`).
- `src/HelloWorld.tsx` — example composition: uses Remotion hooks (`useCurrentFrame`, `useVideoConfig`), `spring`, and `interpolate`. Good reference for animations and sequencing.
- `src/HelloWorld/*` — visual subcomponents (Logo, Title, Subtitle, etc.). Follow their patterns for styling and prop validation.
- `src/Quiz/Timer.tsx` and `src/Quiz/Question.tsx` — quiz-specific components. `Timer` expects `time` in seconds and maps to frames via `videoConfig.fps`.

Project conventions and patterns
- Prop validation: components meant to be used as `Composition` receive schemas (Zod) exported from modules. Example: `HelloWorld` exports `myCompSchema` and `Root.tsx` passes `schema={myCompSchema}`.
- Animation/time primitives: prefer Remotion hooks (`useCurrentFrame`, `useVideoConfig`) and helpers (`spring`, `interpolate`) rather than manual timers. See `HelloWorld.tsx` for examples.
- Sequencing: use `<Sequence from={X} durationInFrames={Y}>` to shift children in time (used for Title and Timer in `HelloWorld.tsx`).
- CSS / styling: Tailwind is enabled via `remotion.config.ts` (call to `enableTailwind`); plain inline styles are used in small components (see `Timer.tsx` for style object pattern).

Build / run / debug commands (explicit)
- Install: `npm i`
- Start Studio / local preview: `npm run dev` (runs `remotion studio`). Open the Remotion Studio UI to preview compositions.
- Bundle (code build): `npm run build` (runs `remotion bundle`).
- Render a composition: `npx remotion render <CompositionId>` (e.g. `npx remotion render HelloWorld`).
- Lint & typecheck: `npm run lint` (runs `eslint src && tsc`).

Integration and dependencies to watch
- Remotion core: `remotion` + `@remotion/cli`. Use the Remotion docs for API differences between CLI and Node APIs.
- Zod schemas: `zod` + `@remotion/zod-types` — used to declare `schema` on compositions. When adding props, add/extend the Zod schema and export it from the component module.
- Tailwind: `@remotion/tailwind-v4` + `tailwindcss` — webpack is overridden in `remotion.config.ts` via `enableTailwind`.

Code-change patterns & examples (do this when adding a new question composition)
1. Create new component under `src/Quiz/QuestionComponent.tsx`. Export a React.FC and, if you need externalizable props, export a Zod schema (e.g. `export const questionSchema = z.object({ text: z.string(), ... })`).
2. Add a `<Composition id="Question1" component={QuestionComponent} ... schema={questionSchema} defaultProps={{...}}/>` to `src/Root.tsx` so it appears in Studio and can be rendered via CLI.
3. Use `Sequence` to position question parts in time, and use `Timer` for per-question countdowns. Remember `Timer`'s `time` is in seconds and is translated to frames internally.

Small but important gotchas
- Frame math: many components assume frame-based timing. Convert seconds ⇄ frames using `videoConfig.fps` or use `useVideoConfig()`.
- Avoid long-lived stateful timers outside Remotion frame-based model — use `useCurrentFrame()` in rendering components.
- When adding Tailwind classes, ensure `remotion.config.ts` has `enableTailwind` (already present).
- When editing schemas, update `Root.tsx` compositions that reference them to avoid Studio errors.

Files to check when debugging a change
- `src/Root.tsx` — composition registration and defaultProps.
- `src/HelloWorld.tsx` and `src/HelloWorld/*` — canonical examples for animation and composition structure.
- `src/Quiz/Timer.tsx` — how countdowns are implemented (frame math and CSS pattern).
- `remotion.config.ts` and `package.json` — scripts, Tailwind integration, and build flags.

If you need clarification
- Ask for which composition(s) to create (single-question vs full quiz) and any expected timings or styles. Provide examples of input props (text, choices, duration) and a preferred render id for the final composition.

---
If you want, I can now scaffold a `src/Quiz/QuestionComposition.tsx` and add an entry to `src/Root.tsx` following these conventions. Reply with the props you want exposed (question text, choices, time limit, correct answer index) and I'll generate it.
