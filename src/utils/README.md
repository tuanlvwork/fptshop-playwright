# Utils Directory

Utility functions and helpers organized by functional area.

## 📁 Structure

```
src/utils/
├── auth/               # Authentication & session management
├── diagnostics/        # Test diagnostics & monitoring  
├── reporting/          # Allure & report helpers
└── common/             # Shared utilities
```

---

## 🔐 Auth (`auth/`)

Authentication, session management, and file locking utilities.

### `file-lock.ts`
**Purpose**: File locking to prevent race conditions  
**Used by**: Lazy login implementation  
**Key exports**: `FileLock`

### `lock-metrics.ts`
**Purpose**: Collect and analyze lock performance metrics  
**Used by**: Test hooks (AfterAll)  
**Key exports**: `LockMetricsCollector`

### `saucedemo/auth-helper.ts`
**Purpose**: SauceDemo-specific authentication helper  
**Used by**: Auth step definitions  
**Key exports**: `performLogin`

---

## 📊 Diagnostics (`diagnostics/`)

Test diagnostics, monitoring, and failure analysis.

### `diagnostics.ts`
**Purpose**: Central diagnostics orchestration  
**Used by**: Test hooks  
**Key exports**: `getDiagnostics`, `DiagnosticsService`

### `console-capture.ts`
**Purpose**: Capture browser console logs & errors  
**Used by**: Diagnostics service  
**Key exports**: `ConsoleCapture`

### `network-logger.ts`
**Purpose**: Log network requests, detect slow/failed requests  
**Used by**: Diagnostics service  
**Key exports**: `NetworkLogger`

### `performance-tracker.ts`
**Purpose**: Track step execution times  
**Used by**: Diagnostics service  
**Key exports**: `PerformanceTracker`

---

## 📝 Reporting (`reporting/`)

Allure reporting and test report helpers.

### `allure.ts`
**Purpose**: Allure reporting wrapper & utilities  
**Used by**: Step definitions for nested step reporting  
**Key exports**: `allure` (wrapped instance)

### `allure-helpers.ts`
**Purpose**: Generate Allure environment & executor info  
**Used by**: Test hooks (BeforeAll)  
**Key exports**: `generateAllureEnvironment`, `generateAllureExecutor`

---

## 🛠️ Common (`common/`)

Shared utility functions used across the framework.

### `retry.ts`
**Purpose**: Retry helpers for flaky operations  
**Used by**: Step definitions (navigation, interactions)  
**Key exports**: `retryNavigation`, `retryInteraction`

---

## 📐 Import Patterns

### From Steps

```typescript
// Auth utilities
import { FileLock } from '../../utils/auth/file-lock';
import { performLogin } from '../../utils/auth/saucedemo/auth-helper';

// Common utilities
import { retryNavigation } from '../../utils/common/retry';

// Diagnostics (usually not imported directly in steps)
```

### From Hooks

```typescript
// Diagnostics
import { getDiagnostics } from '../utils/diagnostics/diagnostics';

// Reporting
import { generateAllureEnvironment } from '../utils/reporting/allure-helpers';

// Auth metrics
import { LockMetricsCollector } from '../utils/auth/lock-metrics';
```

---

## 🎯 Design Principles

### 1. **Separation of Concerns**
Each category has a clear, focused purpose.

### 2. **Domain Isolation**
Domain-specific code (e.g., `saucedemo/`) is nested within functional areas.

### 3. **Reusability**
Common utilities (`common/`) are framework-agnostic.

###4. **Minimal Dependencies**
Each util has minimal external dependencies.

---

## 📝 Adding New Utilities

### 1. Choose the Right Category

- **Auth**: Authentication, sessions, locking
- **Diagnostics**: Monitoring, logging, analysis
- **Reporting**: Reports, Allure, screenshots
- **Common**: Generic helpers (retry, formatters)

### 2. Create the File

```bash
# Example: Add new retry helper
touch src/utils/common/my-helper.ts
```

### 3. Export Functions

```typescript
export function myHelper() {
    // implementation
}
```

### 4. Import Where Needed

```typescript
import { myHelper } from '../../utils/common/my-helper';
```

---

## 🔄 Migration from Old Structure

**Before**:
```
src/utils/
├── diagnostics.ts
├── file-lock.ts
├── retry.ts
└── saucedemo/
    └── auth-helper.ts
```

**After**:
```
src/utils/
├── auth/
│   ├── file-lock.ts
│   ├── lock-metrics.ts
│   └── saucedemo/auth-helper.ts
├── diagnostics/
│   ├── diagnostics.ts
│   ├── console-capture.ts
│   ├── network-logger.ts
│   └── performance-tracker.ts
├── reporting/
│   ├── allure.ts
│   └── allure-helpers.ts
└── common/
    └── retry.ts
```

---

## 📚 Related Documentation

- [Lazy Login Implementation](../../docs/lazy-login/LAZY_LOGIN_IMPLEMENTATION.md)
- [File Locking](../../docs/lazy-login/FILE_LOCKING_IMPLEMENTATION.md)
- [Lock Metrics](../../docs/lazy-login/LOCK_METRICS_CI_TESTING.md)
- [Scripts README](../../scripts/README.md)

---

**Last Updated**: 2025-12-27  
**Total Utilities**: 10 files  
**Categories**: 4
