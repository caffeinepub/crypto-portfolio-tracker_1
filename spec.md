# Specification

## Summary
**Goal:** Restore the backend canister's lost state by seeding it with hardcoded representative data so the app is no longer empty after the Version 47 deployment wiped the canister state.

**Planned changes:**
- Populate the backend `main.mo` stable maps with hardcoded seed/init values for holdings, staking rewards, portfolio history records, live portfolio snapshots, and user profile.
- Ensure seed data is initialised on canister load so it persists across upgrades.

**User-visible outcome:** On app load, the dashboard displays non-empty holdings, staking rewards, portfolio history, and a user profile name instead of a blank state.
