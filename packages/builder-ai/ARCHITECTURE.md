# Hacado Builder AI — Architecture

## Package

`@hacado/builder-ai` (`packages/builder-ai`) is the shared, provider-agnostic layer for AI assistance inside Hacado builders. It intentionally does **not** claim `@hacado/ai` or `/api/ai`, which are reserved for a future product-wide AI platform.

## Layers

1. **Provider abstraction** — `AIProvider` with `GatewayAIProvider` (Vercel AI Gateway via `@ai-sdk/gateway`), optional `OpenAIAIProvider`, and `MockAIProvider` for tests. The app does not need to be hosted on Vercel; only an AI Gateway API key is required.
2. **Model router** — task → configurable model/tier with optional escalation fallback. **We** choose the model; the gateway executes and bills it.
3. **Builder adapters** — `RegistryBuilderAIAdapter` over a live block/style catalog. Page/footer adapters merge core schemas with org-connected app blocks; email uses email schemas only.
4. **Discovery tools** — keyword search for blocks/styles; on-demand schema + hierarchy retrieval.
5. **Context assembler** — selective document, selection, and business context.
6. **Orchestrator** — tool loop, validation, limited correction/escalation, usage tracking.
7. **Operations** — proposals as native `EditorHistoryEntry` values; client apply with revision checks.

## Admin integration

- API: `apps/admin/src/app/api/builder-ai/{chat,capabilities}`
- Adapter factory: `apps/admin/src/lib/builder-ai/create-adapter.ts`
- UX: toolbar injections + assistant sidebar tab via `apps/admin/src/components/admin/builder-ai`

## Providers / models (defaults)

| Tier | Model | Gateway model id |
|------|-------|------------------|
| Economy | GPT-6 Luna | `openai/gpt-6-luna` |
| Standard | GPT-6.1 Terra | `openai/gpt-6.1-terra` |
| Premium | GPT-6.1 Terra (placeholder; remappable) | `openai/gpt-6.1-terra` |

Auth: `AI_GATEWAY_API_KEY`. Provider id: `BUILDER_AI_PROVIDER=gateway` (default). Optional direct OpenAI via `BUILDER_AI_PROVIDER=openai` + `OPENAI_API_KEY` (bare model ids like `gpt-6-luna`).

## Image generation

Gated by `BUILDER_AI_IMAGE_GENERATION_ENABLED` plus a registered `ImageGenerationProvider`. Disabled by default.

## Tests

`yarn workspace @hacado/builder-ai test`
