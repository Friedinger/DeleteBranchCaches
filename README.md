# Delete Branch Caches

A GitHub Action to delete all caches associated with a specific branch reference in your repository.

## Features

-   Deletes all GitHub Actions caches for a given branch (`ref`)
-   Useful for cleaning up storage and avoiding stale caches

## Usage

Add the following step to your workflow:

```yaml
- name: Delete branch caches
  uses: Friedinger/DeleteBranchCaches@v1
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

| Name         | Description                                                  | Required | Default               |
| ------------ | ------------------------------------------------------------ | -------- | --------------------- |
| github-token | GitHub token to use for authentication                       | true     | `${{ github.token }}` |
| ref          | The branch ref to delete caches for (e.g. `refs/heads/main`) | true     | `${{ github.ref }}`   |

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
        uses: Friedinger/DeleteBranchCaches@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ref: ${{ github.ref }}
```

## Development

Build the action:

```sh
npm install
npm run build
```

## License

MIT License © 2025 Friedinger
