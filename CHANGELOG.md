# paperflow

## 1.0.0

### Major Changes

- e798a52: # Migrate from Tauri v1 to v2

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

### Minor Changes

- e798a52: Reworked authentication flow, improved window UX with auto-close and enhanced styling

### Patch Changes

- e798a52: redesign view page
- e798a52: Fixed an issue where the app would crash due to settings not being loaded correctly

## 0.1.2

### Patch Changes

- 3075082: Removed router devtools, Removed non-functional filters

## 0.1.1

### Patch Changes

- 5e36751: Connection Settings Redesign Implemented
- 69852c0: refactored disconnecting from provider in Connection Settings Redesign
- 54191b6: fixed issue where images wouldn't download to the path specified in the settings

## 0.1.0

### Minor Changes

- 8f65f38: Image Preview page Implemented
- 63829ac: Implemented image downloads, implemented basic settings and presistence, minor code improvments

### Patch Changes

- d43c521: refactored rust backend to make it more organised and eaiser for future changes
- 94fd6a6: Added config file for loading in env variables
- 7af827b: small design changes: navigation and image view page
- 07a72b3: updated tuari dependencies and tanstack-router to stable version
- 4d3b675: Added Reddit Oauth disconnect feature
- 80732b3: implemented first stage of auth

## 0.0.2

### Patch Changes

- e23521e: added changesets package, change version to start at 0.0.1
