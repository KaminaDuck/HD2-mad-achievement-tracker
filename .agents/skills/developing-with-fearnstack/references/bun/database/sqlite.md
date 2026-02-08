---
title: "Bun SQLite"
description: "Bun's native high-performance SQLite3 driver via bun:sqlite"
type: "api-reference"
tags: ["bun", "sqlite", "database", "bun:sqlite", "sql", "embedded-database"]
category: "typescript"
subcategory: "database"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun SQLite Documentation"
    url: "https://bun.sh/docs/runtime/sqlite"
related:
  - "../README.md"
  - "./sql.md"
  - "./redis.md"
author: "unknown"
contributors: []
---

# Bun SQLite

Bun natively implements a high-performance SQLite3 driver via the built-in `bun:sqlite` module. ([Bun Docs][1])

```typescript
import { Database } from "bun:sqlite";

const db = new Database(":memory:");
const query = db.query("select 'Hello world' as message;");
query.get(); // { message: "Hello world" }
```

## Features

- Transactions
- Parameters (named & positional)
- Prepared statements
- Datatype conversions (`BLOB` becomes `Uint8Array`)
- Map query results to classes without an ORM - `query.as(MyClass)`
- `bigint` support
- Multi-query statements in a single call to `database.run(query)`

## Performance

`bun:sqlite` is roughly **3-6x faster** than `better-sqlite3` and **8-9x faster** than `deno.land/x/sqlite` for read queries.

## Database

### Opening a Database

```typescript
import { Database } from "bun:sqlite";

// File-based database
const db = new Database("mydb.sqlite");

// In-memory database
const db = new Database(":memory:");
const db = new Database();
const db = new Database("");

// Read-only mode
const db = new Database("mydb.sqlite", { readonly: true });

// Create if doesn't exist
const db = new Database("mydb.sqlite", { create: true });
```

### Strict Mode

Throw errors on missing parameters and allow binding without prefixes:

```typescript
const strict = new Database(":memory:", { strict: true });

// Throws error because of typo:
const query = strict.query("SELECT $message;").all({ messag: "Hello world" });
```

### ES Module Import

Load a database via import attribute:

```typescript
import db from "./mydb.sqlite" with { type: "sqlite" };
console.log(db.query("select * from users LIMIT 1").get());
```

### Closing Database

```typescript
db.close(false); // Allow pending queries to finish
db.close(true);  // Throw error if pending queries
```

### Using Statement

Auto-close when block exits:

```typescript
{
  using db = new Database("mydb.sqlite");
  using query = db.query("select 'Hello world' as message;");
  console.log(query.get());
}
```

### Serialize/Deserialize

```typescript
const olddb = new Database("mydb.sqlite");
const contents = olddb.serialize(); // => Uint8Array
const newdb = Database.deserialize(contents);
```

## Statements

A `Statement` is a prepared query compiled into efficient binary form.

```typescript
const query = db.query(`select "Hello world" as message`);
```

### Parameter Types

```typescript
// Numerical parameters
const query = db.query(`SELECT ?1, ?2;`);

// Named parameters
const query = db.query(`SELECT $param1, $param2;`);
```

### Binding Values

```typescript
const query = db.query(`select $message;`);
query.all({ $message: "Hello world" });

// Positional
const query = db.query(`select ?1;`);
query.all("Hello world");
```

## Execution Methods

### .all()

Returns all results as array of objects:

```typescript
const query = db.query(`select $message;`);
query.all({ $message: "Hello world" });
// [{ message: "Hello world" }]
```

### .get()

Returns first result as object:

```typescript
const query = db.query(`select $message;`);
query.get({ $message: "Hello world" });
// { $message: "Hello world" }
```

### .run()

Returns execution metadata:

```typescript
const query = db.query(`create table foo;`);
query.run();
// { lastInsertRowid: 0, changes: 0 }
```

### .as(Class)

Map results to class instances:

```typescript
class Movie {
  title: string;
  year: number;

  get isMarvel() {
    return this.title.includes("Marvel");
  }
}

const query = db.query("SELECT title, year FROM movies").as(Movie);
const movies = query.all();
console.log(movies[0].isMarvel); // true
```

### .iterate()

Incrementally return results for large datasets:

```typescript
const query = db.query("SELECT * FROM foo");
for (const row of query.iterate()) {
  console.log(row);
}
```

### .values()

Returns results as arrays of arrays:

```typescript
const query = db.query(`select $message;`);
query.values({ $message: "Hello world" });
// [["Iron Man", 2008], ["The Avengers", 2012]]
```

## WAL Mode

Enable write-ahead log mode for better performance:

```typescript
db.run("PRAGMA journal_mode = WAL;");
```

## Integers

### Safe Integers

Return large integers as `bigint`:

```typescript
const db = new Database(":memory:", { safeIntegers: true });
const query = db.query(`SELECT ${BigInt(Number.MAX_SAFE_INTEGER) + 102n} as max_int`);
const result = query.get();
console.log(result.max_int); // 9007199254741093n
```

## Transactions

Execute multiple queries atomically:

```typescript
const insertCat = db.prepare("INSERT INTO cats (name) VALUES ($name)");
const insertCats = db.transaction(cats => {
  for (const cat of cats) insertCat.run(cat);
});

const count = insertCats([
  { $name: "Keanu" },
  { $name: "Salem" },
  { $name: "Crookshanks" }
]);
```

### Transaction Types

```typescript
insertCats(cats);           // uses "BEGIN"
insertCats.deferred(cats);  // uses "BEGIN DEFERRED"
insertCats.immediate(cats); // uses "BEGIN IMMEDIATE"
insertCats.exclusive(cats); // uses "BEGIN EXCLUSIVE"
```

## Extensions

```typescript
const db = new Database();
db.loadExtension("myext");
```

**MacOS Note:** Use Homebrew's vanilla SQLite build for extension support:

```typescript
Database.setCustomSQLite("/path/to/libsqlite.dylib");
```

## Datatypes

| JavaScript type | SQLite type |
|----------------|-------------|
| `string` | `TEXT` |
| `number` | `INTEGER` or `DECIMAL` |
| `boolean` | `INTEGER` (1 or 0) |
| `Uint8Array` | `BLOB` |
| `Buffer` | `BLOB` |
| `bigint` | `INTEGER` |
| `null` | `NULL` |

---

[1]: https://bun.sh/docs/runtime/sqlite "Bun SQLite Documentation"
