# Delete Branch Caches

<a href="https://github.com/Friedinger/DeleteBranchCaches/releases"><img alt="Release" src="https://img.shields.io/github/v/release/Friedinger/DeleteBranchCaches"></a>
<a href="https://github.com/Friedinger/DeleteBranchCaches/actions/workflows/test-action.yml"><img alt="Build" src="https://github.com/Friedinger/DeleteBranchCaches/actions/workflows/test-action.yml/badge.svg"></a>
<a href="https://github.com/Friedinger/DeleteBranchCaches/commits/main"><img alt="Last Commit" src="https://img.shields.io/github/last-commit/Friedinger/DeleteBranchCaches"></a>

A GitHub Action to delete all caches associated with a specific branch reference in your repository.

## Features

-   Deletes all GitHub Actions caches for a given branch (`ref`)
-   Useful for cleaning up storage and avoiding stale caches

## Usage

Add the following step to your workflow:

```yaml
- name: Delete branch caches
  uses: Friedinger/DeleteBranchCaches@v2
  with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      ref: ${{ github.ref }}
```

**Note:** Your workflow or job must include the following permissions:

```yaml
permissions:
    actions: write
```

This is required to allow the action to delete caches.

## Inputs

| Name            | Description                                                                                           | Required | Default               |
| --------------- | ----------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| github-token    | GitHub token to use for authentication                                                                | true     | `${{ github.token }}` |
| ref             | The branches ref to delete caches for (e.g. `refs/heads/main`), can be a single string or a yaml list | true     | `${{ github.ref }}`   |
| fail-on-warning | Fail the action if a warning occurs during cache deletion                                             | false    | `false`               |

#### Notes

-   You can leave out both inputs to use the default values, which will delete caches for the current branch of the workflow.
-   But it is recommended to always specify the `github-token` input for clarity and to avoid issues with permissions.

### Input options for `ref`

You can provide the `ref` input in several ways, depending on your use case and YAML syntax. All of the following variants are supported:

#### Single branch ref

```yaml
ref: refs/heads/main
```

#### Multiple branch refs as YAML list

```yaml
ref: |
    refs/heads/branch-1
    refs/heads/branch-2
```

#### Multiple branch refs as array in string

```yaml
ref: "['refs/heads/branch-1', 'refs/heads/branch-2']"
```

#### Notes

-   The action automatically detects the format and processes all variants correctly.
-   For lists, the YAML list or array syntax is recommended for best readability.
-   Sadly, directly passing an array like `ref: [refs/heads/branch-1, refs/heads/branch-2]` does not work due to GitHub only supporting strings for inputs.

## Example Workflow

```yaml
name: Clean up caches

on:
  push:
    branches:
      - main

jobs:
  cleanup:
    runs-on: ubuntu-latest

  permissions:
      actions: write

    steps:
      - uses: actions/checkout@v4

      - name: Delete branch caches
        uses: Friedinger/DeleteBranchCaches@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ref: ${{ github.ref }}
          fail-on-warning: true
```

## Development

Build the action:

```sh
npm install
npm run build
```

## License

MIT License © 2025 Friedinger
