# dog-walking-web

The walker's app: a SvelteKit site on Cloudflare Workers where a solo dog
walker keeps their clients, the clients' dogs, and the walks they schedule,
start, complete or cancel. It is a **consumer** of two specified services and
owns none of their contracts.

## The three repos

| repo | role |
| --- | --- |
| [dog-walking-spec](https://github.com/dataGriff/dog-walking-spec) | the contracts of record: OpenAPI, AsyncAPI, Gherkin features and data contracts for the `clients` and `walks` services, gated with [sysspec](https://github.com/hungovercoders/sysspec) |
| [dog-walking-api](https://github.com/dataGriff/dog-walking-api) | the implementation of both services (Hono on Workers, D1, Queues) |
| **dog-walking-web** (this) | the UI, built against the pinned contracts and their mocks |

`contracts.lock` names the released contract surface this app is built
against (`clients/v1.0.0`, `walks/v1.0.0`, with the commit sha of each).
`task contracts:fetch` resolves it into read-only `.contracts/<service>/`;
`task types:generate` turns the pinned OpenAPI into the TypeScript under
`src/lib/api/generated/`, which is committed so the app builds without the
fetch and CI fails when it drifts. Renovate bumps the lock when the spec repo
tags a new version; green minors auto-merge.

## Sign-in

Every page except `/sign-in` and `/sign-up` needs a session. Sign-in is
[Clerk](https://clerk.com) via `svelte-clerk`: the server hook authenticates
each request, load functions take the session token and send it to the API
as `Authorization: Bearer <token>`. The API, not this app, decides what the
walker may see.

## Run it locally

```sh
npm install
cp .env.example .env            # fill in the values below
npm run dev                     # http://localhost:5173
```

| variable | what |
| --- | --- |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (dashboard → API keys) |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `API_BASE_URL` | where the SvelteKit server reaches dog-walking-api, e.g. `http://localhost:8787` |
| `API_DEV_BEARER` | optional. When set, Clerk is bypassed and this literal token is sent to the API. The API accepts `Bearer test:<walker_id>` in its test auth mode, so `API_DEV_BEARER=test:walker-anna` runs the whole UI with no Clerk account. Never set in production. |

`npm run preview` runs the built Worker under `wrangler dev`, reading
`.dev.vars` (see `.dev.vars.example`) instead of `.env`.

## Checks

```sh
npm run check        # svelte-check
npx vitest run       # unit tests for the pure helpers
npm run build
task contracts:verify   # all of the above plus the types drift check
```

`tests/mocks.test.ts` exercises the generated clients against the spec
repo's Microcks mocks and is skipped unless `MOCKS_BASE_URL` is set. With
Docker:

```sh
task contracts:fetch
task mocks:up                                     # loads both services' mocks
MOCKS_BASE_URL=http://localhost:8585/rest npx vitest run tests
task mocks:down
```

## Deploy

`.github/workflows/deploy.yml` builds and runs `wrangler deploy` on every
push to `main`. It needs the repository secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. The Worker itself needs:

- `CLERK_SECRET_KEY` as a secret: `npx wrangler secret put CLERK_SECRET_KEY`
- `PUBLIC_CLERK_PUBLISHABLE_KEY` and `API_BASE_URL` as vars (edit
  `wrangler.jsonc` or set them in the dashboard)

Add the deployed hostname to the Clerk application's allowed origins.

## Layout

```
contracts.lock            pinned contract versions + shas
Taskfile.yml              contracts:fetch, types:generate, types:check, contracts:verify, mocks:*
src/lib/api/              generated types, openapi-fetch clients, Problem and date helpers
src/lib/server/api.ts     per-request authenticated clients
src/hooks.server.ts       Clerk handler + route guard (or the API_DEV_BEARER shortcut)
src/routes/               /, /clients, /clients/[client_id], /dogs/[dog_id], /walks, /walks/new, /walks/[walk_id]
tests/mocks.test.ts       the mock-backed contract check
```
