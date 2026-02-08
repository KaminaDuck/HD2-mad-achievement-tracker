# GitLab Pages Parallel Deployments

> Source: https://docs.gitlab.com/user/project/pages/parallel_deployments/

## Availability

- **Tiers**: Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

> Generally available in GitLab 17.9

## Overview

Parallel deployments publish multiple versions of your Pages site simultaneously. Each version has a unique URL based on a path prefix you specify.

## Use Cases

- Test changes in development branches before merging
- Share working previews with stakeholders
- Maintain documentation for multiple software versions
- Publish localized content for different audiences
- Create staging environments for review

## Create Parallel Deployment

### Basic Configuration

```yaml
pages:
  stage: deploy
  script:
    - echo "Pages accessible through ${CI_PAGES_URL}"
  pages:
    path_prefix: "$CI_COMMIT_BRANCH"
```

### Path Prefix Rules

The `path_prefix` value:
- Converted to lowercase
- Can contain: numbers (`0-9`), letters (`a-z`), periods (`.`)
- Other characters replaced with hyphens (`-`)
- Leading/trailing hyphens and periods removed
- Maximum 63 bytes (trimmed if longer)

### Dynamic Prefixes with Variables

```yaml
pages:
  pages:
    path_prefix: "mr-$CI_MERGE_REQUEST_IID"  # Results in mr-123
```

### Expiring Deployments

```yaml
pages:
  pages:
    path_prefix: "$CI_COMMIT_BRANCH"
    expire_in: 1 week
```

Default expiration: 24 hours

## Access URLs

### With Unique Domain

`https://project-abc123.gitlab.io/your-prefix`

### Without Unique Domain

`https://namespace.gitlab.io/project/your-prefix`

## Example

Project: `https://gitlab.example.com/namespace/project`

Branch: `username/testing_feature`

Path prefix: `$CI_COMMIT_BRANCH`

Resulting prefix: `username-testing-feature`

### Access URL

- Unique domain: `https://project-123456.gitlab.io/username-testing-feature`
- Standard: `https://namespace.gitlab.io/project/username-testing-feature`

## Limits

Parallel deployments are limited by root-level namespace:

- **GitLab.com**: See [Other limits](https://docs.gitlab.com/user/gitlab_com/#other-limits)
- **Self-Managed**: See [Instance limits](https://docs.gitlab.com/administration/instance_limits/#number-of-parallel-pages-deployments)

To reduce active deployments:
- Delete deployments manually
- Configure `expire_in` for automatic cleanup

## Expiration

- Default: 24 hours
- Configurable per-job with `pages.expire_in`
- Self-hosted: Admin can [configure default](https://docs.gitlab.com/administration/pages/#configure-the-default-expiry-for-parallel-deployments)
- To prevent expiration: `expire_in: never`

## Path Clash Prevention

Avoid prefixes that match existing folder names:

```plaintext
Site structure:
/index.html
/documents/index.html

path_prefix: documents  # CLASH! Overrides /documents/
```

### Mitigation Strategies

Add unique prefixes to reduce clash risk:

```yaml
pages:
  variables:
    PAGES_PREFIX: ""
  pages:
    path_prefix: "$PAGES_PREFIX"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    - if: $CI_COMMIT_BRANCH == "staging"
      variables:
        PAGES_PREFIX: '_stg'
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
      variables:
        PAGES_PREFIX: 'mr-$CI_MERGE_REQUEST_IID'
```

### Example Prefixes

- `mr-$CI_COMMIT_REF_SLUG` → `mr-branch-name`
- `_${CI_MERGE_REQUEST_IID}_` → `_123_`

## Environment Integration

Create Pages environments for UI visibility:

```yaml
deploy-pages:
  script:
    - npm run build
  variables:
    PAGES_PREFIX: ""
  pages:
    path_prefix: "$PAGES_PREFIX"
  environment:
    name: "Pages ${PAGES_PREFIX}"
    url: $CI_PAGES_URL
  rules:
    - if: $CI_COMMIT_BRANCH == "staging"
      variables:
        PAGES_PREFIX: '_stg'
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
      variables:
        PAGES_PREFIX: 'mr-$CI_MERGE_REQUEST_IID'
```

Benefits:
- Deployments visible in project environment list
- Can [group similar environments](https://docs.gitlab.com/ci/environments/#group-similar-environments)

## Auto-Clean

Parallel deployments created by merge requests are automatically deleted when:
- MR is merged
- MR is closed

## Redirects with Parallel Deployments

Redirects use absolute paths. Adapt `_redirects` for parallel deployments:

```plaintext
# Primary deployment
/will-redirect.html /redirected.html 302

# Parallel deployments (catch with splat)
/*/will-redirect.html /:splat/redirected.html 302
```

## Full CI/CD Example

```yaml
deploy-pages:
  stage: deploy
  script:
    - npm ci
    - npm run build
  variables:
    PAGES_PREFIX: ""
  pages:
    publish: dist
    path_prefix: "$PAGES_PREFIX"
  environment:
    name: "Pages ${PAGES_PREFIX}"
    url: $CI_PAGES_URL
  rules:
    # Main branch - no prefix
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
    # Staging branch
    - if: $CI_COMMIT_BRANCH == "staging"
      variables:
        PAGES_PREFIX: '_staging'
    # Merge requests - manual with expiration
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: manual
      variables:
        PAGES_PREFIX: 'mr-$CI_MERGE_REQUEST_IID'
```
