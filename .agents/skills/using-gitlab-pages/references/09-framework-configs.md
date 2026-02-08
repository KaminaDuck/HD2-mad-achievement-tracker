# GitLab Pages Framework Configurations

> Source: https://docs.gitlab.com/user/project/pages/public_folder/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## Overview

GitLab Pages publishes from the `public/` folder by default. Many frameworks use different output directories. This guide shows how to configure popular frameworks.

> **Note**: Since GitLab 16.1, you can use `pages.publish` in `.gitlab-ci.yml` to specify a custom output directory without changing framework configuration.

## Using pages.publish (Recommended)

Instead of configuring the framework, specify the output directory in CI:

```yaml
deploy-pages:
  script:
    - npm run build
  pages:
    publish: dist  # or build, out, etc.
```

## Framework-Specific Configurations

### Eleventy

#### Option 1: CLI Flag

```shell
npx @11ty/eleventy --input=path/to/sourcefiles --output=public
```

#### Option 2: Config File

```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  return {
    dir: {
      output: "public"
    }
  }
};
```

### Astro

Astro uses `public/` for static assets, which conflicts with Pages.

1. Rename static folder:
   ```shell
   mv public static
   ```

2. Configure `astro.config.mjs`:
   ```javascript
   import { defineConfig } from 'astro/config';

   export default defineConfig({
     // Output build to public/ for GitLab Pages
     outDir: 'public',
     // Static assets now in static/
     publicDir: 'static',
   });
   ```

### SvelteKit

SvelteKit requires `adapter-static` for GitLab Pages:

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'public'
    })
  }
};
```

### Next.js

Next.js requires static HTML export for Pages.

#### Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,  // Required for static export
  },
  assetPrefix: "https://namespace.gitlab.io/project/"
}

module.exports = nextConfig
```

#### CI/CD

```yaml
deploy-pages:
  before_script:
    - npm install
  script:
    - npm run build
    - mv out/* public
  pages: true
```

### Nuxt.js

Nuxt uses `public/` for static assets, which conflicts with Pages.

1. Rename static folder:
   ```shell
   mv public static
   ```

2. Configure `nuxt.config.js`:
   ```javascript
   export default {
     target: 'static',
     generate: {
       dir: 'public'
     },
     dir: {
       public: 'static'  // Renamed static assets folder
     }
   }
   ```

3. Configure for [Static Site Generation](https://nuxt.com/docs/getting-started/deployment#static-hosting)

### Vite

```javascript
// vite.config.js
export default {
  build: {
    outDir: 'public'
  }
}
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  output: {
    path: __dirname + '/public'
  }
};
```

### Hugo

Hugo outputs to `public/` by default. No configuration needed.

```yaml
deploy-pages:
  image: registry.gitlab.com/pages/hugo:latest
  script:
    - hugo
  pages: true
```

### Jekyll

Jekyll outputs to `_site/` by default.

#### Option 1: CLI Flag

```yaml
deploy-pages:
  script:
    - jekyll build -d public
  pages: true
```

#### Option 2: Config

```yaml
# _config.yml
destination: public
```

### Gatsby

Gatsby outputs to `public/` by default. No configuration needed.

```yaml
deploy-pages:
  script:
    - gatsby build
  pages: true
```

## Should You Commit the public/ Folder?

**Usually no.** The CI/CD pipeline should generate `public/` during the build.

```yaml
deploy-pages:
  script:
    - npm run build  # Creates public/
  pages: true        # Publishes public/ as artifact
```

**Alternative**: If building locally, you can commit `public/` and skip the build step:

```yaml
deploy-pages:
  script:
    - echo "Using pre-built public folder"
  pages: true
```

## Common CI/CD Patterns

### Node.js Generic

```yaml
deploy-pages:
  image: node:20
  script:
    - npm ci
    - npm run build
  pages:
    publish: dist  # Adjust to your framework's output
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### With Cache

```yaml
deploy-pages:
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  pages:
    publish: dist
```

### Multiple Framework Detection

```yaml
deploy-pages:
  script:
    - |
      if [ -f "package.json" ]; then
        npm ci && npm run build
      elif [ -f "Gemfile" ]; then
        bundle install && bundle exec jekyll build -d public
      elif command -v hugo &> /dev/null; then
        hugo
      fi
  pages: true
```
