---
title: "Bun Spawn"
description: "Spawn child processes with Bun.spawn() and Bun.spawnSync()"
type: "api-reference"
tags: ["bun", "spawn", "child-process", "subprocess", "ipc", "terminal", "pty"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Spawn Documentation"
    url: "https://bun.sh/docs/runtime/child-process"
related:
  - "../README.md"
  - "./shell.md"
  - "./workers.md"
author: "unknown"
contributors: []
---

# Bun Spawn

Spawn child processes with `Bun.spawn()` or `Bun.spawnSync()`. ([Bun Docs][1])

## Spawn a Process

Provide a command as an array of strings:

```typescript
const proc = Bun.spawn(["bun", "--version"]);
console.log(await proc.exited); // 0
```

### Configuration Options

```typescript
const proc = Bun.spawn(["bun", "--version"], {
  cwd: "./path/to/subdir",           // working directory
  env: { ...process.env, FOO: "bar" }, // environment variables
  onExit(proc, exitCode, signalCode, error) {
    // exit handler
  },
});

proc.pid; // process ID of subprocess
```

## Input Stream

Configure the subprocess input with the `stdin` parameter:

```typescript
const proc = Bun.spawn(["cat"], {
  stdin: await fetch("https://example.com/data.txt"),
});

const text = await proc.stdout.text();
```

### stdin Options

| Value | Description |
|-------|-------------|
| `null` | **Default.** No input |
| `"pipe"` | Return a `FileSink` for incremental writing |
| `"inherit"` | Inherit parent's stdin |
| `Bun.file()` | Read from file |
| `TypedArray \| DataView` | Binary buffer as input |
| `Response` | Response body as input |
| `Request` | Request body as input |
| `ReadableStream` | Stream as input |
| `Blob` | Blob as input |
| `number` | File descriptor |

### Incremental Writing with Pipe

```typescript
const proc = Bun.spawn(["cat"], {
  stdin: "pipe",
});

proc.stdin.write("hello");
proc.stdin.write(new TextEncoder().encode(" world!"));
proc.stdin.flush();
proc.stdin.end();
```

### ReadableStream as Input

```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello from ");
    controller.enqueue("ReadableStream!");
    controller.close();
  },
});

const proc = Bun.spawn(["cat"], {
  stdin: stream,
  stdout: "pipe",
});

const output = await proc.stdout.text();
console.log(output); // "Hello from ReadableStream!"
```

## Output Streams

Read results via `stdout` and `stderr` properties:

```typescript
const proc = Bun.spawn(["bun", "--version"]);
const text = await proc.stdout.text();
console.log(text); // => "1.3.3\n"
```

### stdout/stderr Options

| Value | Description |
|-------|-------------|
| `"pipe"` | **Default for stdout.** Pipe to `ReadableStream` |
| `"inherit"` | **Default for stderr.** Inherit from parent |
| `"ignore"` | Discard output |
| `Bun.file()` | Write to file |
| `number` | Write to file descriptor |

## Exit Handling

### onExit Callback

```typescript
const proc = Bun.spawn(["bun", "--version"], {
  onExit(proc, exitCode, signalCode, error) {
    // exit handler
  },
});
```

### Exited Promise

```typescript
const proc = Bun.spawn(["bun", "--version"]);

await proc.exited;       // resolves when process exits
proc.killed;             // boolean — was process killed?
proc.exitCode;           // null | number
proc.signalCode;         // null | "SIGTERM" | ...
```

### Killing a Process

```typescript
proc.kill();           // default signal
proc.kill(15);         // signal code
proc.kill("SIGTERM");  // signal name
```

### Detaching from Parent

```typescript
const proc = Bun.spawn(["bun", "--version"]);
proc.unref(); // parent can exit while child runs
```

## Resource Usage

Get resource usage after process exits:

```typescript
const proc = Bun.spawn(["bun", "--version"]);
await proc.exited;

const usage = proc.resourceUsage();
console.log(`Max memory: ${usage.maxRSS} bytes`);
console.log(`CPU time (user): ${usage.cpuTime.user} µs`);
console.log(`CPU time (system): ${usage.cpuTime.system} µs`);
```

## AbortSignal

Abort a subprocess using an `AbortSignal`:

```typescript
const controller = new AbortController();

const proc = Bun.spawn({
  cmd: ["sleep", "100"],
  signal: controller.signal,
});

// Later
controller.abort();
```

## Timeout and killSignal

Auto-terminate after a specific duration:

```typescript
const proc = Bun.spawn({
  cmd: ["sleep", "10"],
  timeout: 5000,           // 5 seconds
  killSignal: "SIGKILL",   // signal to send (default: SIGTERM)
});

await proc.exited; // resolves after 5 seconds
```

## maxBuffer (spawnSync only)

Limit output bytes before killing:

```typescript
const result = Bun.spawnSync({
  cmd: ["yes"],
  maxBuffer: 100,
});
// process exits after 100 bytes of output
```

## Inter-Process Communication (IPC)

Direct communication between Bun processes:

### Parent Process

```typescript
const child = Bun.spawn(["bun", "child.ts"], {
  ipc(message, childProc) {
    console.log("From child:", message);
    childProc.send("Response to child");
  },
});

child.send("Hello from parent");
```

### Child Process

```typescript
// child.ts
process.send("Hello from child");
process.send({ message: "Object message" });

process.on("message", message => {
  console.log("From parent:", message);
});
```

### Serialization Options

- `"advanced"` (default): JSC serialize API, supports `structuredClone` types
- `"json"`: JSON.stringify/parse, required for Bun ↔ Node.js IPC

```typescript
// For Bun ↔ Node.js communication
const child = Bun.spawn({
  cmd: ["node", "script.js"],
  serialization: "json",
  ipc(message) { /* ... */ },
});
```

### Disconnect IPC

```typescript
childProc.disconnect();
```

## Terminal (PTY) Support

Spawn with a pseudo-terminal for interactive applications (POSIX only):

```typescript
const proc = Bun.spawn(["bash"], {
  terminal: {
    cols: 80,
    rows: 24,
    data(terminal, data) {
      process.stdout.write(data);
    },
  },
});

proc.terminal.write("echo hello\n");
await proc.exited;
proc.terminal.close();
```

### Terminal Options

| Option | Description | Default |
|--------|-------------|---------|
| `cols` | Number of columns | `80` |
| `rows` | Number of rows | `24` |
| `name` | Terminal type | `"xterm-256color"` |
| `data` | Data callback | — |
| `exit` | PTY close callback | — |
| `drain` | Ready for data callback | — |

### Terminal Methods

```typescript
proc.terminal.write("echo hello\n");     // Write data
proc.terminal.resize(120, 40);            // Resize
proc.terminal.setRawMode(true);           // Raw mode
proc.terminal.ref() / proc.terminal.unref();
proc.terminal.close();                    // Close
```

### Reusable Terminal

```typescript
await using terminal = new Bun.Terminal({
  cols: 80,
  rows: 24,
  data(term, data) { process.stdout.write(data); },
});

const proc1 = Bun.spawn(["echo", "first"], { terminal });
await proc1.exited;

const proc2 = Bun.spawn(["echo", "second"], { terminal });
await proc2.exited;
// Terminal closed automatically by `await using`
```

## Blocking API (Bun.spawnSync)

Synchronous equivalent of `Bun.spawn`:

```typescript
const proc = Bun.spawnSync(["echo", "hello"]);

console.log(proc.stdout.toString()); // => "hello\n"
console.log(proc.success);           // true if exit code 0
console.log(proc.exitCode);          // number
```

Differences from async API:
- `success` property for zero exit code check
- `stdout`/`stderr` are `Buffer` instead of `ReadableStream`
- No `stdin` property

**Use cases**:
- `Bun.spawn`: HTTP servers and apps
- `Bun.spawnSync`: Command-line tools

## Benchmarks

Bun uses `posix_spawn(3)` under the hood. `spawnSync` is **60% faster** than Node.js:

| Runtime | Time |
|---------|------|
| Bun | 888.14 µs |
| Node.js | 1.47 ms |

---

[1]: https://bun.sh/docs/runtime/child-process "Bun Spawn Documentation"
