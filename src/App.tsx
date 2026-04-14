import { useEffect, useReducer, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { useFetch } from './hooks/useFetch'
import { useLocalStorage } from './hooks/useLocalStorage'

const PERIODIC_TABLE_URL =
  'https://cdn.jsdelivr.net/gh/Bowserinator/Periodic-Table-JSON@master/PeriodicTableJSON.json'

const PERIODIC_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
}

const HALF_LIFE_BY_SYMBOL: Record<string, string> = {
  Tc: '~4.2 million years (Tc-98)',
  Pm: '~17.7 years (Pm-145)',
  U: '~4.47 billion years (U-238)',
  Pu: '~24,110 years (Pu-239)',
  Am: '~432 years (Am-241)',
  Rn: '~3.8 days (Rn-222)',
  Fr: '~22 minutes (Fr-223)',
  Og: '~0.001 seconds',
}

type PeriodicElement = {
  atomic_mass: number | string
  boil: number | null
  category: string
  discovered_by: string | null
  group: number | null
  melt: number | null
  name: string
  number: number
  period: number
  phase: string
  source: string
  summary: string
  symbol: string
  xpos: number
  ypos: number
}

type PeriodicTablePayload = {
  elements: PeriodicElement[]
}

type LegendCategory =
  | 'nonmetal'
  | 'noble-gas'
  | 'transition-metal'
  | 'halogen'
  | 'actinide'

type ExplorerState = {
  queryInput: string
  activeQuery: string
  selectedSymbol: string | null
}

type ExplorerAction =
  | { type: 'set-query-input'; value: string }
  | { type: 'submit-search' }
  | { type: 'clear-search' }
  | { type: 'select-element'; symbol: string }

const EMPTY_ELEMENTS: PeriodicElement[] = []

const categoryLegend: Array<{ label: string; category: LegendCategory }> = [
  { label: 'Nonmetal', category: 'nonmetal' },
  { label: 'Noble Gas', category: 'noble-gas' },
  { label: 'Transition Metal', category: 'transition-metal' },
  { label: 'Halogen', category: 'halogen' },
  { label: 'Actinide', category: 'actinide' },
]

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const toLegendCategory = (category: string): LegendCategory => {
  const normalized = category.toLowerCase()

  if (normalized.includes('noble gas')) {
    return 'noble-gas'
  }

  if (normalized.includes('halogen')) {
    return 'halogen'
  }

  if (normalized.includes('actinide')) {
    return 'actinide'
  }

  if (normalized.includes('transition metal')) {
    return 'transition-metal'
  }

  return 'nonmetal'
}

const formatValue = (
  value: number | string | null | undefined,
  digits: number,
): string => {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: digits })
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('en-US', { maximumFractionDigits: digits })
    }

    return value
  }

  return 'unknown'
}

const withUnit = (
  value: number | string | null | undefined,
  unit: string,
  digits: number,
): string => {
  const formatted = formatValue(value, digits)
  return formatted === 'unknown' ? formatted : `${formatted} ${unit}`
}

const getHalfLife = (element: PeriodicElement): string => {
  const known = HALF_LIFE_BY_SYMBOL[element.symbol]
  if (known) {
    return known
  }

  const category = element.category.toLowerCase()
  if (category.includes('radioactive') || category.includes('actinide')) {
    return 'Radioactive, depends on isotope.'
  }

  return 'Stable (half-life not commonly listed).'
}

const getGroupLabel = (element: PeriodicElement): string => {
  if (typeof element.group === 'number') {
    return String(element.group)
  }

  if (element.ypos === 8) {
    return 'Lanthanide'
  }

  if (element.ypos === 9) {
    return 'Actinide'
  }

  return 'unknown'
}

