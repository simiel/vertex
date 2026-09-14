# Fix Sanity Cloud Studio environment configuration

## Goal

Fix the Sanity-hosted Studio deployment failure `Missing environment variable: NEXT_PUBLIC_SANITY_DATASET` by making the Studio and Sanity CLI configurations use Sanity’s standard `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` variables, while retaining safe local compatibility with the existing Next.js `NEXT_PUBLIC_*` variables.

## Inspected files

- `sanity/env.ts`: root config currently requires `NEXT_PUBLIC_SANITY_DATASET` and `NEXT_PUBLIC_SANITY_PROJECT_ID`.
- `sanity.cli.ts`: root CLI config reads only the `NEXT_PUBLIC_*` names.
- `studio/env.ts`: standalone Studio has a custom `import.meta.env`/`process.env` fallback implementation.
- `studio/sanity.config.ts` and `studio/sanity.cli.ts`: standalone Studio imports `studio/env.ts`.
- Sanity documentation: Sanity-hosted builds/deploys expose variables prefixed `SANITY_STUDIO_`, and `sanity deploy` runs in production mode.

## Decisions

- Prefer `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` for Sanity Studio and CLI configuration.
- Keep `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` as fallbacks so existing local web/embedded-Studio workflows continue to work.
- Do not add a dataset default or hardcode a project ID; deployment must target explicitly configured values.
- Do not expose tokens or add secrets to the repository.
- Update `.env.example` with the standard Studio variable names and explain which variables are for the hosted Studio versus the Next.js web app.
- Keep the standalone `studio/` workspace and root embedded Studio configs consistent.

## Expected changes

- Refactor shared env resolution to prioritize `SANITY_STUDIO_*` and then fall back to `NEXT_PUBLIC_*`.
- Update root `sanity.cli.ts` to use the same resolution and fail with a clear variable-specific message.
- Simplify `studio/env.ts` to use Sanity’s `SANITY_STUDIO_*` convention while preserving local fallback behavior.
- Update `.env.example` only with variable names/placeholders and no values.
- Do not modify application data access semantics or any secret-token handling.

## Acceptance criteria

- `sanity build` and `sanity deploy` can resolve project ID and dataset when `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` are set.
- Existing local configuration using `NEXT_PUBLIC_SANITY_*` still resolves.
- Missing configuration produces a clear error naming the supported variables.
- Studio build passes and root lint passes.
- No secret is logged, committed, or exposed to browser code.

## Checks

1. Run Studio build with `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` supplied as shell variables without printing values.
2. Run the Studio build with only the existing local fallback variables if available.
3. Run root lint and a focused TypeScript check for the env/config files.
4. Confirm no seed files or secrets changed.

## Deployment instructions

From `studio/`, set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` in the Sanity/CI deployment environment, set `SANITY_AUTH_TOKEN` only for CI deployment authentication, then run `npx sanity deploy`. The values are build-time configuration; changing them requires a new deployment.
