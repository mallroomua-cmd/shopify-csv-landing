# TOOLING

| Инструмент | Где | Зачем |
|---|---|---|
| ui-ux-pro-max v2.13.0 (MIT) | `.claude/skills/ui-ux-pro-max` | Дизайн-система, UX-правила, a11y-чеклист. Локальный поиск по CSV, без сети |
| Встроенные доки Next 16 | `node_modules/next/dist/docs` | Актуальные API (вместо Context7 — экономия) |
| Встроенный браузер Claude | — | Визуальная проверка, Lighthouse вручную |
| `gh` CLI | система | PR, CI |

Не ставили (экономия токенов, нет пользы сейчас): Context7, Playwright MCP, GitHub MCP, Vercel MCP, сторонние SEO-скиллы.
Удалено из репо: `.skills/` (формат Gemini, Claude не читает) — в `legacy-vite/`.
