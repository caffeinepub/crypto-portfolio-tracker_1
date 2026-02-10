# Specification

## Summary
**Goal:** Remove the “Staking Rewards” tab from the Dashboard so users can’t navigate to staking rewards management via tabs, while keeping Holdings as the default view.

**Planned changes:**
- Remove the “Staking Rewards” tab trigger from the Dashboard tabs UI.
- Remove the “Staking Rewards” tab content panel from the Dashboard.
- Ensure the Holdings view remains functional and is the default/primary Dashboard view after tab removal.
- Clean up Dashboard.tsx by removing now-unused imports/references related to the removed tab.

**User-visible outcome:** The Dashboard no longer shows a “Staking Rewards” tab; users land on and use the Holdings view as the primary Dashboard screen.
