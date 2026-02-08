# GitLab Pages Overview

> Source: https://docs.gitlab.com/user/project/pages/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## What is GitLab Pages?

GitLab Pages publishes static websites directly from a repository in GitLab.

### Key Features

- Deploy automatically with GitLab CI/CD pipelines
- Support any static site generator (Hugo, Jekyll, Gatsby, Middleman, Harp, Hexo, Brunch)
- Support plain HTML, CSS, JavaScript, and WebAssembly
- Run on GitLab-provided infrastructure at no additional cost
- Connect with custom domains and SSL/TLS certificates
- Control access through built-in authentication
- Scale reliably for personal, business, or project documentation sites

### Limitations

- Dynamic server-side processing (`.php`, `.asp`) is **not supported**
- Pages are static only

## Requirements

To deploy a website with GitLab Pages:

1. **Domain**: Know the Pages domain for your instance (ask your administrator for self-managed)
2. **CI/CD**: A `.gitlab-ci.yml` file with a job using `pages: true`
3. **Runner**: GitLab Runner enabled for the project

## GitLab.com Specifics

On GitLab.com:

- Default Pages domain: `gitlab.io`
- Custom domains and TLS support enabled
- Instance runners provided for free
- You can bring your own runner if preferred

## Project Types

Pages can be hosted in:

- **Public projects**: Accessible to everyone
- **Internal projects**: Accessible to authenticated users
- **Private projects**: Accessible to project members only

Projects can belong to:
- Individual users
- Groups
- Subgroups

## Getting Started Options

| Method | Description |
|--------|-------------|
| [GitLab UI](https://docs.gitlab.com/user/project/pages/getting_started/pages_ui/) | Add Pages to existing project with simple UI setup |
| [From Scratch](https://docs.gitlab.com/user/project/pages/getting_started/pages_from_scratch/) | Create and configure your own CI file |
| [CI/CD Template](https://docs.gitlab.com/user/project/pages/getting_started/pages_ci_cd_template/) | Use pre-populated CI template |
| [Fork Sample](https://docs.gitlab.com/user/project/pages/getting_started/pages_forked_sample_project/) | Fork an already-configured sample |
| [Project Template](https://docs.gitlab.com/user/project/pages/getting_started/pages_new_project_template/) | Create from a Pages template |

## Security Considerations

### Namespace Cookies

If your username contains a dot (e.g., `bar.example`), it creates a subdomain of another user's Pages site. When setting cookies with JavaScript:

```javascript
// Safe: Cookie only visible to example.gitlab.io
document.cookie = "key=value";

// Unsafe: Cookie visible to subdomains
document.cookie = "key=value;domain=.example.gitlab.io";
```

### Shared Cookies

By default, projects in a group share the same domain and cookies. Enable **unique domains** to isolate cookies per project.

## Unique Domains

> Introduced in GitLab 15.9, enabled by default since GitLab 15.11

Unique domains provide isolated URLs to prevent cookie sharing:

- Standard: `namespace.gitlab.io/project`
- Unique: `project-abc123.gitlab.io`

To disable:
1. Go to **Deploy > Pages**
2. Clear **Use unique domain**
3. Save changes

## Primary Domain

> Introduced in GitLab 17.8

When using custom domains, you can set a primary domain that redirects all other domains with a `308 Permanent Redirect`.

## Expiring Deployments

> Introduced in GitLab 17.4

Configure automatic deletion of deployments:

```yaml
deploy-pages:
  stage: deploy
  script:
    - npm run build
  pages:
    expire_in: 1 week
```

Expired deployments are stopped by a cron job every 10 minutes.

## User-Defined Job Names

> Generally available in GitLab 17.6

You can use any job name with `pages: true`:

```yaml
my-custom-pages-job:
  script:
    - npm run build
  pages: true
```

Or disable Pages for a job named `pages`:

```yaml
pages:
  pages: false
```
