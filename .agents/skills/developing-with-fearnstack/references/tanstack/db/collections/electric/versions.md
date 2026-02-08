---
title: "Electric Collection Version Log"
description: "Version history for @tanstack/electric-db-collection"
type: "meta"
tags: ["changelog", "versions", "electric-collection"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/db/releases"
related: ["./README.md", "./guide.md"]
parent_reference: "./README.md"
current_version: "0.2.19"
---

# Electric Collection Version Log

**Package:** `@tanstack/electric-db-collection`
**Current Version:** 0.2.19
**Last Updated:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/db/releases)

---

## v0.2.19 (2025-12-22)

Sync performance fix.

- **Fixed:** Slow `onInsert` `awaitMatch` performance issue (#1062)
- Message buffer was being cleared between batches causing 3-5s timeouts
- Messages now preserved until MAX_BATCH_MESSAGES (1000)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Felectric-db-collection%400.2.19)

---

## v0.2.9 (2025-11-27)

Eager mode commit timing fix.

- **Fixed:** Eager mode incorrectly committing data on `snapshot-end` before receiving the first `up-to-date` message (#924)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Felectric-db-collection%400.2.9)

---

## v0.2.0 (2025-11-12)

Timeout support and array txid fix.

- **New:** Timeout support in `electricCollectionOptions` matching strategies (#798)
- **Fixed:** Array txid handling - returning `{ txid: [txid1, txid2] }` now works correctly (#795)
- **Fixed:** Handle predicates that are pushed down (#763)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Felectric-db-collection%400.2.0)
