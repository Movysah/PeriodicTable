# Periodic Table Explorer - Component Tree

```text
App
├─ AppLayout
│  ├─ HeaderSection
│  ├─ SearchSection
│  │  └─ SearchBar
│  ├─ ContentSection
│  │  ├─ ElementGrid
│  │  │  └─ ElementCard (repeated)
│  │  └─ ElementDetailPanel
│  └─ StatusSection
│     └─ StatusState (loading/error/success)
```

## Notes

- `App` will own global state and data fetching.
- `SearchBar` is controlled via props and emits query changes.
- `ElementGrid` renders all visible elements and selected state.
- `ElementDetailPanel` renders selected element details.
- `StatusState` is reusable for loading, error, and empty states.
