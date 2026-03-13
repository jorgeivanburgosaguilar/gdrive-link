# AGENTS.md

## Testing

No tests for this project. Do not write unit tests, integration tests, or e2e tests. Do not add testing libraries or frameworks.

## General Code Style

- ES modules (`"type": "module"` in package.json). Use `import`/`export`, never `require`.
- Prefer `const`; use `let` only when reassignment is needed. Never use `var`.
- Error handling: use try/catch in API routes, return appropriate JSON error responses with status codes.
- Keep Spanish for user-facing strings (labels, error messages shown to users). Use English for code identifiers, comments, and TypeScript types/interfaces.

## Project Commands

- `pnpm dev` - start dev server
- `pnpm build` - production build
- `pnpm lint` - run prettier --check + eslint
- `pnpm format` - auto-format with prettier
- `pnpm check` - svelte-check type validation

## Type System

- **TypeScript first** - this project uses TypeScript for application code, route handlers, tests, and Svelte components with `lang="ts"`.
- **Express types with TypeScript syntax** using annotations, `type` aliases, and `interface`s instead of JSDoc type tags.
- Use `import type` for framework and shared types when possible.
- Type all exported functions, SvelteKit handlers, props, load data, and shared utilities explicitly.

## Svelte

- This project uses **Svelte 5** with runes (`$state`, `$derived`, `$effect`, `$props`). Never use Svelte 4 patterns (`export let`, `$:` reactive statements, stores via `$` prefix).
- Use the **Svelte MCP server** (`list-sections`, `get-documentation`, `svelte-autofixer`) to verify syntax when unsure about Svelte 5 APIs.
- Always run `svelte-autofixer` on any Svelte component you write or modify before presenting it.
- Use `{@render children()}` for slot content, not `<slot />`.
- Use `onclick={handler}` attribute syntax, not `on:click={handler}`.

## SvelteKit

- Adapter: `@sveltejs/adapter-vercel` - deployed to Vercel.
- API routes live in `src/routes/api/` as `+server.ts` files exporting HTTP verb functions (`GET`, `POST`, etc.).
- Use `$env/dynamic/private` for server-side secrets and `$env/dynamic/public` for client-side env vars.
- Path aliases: `$lib` maps to `src/lib/`.

## Formatting

- Formatting is auto-enforced by `.prettierrc` + `.editorconfig`. Run `pnpm format` before committing.
- **Spaces** (2-space indent), **single quotes**, **no trailing commas**, **print width: 100**.
- Tailwind class sorting is automatic via `prettier-plugin-tailwindcss`.

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin. Utility-first classes inline in markup.
- `@tailwindcss/forms` plugin is available.
- Dark mode is class-based (`dark:` variant with `document.documentElement.classList`).
- Stylesheet entry point: `src/routes/layout.css`.
