# 🐶 Git Hooks (Husky)

This project uses [husky](https://github.com/typicode/husky) to automatically enforce code quality checks before git actions.

## 🪝 Hooks Configured

### `pre-commit`
**Runs:** `npm run type-check` (TypeScript validation)
**Purpose:** Blocks commits that have type errors or broken imports (e.g., using `@` aliases incorrectly).
**When:** Every time you run `git commit`.

### `pre-push`
**Runs:** `npm run test:cucumber -- --dry-run`
**Purpose:** Blocks pushes if test configuration is invalid (missing steps, syntax errors in features).
**When:** Every time you run `git push`.

## ⏭️ Bypassing Hooks

In an emergency (e.g., WIP commits), you can bypass hooks:

```bash
git commit -m "wip" --no-verify
git push --no-verify
```

## 🛠️ Troubleshooting

If hooks aren't running:
1. Run `npm install` (this runs the `prepare` script to setup husky)
2. Ensure files in `.husky/` are executable: `chmod +x .husky/*`
