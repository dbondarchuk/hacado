# AI package layout

- `@hacado/ai-core` - abstract providers, models, usage, rate-limit, cache, image, Hacado business context (`loadBusinessContext`, `selectBusinessSlice`)
- `@hacado/ai-builder-core` - document adapters, discovery, ops, tools, orchestration, client
- `@hacado/ai-builder-page` - page/footer adapter, prompts, style catalog, patterns
- `@hacado/ai-builder-email` - email adapter, prompts, quality gate
- `@hacado/ai-builder-text-message` - SMS/text-message adapter, prompts, quality gate (settings-only)

Admin wires surface adapters/prompts and runs `runBuilderAIOrchestrator` from `@hacado/ai-builder-core`.
