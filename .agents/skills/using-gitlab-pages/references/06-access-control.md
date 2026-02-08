# GitLab Pages Access Control

> Source: https://docs.gitlab.com/user/project/pages/pages_access_control/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## Overview

Pages access control restricts who can view your Pages site. When enabled, only authenticated project members (at least Guest role) can access the website by default.

## Prerequisites

- Administrator must enable [access control feature](https://docs.gitlab.com/administration/pages/#access-control) (enabled by default on GitLab.com)

## Enable Access Control

1. Navigate to **Settings > General**
2. Expand **Visibility, project features, permissions**
3. Toggle **Pages** to enable access control
4. Select visibility level
5. Select **Save changes**

**Note**: Changes use caching and may take up to a minute to take effect.

## Visibility Options

### Private Projects

| Option | Who Can Access |
|--------|----------------|
| Only project members | Project members only |
| Everyone | Anyone (logged in or not) |

### Internal Projects

| Option | Who Can Access |
|--------|----------------|
| Only project members | Project members only |
| Everyone with access | Any logged-in GitLab user (external users need membership) |
| Everyone | Anyone (logged in or not) |

### Public Projects

| Option | Who Can Access |
|--------|----------------|
| Only project members | Project members only |
| Everyone with access | Anyone (logged in or not) |

## SAML SSO Support

> Introduced in GitLab 18.2, generally available in GitLab 18.5

When [SAML SSO](https://docs.gitlab.com/user/group/saml_sso/) is configured for the group and access control is enabled, users must authenticate via SSO before accessing the website.

## Group-Level Access Control

> Introduced in GitLab 17.9

Remove the public visibility option for all projects in a group:

1. Navigate to group **Settings > General**
2. Expand **Permissions and group features**
3. Under **Pages public access**, check **Remove public access**
4. Select **Save changes**

When enabled:
- Projects in the group lose "Everyone" visibility option
- Applies to all subgroups
- Restricted to "project members" or "everyone with access"

**Prerequisites**:
- Public access not disabled at instance level
- Owner role for the group

## API Authentication

> Introduced in GitLab 17.10

Authenticate against restricted Pages sites using access tokens:

```shell
curl --header "Authorization: Bearer <your_access_token>" <published_pages_url>
```

### Supported Token Types

- Personal access tokens
- Project access tokens
- Group access tokens
- OAuth 2.0 tokens

All require `read_api` scope.

### Response Codes

- Valid token with access: Normal response
- Invalid/unauthorized token: `404` error

## User Experience

When access control is enabled and a user visits the site:

1. User is presented with GitLab sign-in page
2. User authenticates
3. GitLab verifies project membership
4. Site content is displayed (or 404 if no access)

## Terminating Pages Session

Users can sign out of Pages by revoking the application token:

1. Go to user avatar > **Edit profile**
2. Select **Applications**
3. In **Authorized applications**, find **GitLab Pages**
4. Select **Revoke**

## Instance-Level Public Access

Administrators can [disable public access](https://docs.gitlab.com/administration/pages/#disable-public-access-to-all-pages-sites) for all Pages sites on the instance.

When disabled:
- Projects lose "Everyone" visibility option
- All projects restricted to members or authenticated users

## Caching Behavior

- Access control changes are cached
- Cache typically invalidates within 1 minute
- During cache period, old settings remain active