const explorerReducer = (
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState => {
  switch (action.type) {
    case 'set-query-input':
      return { ...state, queryInput: action.value }
    case 'submit-search':
      return { ...state, activeQuery: state.queryInput.trim() }
    case 'clear-search':
      return { ...state, queryInput: '', activeQuery: '' }
    case 'select-element':
      return { ...state, selectedSymbol: action.symbol }
    default:
      return state
  }
}

function App() {
  const [persistedState, setPersistedState] = useLocalStorage<ExplorerState>(
    'periodic-table:explorer-state',
    {
      queryInput: '',
      activeQuery: '',
      selectedSymbol: null,
    },
  )
  const [savedSymbols, setSavedSymbols] = useLocalStorage<string[]>(
    'periodic-table:saved-elements',
    [],
  )
  const [showSummary, setShowSummary] = useState(false)

  const [state, dispatch] = useReducer(explorerReducer, persistedState)
  const { data, loading, error } = useFetch<PeriodicTablePayload>(
    PERIODIC_TABLE_URL,
  )

  const elements = data?.elements ?? EMPTY_ELEMENTS
  const query = normalizeText(state.activeQuery)
  const filteredElements = elements.filter((element) => {
    if (query.length === 0) {
      return true
    }

    const byName = normalizeText(element.name).includes(query)
    const bySymbol = normalizeText(element.symbol).includes(query)
    return byName || bySymbol
  })

  const selectedElement =
    filteredElements.find((element) => element.symbol === state.selectedSymbol) ??
    filteredElements[0] ??
    null
  const isSaved = selectedElement
    ? savedSymbols.includes(selectedElement.symbol)
    : false

  useEffect(() => {
    setPersistedState(state)
  }, [setPersistedState, state])

  useEffect(() => {
    if (selectedElement && selectedElement.symbol !== state.selectedSymbol) {
      dispatch({ type: 'select-element', symbol: selectedElement.symbol })
    }
  }, [selectedElement, state.selectedSymbol])

  const handleToggleSavedElement = (): void => {
    if (!selectedElement) {
      return
    }

    const symbol = selectedElement.symbol
    setSavedSymbols((previous) => {
      if (previous.includes(symbol)) {
        return previous.filter((savedSymbol) => savedSymbol !== symbol)
      }

      return [...previous, symbol]
    })
  }

  const resultNote =
    query.length > 0
      ? `Search results: ${filteredElements.length} / ${elements.length}`
      : `Elements loaded: ${elements.length}`

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="eyebrow">Role B | Week 2 logic</p>
          <h1>Periodic Table Explorer</h1>
          <p className="lead">
            Interactive periodic table with search and element detail.
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="panel search-panel" aria-labelledby="search-title">
          <div className="section-heading">
            <p className="section-kicker">Search</p>
            <h2 id="search-title">Find an element</h2>
          </div>

          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault()
              dispatch({ type: 'submit-search' })
            }}
          >
            <label className="search-label" htmlFor="element-search">
              Search by name or symbol
            </label>
            <div className="search-row">
              <input
                id="element-search"
                className="search-input"
                type="search"
                value={state.queryInput}
                placeholder="Try H, He or Oxygen"
                onChange={(event) =>
                  dispatch({ type: 'set-query-input', value: event.target.value })
                }
              />
              <button className="primary-button" type="submit">
                Search
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => dispatch({ type: 'clear-search' })}
              >
                Clear
              </button>
            </div>
          </form>

          <p className="section-note">{resultNote}</p>
        </section>

        <div className="content-layout">
          <section
            className="panel elements-panel"
            aria-labelledby="elements-title"
          >
            <div className="section-heading">
              <p className="section-kicker">Explorer</p>
              <h2 id="elements-title">Periodic table</h2>
            </div>

            <div
              className="element-grid"
              style={query.length === 0 ? PERIODIC_GRID_STYLE : undefined}
            >
              {filteredElements.map((element) => (
                <button
                  key={element.number}
                  className={`element-card element-card--${toLegendCategory(element.category)}`}
                  type="button"
                  style={
                    query.length === 0
                      ? {
                          gridColumn: element.xpos,
                          gridRow: element.ypos,
                        }
                      : undefined
                  }
                  onClick={() =>
                    dispatch({ type: 'select-element', symbol: element.symbol })
                  }
                >
                  <span className="element-card__number">{element.number}</span>
                  <span className="element-card__symbol">{element.symbol}</span>
                  <span className="element-card__name">{element.name}</span>
                </button>
              ))}
            </div>

            <div className="legend" aria-label="Element categories">
              {categoryLegend.map((item) => (
                <span
                  key={item.label}
                  className={`legend-chip legend-chip--${item.category}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </section>

          <aside className="panel detail-panel" aria-labelledby="detail-title">
            <div className="section-heading">
              <p className="section-kicker">Detail</p>
              <h2 id="detail-title">Selected element</h2>
            </div>

            {selectedElement ? (
              <article className="detail-card">
                <div className="detail-card__hero">
                  <p className="detail-card__label">Atomic number</p>
                  <div className="detail-card__symbol-block">
                    <strong>{selectedElement.number}</strong>
                    <span>{selectedElement.symbol}</span>
                  </div>
                  <h3>{selectedElement.name}</h3>
                  <p className="detail-card__category">{selectedElement.category}</p>
                </div>

                <dl className="detail-list">
                  <div>
                    <dt>Atomic mass</dt>
                    <dd>{formatValue(selectedElement.atomic_mass, 4)}</dd>
                  </div>
                  <div>
                    <dt>Group</dt>
                    <dd>{getGroupLabel(selectedElement)}</dd>
                  </div>
                  <div>
                    <dt>Period</dt>
                    <dd>{selectedElement.period}</dd>
                  </div>
                  <div>
                    <dt>State</dt>
                    <dd>{selectedElement.phase}</dd>
                  </div>
                  <div>
                    <dt>Melting point</dt>
                    <dd>{withUnit(selectedElement.melt, 'K', 2)}</dd>
                  </div>
                  <div>
                    <dt>Boiling point</dt>
                    <dd>{withUnit(selectedElement.boil, 'K', 2)}</dd>
                  </div>
                  <div>
                    <dt>Half-life</dt>
                    <dd>{getHalfLife(selectedElement)}</dd>
                  </div>
                  <div>
                    <dt>Discovered by</dt>
                    <dd>{selectedElement.discovered_by ?? 'unknown'}</dd>
                  </div>
                </dl>

                <div className="detail-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setShowSummary((previous) => !previous)}
                  >
                    {showSummary ? 'Hide summary' : 'Open modal'}
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleToggleSavedElement}
                  >
                    {isSaved ? 'Unsave element' : 'Save element'}
                  </button>
                </div>

                {showSummary ? (
                  <p className="section-note">{selectedElement.summary}</p>
                ) : null}

                <a href={selectedElement.source} target="_blank" rel="noreferrer">
                  Source
                </a>
              </article>
            ) : (
              <article className="detail-card">
                <p>No element selected.</p>
              </article>
            )}
          </aside>
        </div>

        <section className="status-grid" aria-label="UI states preview">
          <article className="status-card status-card--loading">
            <p className="status-card__title">Loading state</p>
            <p className="status-card__text">
              {loading
                ? 'Periodic table is loading.'
                : 'Periodic table loaded successfully.'}
            </p>
          </article>

          <article className="status-card status-card--error">
            <p className="status-card__title">Error state</p>
            <p className="status-card__text">
              {error ?? 'No loading error detected.'}
            </p>
          </article>

          <article className="status-card status-card--success">
            <p className="status-card__title">Success state</p>
            <p className="status-card__text">
              {selectedElement
                ? `${selectedElement.name} selected. Saved: ${savedSymbols.length}`
                : `Saved elements: ${savedSymbols.length}`}
            </p>
          </article>
        </section>
      </main>

      <footer className="app-footer">
        <p>Logic implementation with useFetch + useReducer + useLocalStorage.</p>
      </footer>
    </div>
  )
}

export default App
