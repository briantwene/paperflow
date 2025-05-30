---
"paperflow": major
---

# Migrate from Tauri v1 to v2

This is a major release that migrates the application from Tauri v1 to Tauri v2.

## Changes Made

- Updated Tauri dependencies from v1 to v2:
  - `tauri` from `1.8.1` to `2.2.0`
  - `tauri-build` from `1.5.5` to `2.0.4`
- Migrated `WindowUrl` to `WebviewUrl` API
- Migrated `WindowBuilder` to `WebviewWindowBuilder` API  
- Added `tiny_http` dependency for OAuth server functionality
- Updated all deprecated Tauri v1 APIs to v2 equivalents

## Breaking Changes

**BREAKING CHANGE**: This update requires Tauri v2 and may not be compatible with applications expecting Tauri v1 APIs.

### What Changed
- Window creation APIs have been renamed and restructured
- Core Tauri dependencies have been updated to v2

### Why the Change
- Tauri v2 provides improved performance, security, and developer experience
- Maintains compatibility with the latest Tauri ecosystem

### How to Update
This update is primarily internal to the Rust backend. Frontend code should remain compatible, but developers working on the Tauri backend should be aware of the new v2 APIs.
