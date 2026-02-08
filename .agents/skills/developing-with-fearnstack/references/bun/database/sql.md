---
title: "Bun SQL"
description: "Unified SQL API for PostgreSQL, MySQL, and SQLite with tagged template literals"
type: "api-reference"
tags: ["bun", "sql", "database", "postgresql", "mysql", "sqlite", "bun:sql"]
category: "typescript"
subcategory: "database"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun SQL Documentation"
    url: "https://bun.sh/docs/runtime/sql"
related:
  - "../README.md"
  - "./sqlite.md"
  - "./redis.md"
author: "unknown"
contributors: []
---

# Bun SQL

Bun provides native bindings for working with SQL databases through a unified Promise-based API that supports PostgreSQL, MySQL, and SQLite. ([Bun Docs][1])

```typescript
import { sql, SQL } from "bun";

// PostgreSQL (default)
const users = await sql`
  SELECT * FROM users
  WHERE active = ${true}
  LIMIT ${10}
`;

// With MySQL
const mysql = new SQL("mysql://user:pass@localhost:3306/mydb");
const mysqlResults = await mysql`SELECT * FROM users WHERE active = ${true}`;

// With SQLite
const sqlite = new SQL("sqlite://myapp.db");
const sqliteResults = await sqlite`SELECT * FROM users WHERE active = ${1}`;
```

## Features

- Tagged template literals to protect against SQL injection
- Transactions
- Named & positional parameters
- Connection pooling
- `BigInt` support
- SASL Auth support (SCRAM-SHA-256), MD5, and Clear Text
- Connection timeouts
- Binary protocol support
- TLS support

## Database Support

### PostgreSQL

Default when no specific adapter is detected:

```typescript
import { sql } from "bun";
await sql`SELECT ...`;

import { SQL } from "bun";
const pg = new SQL("postgres://user:pass@localhost:5432/mydb");
```

### MySQL

```typescript
const mysql = new SQL("mysql://user:password@localhost:3306/database");

// Or with options
const mysql = new SQL({
  adapter: "mysql",
  hostname: "localhost",
  port: 3306,
  database: "myapp",
  username: "dbuser",
  password: "secretpass",
});
```

### SQLite

```typescript
// In-memory database
const memory = new SQL(":memory:");
const memory2 = new SQL("sqlite://:memory:");

// File-based database
const sql1 = new SQL("sqlite://myapp.db");

// Using options object
const sql2 = new SQL({
  adapter: "sqlite",
  filename: "./data/app.db",
});
```

## Inserting Data

```typescript
// Basic insert
const [user] = await sql`
  INSERT INTO users (name, email)
  VALUES (${name}, ${email})
  RETURNING *
`;

// Using object helper
const userData = { name: "Alice", email: "alice@example.com" };
const [newUser] = await sql`INSERT INTO users ${sql(userData)} RETURNING *`;
```

### Bulk Insert

```typescript
const users = [
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
];
await sql`INSERT INTO users ${sql(users)}`;
```

### Column Selection

```typescript
const user = { name: "Alice", email: "alice@example.com", age: 25 };
await sql`INSERT INTO users ${sql(user, "name", "email")}`;
// Only inserts name and email columns
```

## Query Results

### Default (Objects)

```typescript
const users = await sql`SELECT * FROM users`;
// [{ name: "Alice", email: "alice@example.com" }, ...]
```

### .values() Format

Returns arrays instead of objects:

```typescript
const rows = await sql`SELECT * FROM users`.values();
// [["Alice", "alice@example.com"], ["Bob", "bob@example.com"]]
```

### .raw() Format

Returns Buffer arrays:

```typescript
const rows = await sql`SELECT * FROM users`.raw();
// [[Buffer, Buffer], [Buffer, Buffer]]
```

## SQL Fragments

### Dynamic Table Names

```typescript
await sql`SELECT * FROM ${sql("users")}`;
await sql`SELECT * FROM ${sql("public.users")}`;
```

### Conditional Queries

```typescript
const filterAge = true;
const minAge = 21;
const ageFilter = sql`AND age > ${minAge}`;
await sql`
  SELECT * FROM users
  WHERE active = ${true}
  ${filterAge ? ageFilter : sql``}
`;
```

### Dynamic Updates

```typescript
await sql`UPDATE users SET ${sql(user, "name", "email")} WHERE id = ${user.id}`;
```

### WHERE IN

```typescript
await sql`SELECT * FROM users WHERE id IN ${sql([1, 2, 3])}`;
```

