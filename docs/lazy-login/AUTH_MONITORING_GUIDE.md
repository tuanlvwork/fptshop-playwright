# Auth Race Condition Monitoring Guide

This document explains how to monitor and detect race conditions in the Lazy Login implementation.

## Overview

The lazy login implementation now includes comprehensive logging to help detect race conditions when multiple workers try to create the same session file simultaneously.

## Log Format

All auth-related logs follow this format:
```
[ISO_TIMESTAMP] [PID:process_id] [role] Message
```

Example:
```
[2025-12-27T15:00:00.123Z] [PID:12345] [standard] Phase 1: Attempting to reuse session from auth/standard.json
```

## Log Events

### Phase 1 (Session Reuse)
- `Phase 1: Attempting to reuse session` - Worker is trying to load existing session
- `✅ Phase 1: Session reused successfully` - Session loaded and validated
- `❌ Phase 1: Session validation failed` - Session invalid (expired/corrupted)
- `❌ Phase 1: Session check failed` - Error during session check
- `ℹ️ Phase 1: No session file found` - No session exists, will create new

### Phase 2 (Fresh Login)
- `Phase 2: Starting fresh login` - Worker needs to create new session
- `⚠️ Phase 2: Performing UI login` - **CRITICAL**: UI login in progress
- `✅ Phase 2: Login completed` - Session created and saved (includes duration)

### Auth Helper
- `AuthHelper: Starting login for user` - Login process started
- `AuthHelper: Login successful` - Login validated
- `AuthHelper: Writing session to` - **CRITICAL**: File write in progress
- `AuthHelper: Session file written successfully` - File write complete (includes duration)

## How to Use

### 1. Run Tests with Logging

```bash
# Run tests and save logs to file
npm run test:cucumber 2>&1 | tee test.log

# Or run with verbose output
VERBOSE=true npm run test:cucumber 2>&1 | tee test.log
```

### 2. Analyze Logs for Race Conditions

```bash
# Analyze from log file
npm run analyze:auth-race test.log

# Or pipe directly from test run
npm run test:cucumber 2>&1 | npm run analyze:auth-race
```

### 3. Interpret Results

The analyzer will output:

```
=== Race Condition Analysis ===

Role: standard
  ✅ Session Reuses (Phase 1): 45
  🔄 Fresh Logins (Phase 2): 1

Role: problem
  ✅ Session Reuses (Phase 1): 12
  🔄 Fresh Logins (Phase 2): 1

=== Summary ===
Total session reuses: 57
Total fresh logins: 2
Session reuse rate: 96.6%

✅ No race conditions detected!
```

## Warning Signs

### 🚨 Race Condition Detected

If you see this output:
```
⚠️ POTENTIAL RACE CONDITIONS DETECTED: 2

Details:

1. Role: standard
   Worker 1 (PID 12345): 2025-12-27T15:00:00.123Z
   Worker 2 (PID 12346): 2025-12-27T15:00:00.456Z
   Time difference: 333ms
   ⚠️ Both workers attempted to create the same session file!

💡 Recommendation: Consider adding file locking for this role.
```

**This means**: Two workers tried to create the same session file within 5 seconds of each other.

**Action required**: If this happens frequently (>5% of test runs), implement file locking.

## Performance Metrics

### Expected Results (Healthy)
- **Session reuse rate**: 90-100% (only 1 login per role per test run)
- **Phase 2 duration**: 2000-5000ms (includes UI login + file save)
- **File write duration**: 10-100ms

### Problem Indicators
- **Low reuse rate** (<80%): Sessions expiring frequently or validation failing
- **Multiple Phase 2 for same role**: Possible race condition
- **High file write duration** (>500ms): I/O contention or slow disk

## Manual Log Inspection

You can also grep the logs manually:

```bash
# Find all Phase 2 logins for a specific role
grep "Phase 2: Performing UI login.*\[standard\]" test.log

# Find concurrent file writes
grep "AuthHelper: Writing session" test.log | sort

# Check session reuse rate for a role
grep "\[standard\].*Phase 1: Session reused successfully" test.log | wc -l
```

## Expected Behavior

### ✅ Normal (No Race Condition)
```
[T0] [PID:101] [standard] Phase 1: No session file found
[T0] [PID:101] [standard] Phase 2: Performing UI login
[T0] [PID:101] [standard] AuthHelper: Writing session to auth/standard.json
[T1] [PID:102] [standard] Phase 1: Attempting to reuse session
[T1] [PID:102] [standard] ✅ Phase 1: Session reused successfully
[T2] [PID:103] [standard] Phase 1: Attempting to reuse session
[T2] [PID:103] [standard] ✅ Phase 1: Session reused successfully
```
**Result**: 1 login, 2 reuses ✅

### ⚠️ Race Condition
```
[T0] [PID:101] [standard] Phase 1: No session file found
[T0] [PID:102] [standard] Phase 1: No session file found  ⚠️ Both checked before file existed
[T1] [PID:101] [standard] Phase 2: Performing UI login
[T1] [PID:102] [standard] Phase 2: Performing UI login    ⚠️ Both doing UI login
[T2] [PID:101] [standard] AuthHelper: Writing session...
[T2] [PID:102] [standard] AuthHelper: Writing session...  ⚠️ Both writing!
```
**Result**: 2 logins, possible file corruption ⚠️

## Troubleshooting

### High Phase 2 Count
**Problem**: Too many fresh logins instead of session reuse

**Possible causes**:
1. Session files are being deleted between test runs
2. Session validation is too strict
3. Sessions are expiring quickly

**Solutions**:
- Check if `auth/` is in `.gitignore` but files are preserved locally
- Review session validation logic
- Increase session lifetime on the application

### Race Conditions Detected
**Problem**: Multiple workers creating same session

**Solutions**:
1. Implement file locking (see `LAZY_LOGIN_IMPLEMENTATION.md` section 4.4)
2. Reduce parallel workers
3. Use role-worker mapping to ensure same role runs on same worker

### Low Reuse Rate in CI
**Problem**: CI shows <50% reuse rate

**Possible causes**:
1. `auth/` directory not cached between CI jobs
2. Fresh workspace for each test run

**Solutions**:
- Add `auth/` to CI cache configuration
- Accept first-run penalty, optimize for subsequent runs

## CI Integration

### GitHub Actions Example

```yaml
- name: Run Cucumber Tests
  run: npm run test:cucumber 2>&1 | tee cucumber-test.log

- name: Analyze Auth Race Conditions
  if: always()
  run: npm run analyze:auth-race cucumber-test.log

- name: Upload Race Analysis
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: auth-race-analysis
    path: cucumber-test.log
```

## Best Practices

1. **Always capture logs** when running parallel tests
2. **Run analysis weekly** to catch degradation trends
3. **Monitor reuse rate** - target >95%
4. **Set up alerts** if race conditions detected in CI
5. **Use verbose logs** when debugging specific issues

## Next Steps

If race conditions are detected frequently:
1. Review the race condition section in `LAZY_LOGIN_IMPLEMENTATION.md`
2. Implement file locking solution
3. Re-run analysis to verify fix
4. Document any custom solutions in this file
