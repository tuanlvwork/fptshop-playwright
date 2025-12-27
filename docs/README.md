# 📚 Documentation Index

This directory contains all project documentation organized by feature/topic.

## 📂 Directory Structure

```
docs/
├── lazy-login/              # Lazy login (session reuse) implementation
│   ├── LAZY_LOGIN_IMPLEMENTATION.md
│   ├── AUTH_MONITORING_GUIDE.md
│   ├── AUTH_RACE_MONITORING.md
│   └── MONITORING_IMPLEMENTATION_SUMMARY.md
│
├── allure-reporting/        # Allure report integration
│   └── ALLURE_SETUP_GUIDE.md
│
└── general/                 # General project documentation
    └── (future docs)
```

## 📖 Quick Links

### Lazy Login Implementation
- **[Implementation Guide](lazy-login/LAZY_LOGIN_IMPLEMENTATION.md)** - Core architecture and implementation
- **[Monitoring Guide](lazy-login/AUTH_MONITORING_GUIDE.md)** - How to monitor race conditions
- **[Race Monitoring](lazy-login/AUTH_RACE_MONITORING.md)** - Comprehensive monitoring system documentation
- **[Implementation Summary](lazy-login/MONITORING_IMPLEMENTATION_SUMMARY.md)** - Quick summary of monitoring features

### Allure Reporting
- **[Allure Setup Guide](allure-reporting/ALLURE_SETUP_GUIDE.md)** - Complete Allure integration documentation

## 🎯 Getting Started

### New to the Project?
1. Start with the main [README.md](../README.md)
2. Review [Lazy Login Implementation](lazy-login/LAZY_LOGIN_IMPLEMENTATION.md) to understand session reuse
3. Check [Allure Setup Guide](allure-reporting/ALLURE_SETUP_GUIDE.md) for reporting

### Implementing Lazy Login?
1. Read [LAZY_LOGIN_IMPLEMENTATION.md](lazy-login/LAZY_LOGIN_IMPLEMENTATION.md)
2. Set up monitoring with [AUTH_MONITORING_GUIDE.md](lazy-login/AUTH_MONITORING_GUIDE.md)
3. Use [AUTH_RACE_MONITORING.md](lazy-login/AUTH_RACE_MONITORING.md) as ongoing reference

### Setting up Allure?
1. Follow [ALLURE_SETUP_GUIDE.md](allure-reporting/ALLURE_SETUP_GUIDE.md)

## 🆕 Adding New Documentation

When adding new documentation:

1. **Choose the right category**:
   - Feature-specific → Create new subfolder (e.g., `docs/feature-name/`)
   - General → Place in `docs/general/`
   - Cross-cutting → Create appropriate folder

2. **File naming convention**:
   - Use UPPERCASE for main guides: `FEATURE_GUIDE.md`
   - Use descriptive names: `IMPLEMENTATION_DETAILS.md`
   - Include date for summaries: `SUMMARY_2025_12_27.md` (if applicable)

3. **Update this index**:
   - Add entry to directory structure
   - Add quick link in appropriate section
   - Update README.md if it's a major feature

## 📝 Documentation Standards

All documentation should include:

- **Clear title and purpose**
- **Table of contents** (for long docs)
- **Prerequisites** (if applicable)
- **Step-by-step instructions**
- **Examples and code samples**
- **Troubleshooting section**
- **Related documents** (cross-references)

## 🔍 Finding Documentation

Use these commands to search:

```bash
# Search all documentation
grep -r "keyword" docs/

# Search specific category
grep -r "keyword" docs/lazy-login/

# List all markdown files
find docs/ -name "*.md"
```

## 📅 Maintenance

- Review and update documentation when features change
- Archive outdated docs to `docs/archive/` (create if needed)
- Keep this index up-to-date

---

**Last Updated**: 2025-12-27  
**Maintainer**: Project Team
