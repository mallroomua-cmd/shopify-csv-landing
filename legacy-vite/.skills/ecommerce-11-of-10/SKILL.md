---
name: ecommerce-11-of-10
description: Ukrainian E-Commerce Perfection Framework (CRO, Nova Poshta, Social Proof, and High-Conversion Checkout for Shopify CSV Storefronts).
---

# Ukrainian E-Commerce 11/10 Standard

This skill establishes the golden standard for high-performance Ukrainian storefronts:

1. **Frictionless Nova Poshta UX:**
   - Always provide interactive city selection (major hubs + live search).
   - Differentiate clearly between standard branches (відділення) and 24/7 parcel lockers (поштомати).
   - Auto-persist delivery preferences in `localStorage` for returning buyers.

2. **Skincare Derm-Categorization & Routine Bundling:**
   - Guide shoppers by skin concern (Acne, Hydration, Barrier, Anti-age, Tone) and actives (Centella, Niacinamide, Snail Mucin, Retinol).
   - Provide 1-click routine upsells in CartDrawer to maximize Average Order Value (AOV).

3. **Live Social Proof & Urgency:**
   - Display non-intrusive live order notifications ("Оксана з Києва щойно замовила...").
   - Highlight dispatch cut-off timer ("Сьогодні о 18:00") and zero prepay guarantee.

4. **Technical Cleanliness & Resilience:**
   - Offline Outbox via IndexedDB.
   - XSS sanitization & Telegram HTML escaping (`escTelegramHtml`).
   - Zero-overhead bundle splitting for admin & policy modules.
