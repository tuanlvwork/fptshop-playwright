# Project Configuration and Aliases

## 🛠️ Path Aliases

We use path aliases to ensure clean imports and easy refactoring. Instead of deep relative paths (e.g. `../../utils/auth`), use the `@` aliases.

### Verified Aliases

| Alias | Path | Purpose |
|-------|------|---------|
| `@/*` | `src/*` | Root source access |
| `@pages/*` | `src/pages/*` | Page Objects |
| `@steps/*` | `src/steps/*` | Cucumber Step Definitions |
| `@support/*` | `src/support/*` | Support code (World, Hooks) |
| `@config/*` | `src/config/*` | Configuration files |
| `@utils/*` | `src/utils/*` | General utilities |
| `@utils/auth/*` | `src/utils/auth/*` | Auth utilities |
| `@utils/diagnostics/*` | `src/utils/diagnostics/*` | Diagnostics tools |
| `@utils/reporting/*` | `src/utils/reporting/*` | Reporting helpers |
| `@utils/common/*` | `src/utils/common/*` | Common helpers |

### Usage Examples

**❌ Bad (Relative)**
```typescript
import { CustomWorld } from '../../support/custom-world';
import { performLogin } from '../../utils/auth/saucedemo/auth-helper';
```

**✅ Good (Aliased)**
```typescript
import { CustomWorld } from '@support/custom-world';
import { performLogin } from '@utils/auth/saucedemo/auth-helper';
```

## 🔧 IDE Configuration

Code navigation (Go to Definition) works automatically in VS Code thanks to `tsconfig.json`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@pages/*": ["src/pages/*"],
      // ...
    }
  }
}
```

## 📦 Adding New Aliases

1. Update `tsconfig.json` paths
2. Verify with `npx tsc --noEmit`
