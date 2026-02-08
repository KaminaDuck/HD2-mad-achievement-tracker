---
title: "PowerSync Collection"
description: "Real-time sync with SQLite via PowerSync for offline-first apps"
type: "integration-guide"
tags: ["tanstack", "db", "powersync-collection", "powersync", "sqlite", "offline-first", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "PowerSync Collection Docs"
    url: "https://tanstack.com/db/latest/docs/collections/powersync-collection"
  - name: "PowerSync Official Site"
    url: "https://www.powersync.com/"
related: ["../query/guide.md", "../electric/guide.md", "../../concepts.md", "../../frameworks/react/guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# PowerSync Collection

PowerSync collections provide seamless integration between TanStack DB and [PowerSync](https://powersync.com/), enabling automatic synchronization between your in-memory TanStack DB collections and PowerSync's SQLite database. This gives you offline-ready persistence, real-time sync capabilities, and powerful conflict resolution. ([PowerSync Collection Docs][1])

## Overview

The `@tanstack/powersync-db-collection` package allows you to create collections that: ([PowerSync Collection Docs][1])

- Automatically mirror the state of an underlying PowerSync SQLite database
- Reactively update when PowerSync records change
- Support optimistic mutations with rollback on error
- Provide persistence handlers to keep PowerSync in sync with TanStack DB transactions
- Use PowerSync's efficient SQLite-based storage engine
- Work with PowerSync's real-time sync features for offline-first scenarios
- Leverage PowerSync's built-in conflict resolution and data consistency guarantees
- Enable real-time synchronization with PostgreSQL, MongoDB and MySQL backends

## 1. Installation

Install the PowerSync collection package along with your preferred framework integration. PowerSync works with Web, React Native and Node.js.

```bash
npm install @tanstack/powersync-db-collection @powersync/web @journeyapps/wa-sqlite
```

## 2. Create a PowerSync Database and Schema

```typescript
import { Schema, Table, column } from "@powersync/web"

// Define your schema
const APP_SCHEMA = new Schema({
  documents: new Table({
    name: column.text,
    author: column.text,
    created_at: column.text,
    archived: column.integer,
  }),
})

// Initialize PowerSync database
const db = new PowerSyncDatabase({
  database: {
    dbFilename: "app.sqlite",
  },
  schema: APP_SCHEMA,
})
```

## 3. (Optional) Configure Sync with a Backend

```typescript
import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from "@powersync/web"

class Connector implements PowerSyncBackendConnector {
  fetchCredentials: () => Promise<PowerSyncCredentials | null>

  /** Upload local changes to the app backend.
   *
   * Use AbstractPowerSyncDatabase.getCrudBatch to get a batch of changes to upload.
   * Any thrown errors will result in a retry after the configured wait period (default: 5 seconds).
   */
  uploadData: (database: AbstractPowerSyncDatabase) => Promise<void>
}

// Configure the client to connect to a PowerSync service and your backend
db.connect(new Connector())
```

## 4. Create a TanStack DB Collection

There are multiple ways to create a collection: using type inference or using schema validation.

### Option 1: Using Table Type Inference

Types are automatically inferred from the PowerSync schema table definition:

```typescript
import { createCollection } from "@tanstack/react-db"
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection"

const documentsCollection = createCollection(
  powerSyncCollectionOptions({
    database: db,
    table: APP_SCHEMA.props.documents,
  })
)

// Types are automatically inferred
type DocumentCollectionInput = {
  id: string
  name: string | null
  author: string | null
  created_at: string | null // SQLite TEXT
  archived: number | null // SQLite integer
}
```

### SQLite Type Mapping

| PowerSync Column Type | TypeScript Type | Description |
| --- | --- | --- |
| column.text | string \| null | Text values, strings, JSON, dates (as ISO strings) |
| column.integer | number \| null | Integer values, also used for booleans (0/1) |
| column.real | number \| null | Floating point numbers |

Note: All PowerSync column types are nullable by default. ([PowerSync Collection Docs][1])

### Option 2: SQLite Types with Schema Validation

Add additional validations with a custom schema:

```typescript
import { z } from "zod"

const schema = z.object({
  id: z.string(),
  name: z.string().min(3, { message: "Should be at least 3 characters" }),
  author: z.string(),
  created_at: z.string(),
  archived: z.number(),
})

const documentsCollection = createCollection(
  powerSyncCollectionOptions({
    database: db,
    table: APP_SCHEMA.props.documents,
    schema,
    onDeserializationError: (error) => {
      // Handle fatal error - synced data failed validation
    },
  })
)
```

### Option 3: Transform SQLite to Rich Output Types

Transform SQLite types to richer JavaScript types (like Date objects):

```typescript
const schema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)), // Convert to Date
  archived: z
    .number()
    .nullable()
    .transform((val) => (val != null ? val > 0 : null)), // Convert to boolean
})

const documentsCollection = createCollection(
  powerSyncCollectionOptions({
    database: db,
    table: APP_SCHEMA.props.documents,
    schema,
    onDeserializationError: (error) => {
      // Handle fatal error
    },
    // Optional: custom column serialization
    serializer: {
      created_at: (value) => (value ? value.toISOString() : null),
    },
  })
)

// Input types (for mutations)
type DocumentInput = {
  id: string
  name: string | null
  created_at: string | null // SQLite TEXT
  archived: number | null
}

// Output types (from queries)
type DocumentOutput = {
  id: string
  name: string | null
  created_at: Date | null // JS Date instance
  archived: boolean | null // JS boolean
}
```

### Option 4: Custom Input/Output Types with Deserialization

Completely decouple input and output types from SQLite types:

```typescript
// Schema for rich input types
const schema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string(),
  created_at: z.date(), // Accept Date objects as input
  archived: z.boolean(), // Accept Booleans as input
})

// Schema to transform from SQLite types to output types
const deserializationSchema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string(),
  created_at: z.string().transform((val) => new Date(val)),
  archived: z.number().transform((val) => val > 0),
})

const documentsCollection = createCollection(
  powerSyncCollectionOptions({
    database: db,
    table: APP_SCHEMA.props.documents,
    schema,
    deserializationSchema,
    onDeserializationError: (error) => {
      // Handle fatal error
    },
  })
)
```

## Features

### Offline-First

PowerSync collections are offline-first by default. All data is stored locally in a SQLite database, allowing your app to work without an internet connection. Changes are automatically synced when connectivity is restored. ([PowerSync Collection Docs][1])

### Real-Time Sync

When connected to a PowerSync backend, changes are automatically synchronized in real-time across all connected clients: ([PowerSync Collection Docs][1])

- Bi-directional sync with the server
- Conflict resolution
- Queue management for offline changes
- Automatic retries on connection loss

### Optimistic Updates

Updates are applied optimistically to the local state first, then synchronized with PowerSync and the backend. If an error occurs during sync, the changes are automatically rolled back.

## Configuration Options

Configuration interface for PowerSync collections: ([PowerSync Collection Docs][1])

```typescript
interface PowerSyncCollectionConfig<TTable extends Table, TSchema> {
  // Required options
  database: PowerSyncDatabase
  table: Table

  // Schema validation and type transformation
  schema?: StandardSchemaV1
  deserializationSchema?: StandardSchemaV1 // Required for custom input types
  onDeserializationError?: (error: StandardSchemaV1.FailureResult) => void

  // Optional custom serialization
  serializer?: {
    [Key in keyof TOutput]?: (value: TOutput[Key]) => SQLiteCompatibleType
  }

  // Performance tuning
  syncBatchSize?: number // Control batch size for initial sync, defaults to 1000
}
```

## Advanced Transactions

For more control over transaction handling, use PowerSync's transaction system with TanStack DB transactions: ([PowerSync Collection Docs][1])

```typescript
import { createTransaction } from "@tanstack/react-db"
import { PowerSyncTransactor } from "@tanstack/powersync-db-collection"

// Create a transaction that won't auto-commit
const batchTx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    // Use PowerSyncTransactor to apply the transaction to PowerSync
    await new PowerSyncTransactor({ database: db }).applyTransaction(
      transaction
    )
  },
})

// Perform multiple operations in the transaction
batchTx.mutate(() => {
  for (let i = 0; i < 5; i++) {
    documentsCollection.insert({
      id: crypto.randomUUID(),
      name: `Document ${i}`,
      content: `Content ${i}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
})

// Commit the transaction
await batchTx.commit()

// Wait for persistence confirmation
await batchTx.isPersisted.promise
```

This approach allows you to:
- Batch multiple operations into a single transaction
- Control when the transaction is committed
- Ensure all operations are atomic
- Wait for persistence confirmation

## Complete Example

```typescript
import { Schema, Table, column, PowerSyncDatabase } from "@powersync/web"
import { createCollection, useLiveQuery } from "@tanstack/react-db"
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection"
import { z } from "zod"

// Define PowerSync schema
const APP_SCHEMA = new Schema({
  tasks: new Table({
    title: column.text,
    due_date: column.text,
    completed: column.integer,
  }),
})

// Initialize database
const db = new PowerSyncDatabase({
  database: { dbFilename: "app.sqlite" },
  schema: APP_SCHEMA,
})

// Define rich types schema
const taskSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  due_date: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  completed: z
    .number()
    .nullable()
    .transform((val) => (val != null ? val > 0 : null)),
})

// Create collection
const tasksCollection = createCollection(
  powerSyncCollectionOptions({
    database: db,
    table: APP_SCHEMA.props.tasks,
    schema: taskSchema,
  })
)

// Use in component
function TaskList() {
  const { data: tasks } = useLiveQuery((q) =>
    q.from({ task: tasksCollection })
      .where(({ task }) => !task.completed)
      .orderBy(({ task }) => task.due_date, 'asc')
  )

  const addTask = (title: string) => {
    tasksCollection.insert({
      id: crypto.randomUUID(),
      title,
      due_date: new Date().toISOString(),
      completed: 0,
    })
  }

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>
          {task.title} - {task.due_date?.toLocaleDateString()}
        </div>
      ))}
    </div>
  )
}
```

## Learn More

- [PowerSync Documentation](https://docs.powersync.com/)
- [PowerSync Quickstart](https://docs.powersync.com/installation/quickstart-guide)
- [Optimistic Mutations](../concepts.md)
- [Live Queries](../concepts.md)

## References

[1]: https://github.com/TanStack/db/blob/main/docs/collections/powersync-collection.md "TanStack DB PowerSync Collection Documentation"
