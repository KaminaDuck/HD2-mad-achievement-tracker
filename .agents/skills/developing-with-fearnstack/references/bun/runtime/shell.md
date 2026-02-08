---
title: "Bun Shell"
description: "Cross-platform bash-like shell scripting with JavaScript interop"
type: "api-reference"
tags: ["bun", "shell", "scripting", "bash", "cross-platform", "commands"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Shell Documentation"
    url: "https://bun.sh/docs/runtime/shell"
related:
  - "../README.md"
  - "./spawn.md"
  - "./environment-variables.md"
author: "unknown"
contributors: []
---

# Bun Shell

Bun Shell makes shell scripting with JavaScript & TypeScript fun. It's a cross-platform bash-like shell with seamless JavaScript interop. ([Bun Docs][1])

## Quickstart

```typescript
import { $ } from "bun";

const response = await fetch("https://example.com");

// Use Response as stdin
await $`cat < ${response} | wc -c`; // 1256
```

## Features

- **Cross-platform**: Works on Windows, Linux & macOS without extra dependencies
- **Familiar**: Bash-like syntax with redirection, pipes, environment variables
- **Globs**: Native support for `**`, `*`, `{expansion}`, and more
- **Template literals**: Easy interpolation of variables and expressions
- **Safety**: Escapes all strings by default, preventing shell injection
- **JavaScript interop**: Use `Response`, `ArrayBuffer`, `Blob`, `Bun.file()` as stdin/stdout/stderr
- **Shell scripting**: Run `.bun.sh` files directly
- **Custom interpreter**: Written in Zig with its own lexer, parser, and interpreter

## Getting Started

### Basic Usage

```typescript
import { $ } from "bun";

await $`echo "Hello World!"`; // Hello World!
```

### Quiet Output

```typescript
await $`echo "Hello World!"`.quiet(); // No output
```

### Get Output as Text

```typescript
// .text() automatically calls .quiet()
const welcome = await $`echo "Hello World!"`.text();
console.log(welcome); // Hello World!\n
```

### Get Raw Output

```typescript
const { stdout, stderr } = await $`echo "Hello!"`.quiet();

console.log(stdout); // Buffer(7) [ 72, 101, 108, 108, 111, 33, 10 ]
console.log(stderr); // Buffer(0) []
```

## Error Handling

Non-zero exit codes throw by default:

```typescript
try {
  const output = await $`something-that-may-fail`.text();
} catch (err) {
  console.log(`Failed with code ${err.exitCode}`);
  console.log(err.stdout.toString());
  console.log(err.stderr.toString());
}
```

### Disable Throwing

```typescript
const { stdout, stderr, exitCode } = await $`something-that-may-fail`
  .nothrow()
  .quiet();

if (exitCode !== 0) {
  console.log(`Non-zero exit code ${exitCode}`);
}
```

### Global Configuration

```typescript
$.nothrow(); // Disable throwing globally
$.throws(true); // Re-enable (default)
$.throws(false); // Same as $.nothrow()
```

## Redirection

### Redirect Operators

| Operator | Description |
|----------|-------------|
| `<` | Redirect stdin |
| `>` or `1>` | Redirect stdout |
| `2>` | Redirect stderr |
| `&>` | Redirect both stdout and stderr |
| `>>` | Redirect stdout (append) |
| `2>>` | Redirect stderr (append) |
| `&>>` | Redirect both (append) |
| `1>&2` | Redirect stdout to stderr |
| `2>&1` | Redirect stderr to stdout |

### Redirect to JavaScript Objects

```typescript
const buffer = Buffer.alloc(100);
await $`echo "Hello World!" > ${buffer}`;
console.log(buffer.toString()); // Hello World!\n
```

Supported types: `Buffer`, `Uint8Array`, `ArrayBuffer`, `Bun.file()`

### Redirect from JavaScript Objects

```typescript
const response = new Response("hello i am a response body");
const result = await $`cat < ${response}`.text();
console.log(result); // hello i am a response body
```

Supported types: `Buffer`, `Uint8Array`, `ArrayBuffer`, `Bun.file()`, `Response`

### File Redirection Examples

```typescript
// stdin from file
await $`cat < myfile.txt`;

// stdout to file
await $`echo bun! > greeting.txt`;

// stderr to file
await $`bun run index.ts 2> errors.txt`;

// stderr to stdout
await $`bun run ./index.ts 2>&1`;

// stdout to stderr
await $`bun run ./index.ts 1>&2`;
```

## Piping

```typescript
const result = await $`echo "Hello World!" | wc -w`.text();
console.log(result); // 2\n

// With JavaScript objects
const response = new Response("hello i am a response body");
const result2 = await $`cat < ${response} | wc -w`.text();
console.log(result2); // 6\n
```

## Command Substitution

Use `$(...)` to substitute command output:

```typescript
// Print commit hash
await $`echo Hash of current commit: $(git rev-parse HEAD)`;

// Use in shell variables
await $`
  REV=$(git rev-parse HEAD)
  docker built -t myapp:$REV
  echo Done building docker image "myapp:$REV"
`;
```

**Note**: Use `$(...)` syntax instead of backticks for command substitution.

## Environment Variables

### Setting Variables

```typescript
await $`FOO=foo bun -e 'console.log(process.env.FOO)'`; // foo\n

// With interpolation (safely escaped)
const foo = "bar123";
await $`FOO=${foo + "456"} bun -e 'console.log(process.env.FOO)'`; // bar123456\n
```

### Changing Environment for Single Command

```typescript
await $`echo $FOO`.env({ ...process.env, FOO: "bar" }); // bar
```

### Global Environment Configuration

```typescript
$.env({ FOO: "bar" });
await $`echo $FOO`; // bar

// Override locally
await $`echo $FOO`.env({ FOO: "baz" }); // baz

// Reset to default
$.env({ FOO: "bar" });
await $`echo $FOO`.env(undefined); // ""
```

### Changing Working Directory

```typescript
await $`pwd`.cwd("/tmp"); // /tmp

// Global default
$.cwd("/tmp");
await $`pwd`; // /tmp
await $`pwd`.cwd("/"); // /
```

## Reading Output

### As Text

```typescript
const result = await $`echo "Hello World!"`.text();
```

### As JSON

```typescript
const result = await $`echo '{"foo": "bar"}'`.json();
console.log(result); // { foo: "bar" }
```

### Line by Line

```typescript
for await (let line of $`echo "Hello World!"`.lines()) {
  console.log(line); // Hello World!
}

// Or on completed command
const search = "bun";
for await (let line of $`cat list.txt | grep ${search}`.lines()) {
  console.log(line);
}
```

### As Blob

```typescript
const result = await $`echo "Hello World!"`.blob();
console.log(result); // Blob(13) { size: 13, type: "text/plain" }
```

## Builtin Commands

Cross-platform builtins (no PATH lookup needed):

| Command | Status |
|---------|--------|
| `cd` | Implemented |
| `ls` | Implemented |
| `rm` | Implemented |
| `echo` | Implemented |
| `pwd` | Implemented |
| `bun` | Implemented |
| `cat` | Implemented |
| `touch` | Implemented |
| `mkdir` | Implemented |
| `which` | Implemented |
| `mv` | Partial (missing cross-device) |
| `exit` | Implemented |
| `true` | Implemented |
| `false` | Implemented |
| `yes` | Implemented |
| `seq` | Implemented |
| `dirname` | Implemented |
| `basename` | Implemented |

## Utilities

### $.braces (Brace Expansion)

```typescript
await $.braces(`echo {1,2,3}`);
// => ["echo 1", "echo 2", "echo 3"]
```

### $.escape (Escape Strings)

```typescript
console.log($.escape('$(foo) `bar` "baz"'));
// => \$(foo) \`bar\` \"baz\"
```

### Raw Strings (No Escaping)

```typescript
await $`echo ${{ raw: '$(foo) `bar` "baz"' }}`;
// => bun: command not found: foo
// => bun: command not found: bar
// => baz
```

## .sh File Loader

Run shell scripts directly with Bun:

```bash
# script.sh
echo "Hello World! pwd=$(pwd)"
```

```bash
bun ./script.sh
# Hello World! pwd=/home/demo
```

Works cross-platform including Windows.

## Security

Bun Shell does not invoke a system shell (`/bin/sh`) - it's a re-implementation designed with security in mind.

### Command Injection Protection

Interpolated variables are treated as single, literal strings:

```typescript
const userInput = "my-file.txt; rm -rf /";

// SAFE: userInput is treated as a single string
await $`ls ${userInput}`;
// Tries to read directory named "my-file; rm -rf /"
```

### Security Considerations

When spawning a new shell (e.g., `bash -c`), Bun's protections no longer apply:

```typescript
const userInput = "world; touch /tmp/pwned";

// UNSAFE: bash interprets the string
await $`bash -c "echo ${userInput}"`;
// The touch command will execute!
```

### Argument Injection

External commands interpret their own arguments - sanitize user input:

```typescript
// Malicious input formatted as a Git flag
const branch = "--upload-pack=echo pwned";

// UNSAFE: git sees and acts on the malicious flag
await $`git ls-remote origin ${branch}`;
```

**Recommendation**: Always sanitize user-provided input before passing to external commands.

## Implementation Notes

Bun Shell is a small programming language written in Zig with:
- Handwritten lexer, parser, and interpreter
- Concurrent operation execution (unlike bash/zsh)

---

[1]: https://bun.sh/docs/runtime/shell "Bun Shell Documentation"
