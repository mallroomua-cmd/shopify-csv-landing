---
name: ukrainian-ecommerce-audit-ops
description: Ukrainian e-commerce compliance, logistics protocols, Nova Poshta integration, Monobank IBAN flows, and blackout resilience standards.
---

# Ukrainian E-Commerce Audit & Operational Standards (11/10 Edition)

This skill codifies the operational, legal, and logistic requirements for running a top-tier e-commerce store in Ukraine.

## 1. Legal & Regulatory Compliance
- **State Language Law (Art. 30):** Default language must be Ukrainian. All UI elements, descriptions, notices, and communications in Ukrainian.
- **Consumer Protection Law & Cabinet Resolution No. 172:** Clear policy regarding cosmetic and hygiene goods, with transparent guarantees for defects and transit damage.
- **FOP Requisites & Public Offer:** Accessible legal terms, FOP name, IBAN, and contacts.

## 2. Logistics & Nova Poshta Integration
- **Direct TTN Tracking:** Automatic TTN generation, one-click copy, and live links to `novaposhta.ua/tracking/?cargo_number=...`.
- **Branch & Locker Picker:** Support for 25,000+ branches and 24/7 parcel lockers (Поштомати).
- **Same-Day Dispatch:** Cutoff at 17:00 with real-time countdown.

## 3. Financial Infrastructure
- **Cash on Delivery (Накладений платіж):** Standard payment method without advance deposit.
- **Monobank & IBAN Direct:** Official IBAN requisites with 1-click clipboard copy, QR code support, and direct app deep-linking.

## 4. Blackout & Offline Resilience
- **IndexedDB Client Storage:** Zero reliance on remote servers for browsing.
- **Outbox Queue Worker:** Failed or offline orders are queued in IndexedDB and automatically retransmitted when connection is restored.