### sql.array Helper (PostgreSQL)

```typescript
await sql`INSERT INTO tags (items) VALUES (${sql.array(["red", "blue", "green"])})`;
// ARRAY['red', 'blue', 'green']
```

## Simple Queries

Run multiple statements:

```typescript
await sql`
  SELECT 1;
  SELECT 2;
`.simple();
```

## Unsafe Queries

Execute raw SQL strings (use with caution):

```typescript
const result = await sql.unsafe(`SELECT ${userColumns} FROM users;`);
```

## Environment Variables

### Automatic Detection

- `mysql://...` → MySQL
- `sqlite://...`, `:memory:`, `file://...` → SQLite
- Everything else → PostgreSQL

### PostgreSQL Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Primary connection URL |
| `DATABASE_URL` | Alternative connection URL |
| `PGHOST` | Database host |
| `PGPORT` | Database port |
| `PGUSERNAME` | Database user |
| `PGPASSWORD` | Database password |
| `PGDATABASE` | Database name |

### MySQL Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_HOST` | `localhost` | Database host |
| `MYSQL_PORT` | `3306` | Database port |
| `MYSQL_USER` | `root` | Database user |
| `MYSQL_PASSWORD` | (empty) | Database password |
| `MYSQL_DATABASE` | `mysql` | Database name |

## Connection Options

### MySQL

```typescript
const sql = new SQL({
  adapter: "mysql",
  hostname: "localhost",
  port: 3306,
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 30,
  ssl: "prefer",
});
```

### PostgreSQL

```typescript
const sql = new SQL({
  hostname: "localhost",
  port: 5432,
  max: 20,
  tls: true,
});
```

### SQLite

```typescript
const sql = new SQL({
  adapter: "sqlite",
  filename: "./data/app.db",
  readonly: false,
  create: true,
  strict: true,
});
```

## Transactions

```typescript
await sql.begin(async tx => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
  await tx`UPDATE accounts SET balance = balance - 100 WHERE user_id = 1`;
});
```

### Savepoints

```typescript
await sql.begin(async tx => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;

  await tx.savepoint(async sp => {
    await sp`UPDATE users SET status = 'active'`;
    if (someCondition) {
      throw new Error("Rollback to savepoint");
    }
  });
});
```

### Distributed Transactions

```typescript
await sql.beginDistributed("tx1", async tx => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
});

// Later
await sql.commitDistributed("tx1");
// or
await sql.rollbackDistributed("tx1");
```

## Connection Pooling

```typescript
const sql = new SQL({
  max: 20,
  idleTimeout: 30,
  maxLifetime: 3600,
  connectionTimeout: 10,
});

await sql.close(); // Close all connections
await sql.close({ timeout: 5 }); // Wait 5 seconds
```

## Reserved Connections

```typescript
const reserved = await sql.reserve();
try {
  await reserved`INSERT INTO users (name) VALUES (${"Alice"})`;
} finally {
  reserved.release();
}

// Or with Symbol.dispose
{
  using reserved = await sql.reserve();
  await reserved`SELECT 1`;
}
```

## Error Handling

```typescript
import { SQL } from "bun";

try {
  await sql`SELECT * FROM users`;
} catch (error) {
  if (error instanceof SQL.PostgresError) {
    console.log(error.code, error.detail, error.hint);
  } else if (error instanceof SQL.SQLiteError) {
    console.log(error.code, error.errno);
  }
}
```

## Numbers and BigInt

Large numbers exceeding 53-bit range are returned as strings by default:

```typescript
const [{ x, y }] = await sql`SELECT 9223372036854777 as x, 12345 as y`;
console.log(typeof x, x); // "string" "9223372036854777"
console.log(typeof y, y); // "number" 12345

// Use BigInt instead
const sql = new SQL({ bigint: true });
const [{ x }] = await sql`SELECT 9223372036854777 as x`;
console.log(typeof x, x); // "bigint" 9223372036854777n
```

## MySQL Type Mapping

| MySQL Type | JavaScript Type |
|-----------|----------------|
| INT, TINYINT, MEDIUMINT | number |
| BIGINT | string, number or BigInt |
| DECIMAL, NUMERIC | string |
| FLOAT, DOUBLE | number |
| DATE, DATETIME, TIMESTAMP | Date |
| TIME | number (microseconds) |
| CHAR, VARCHAR, TEXT | string |
| JSON | object/array |
| BIT(1) | boolean |

---

[1]: https://bun.sh/docs/runtime/sql "Bun SQL Documentation"
