import { useEffect, useReducer, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { useFetch } from './hooks/useFetch'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  ACTINIDE,
  ALKALI_METAL,
  ALKALINE_EARTH,
  BORDER_COLOR,
  ERROR_COLOR,
  HALOGEN,
  LANTHANIDE,
  LOADING_COLOR,
  METALLOID,
  NOBLE_GAS,
  NONMETAL,
  POST_TRANSITION,
  TRANSITION_METAL,
} from './theme'

const PERIODIC_TABLE_URL = '/data/periodicElements.json'

const PERIODIC_GRID_STYLE: CSSProperties = {
  gridTemplateColumns:
    'repeat(18, minmax(var(--tile-min, 2.7rem), var(--tile-max, 1fr)))',
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
  electron_configuration?: string
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

type CategoryKey =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'other'

type CategoryMeta = {
  key: CategoryKey
  label: string
  tone: string
}

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

const CATEGORY_LEGEND: CategoryMeta[] = [
  { key: 'alkali-metal', label: 'Alkali Metal', tone: ALKALI_METAL },
  { key: 'alkaline-earth', label: 'Alkaline Earth', tone: ALKALINE_EARTH },
  { key: 'transition-metal', label: 'Transition Metal', tone: TRANSITION_METAL },
  { key: 'post-transition', label: 'Post-transition', tone: POST_TRANSITION },
  { key: 'metalloid', label: 'Metalloid', tone: METALLOID },
  { key: 'nonmetal', label: 'Nonmetal', tone: NONMETAL },
  { key: 'halogen', label: 'Halogen', tone: HALOGEN },
  { key: 'noble-gas', label: 'Noble Gas', tone: NOBLE_GAS },
  { key: 'lanthanide', label: 'Lanthanide', tone: LANTHANIDE },
  { key: 'actinide', label: 'Actinide', tone: ACTINIDE },
]

const OTHER_CATEGORY: CategoryMeta = {
  key: 'other',
  label: 'Other',
  tone: BORDER_COLOR,
}

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const getSearchValidationMessage = (value: string): string | null => {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return null
  }

  if (trimmed.length > 60) {
    return 'Search query is too long.'
  }

  if (!/[a-z0-9]/i.test(trimmed)) {
    return 'Search must contain at least one letter or number.'
  }

  return null
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

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) {
    return `rgba(148, 163, 184, ${alpha})`
  }

  const value = Number.parseInt(normalized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const toneVars = (tone: string): CSSProperties =>
  ({
    '--tone': tone,
    '--tone-soft': hexToRgba(tone, 0.12),
    '--tone-border': hexToRgba(tone, 0.3),
    '--tone-shadow': hexToRgba(tone, 0.18),
  }) as CSSProperties

const getCategoryMeta = (category: string): CategoryMeta => {
  const normalized = category.toLowerCase()

  if (normalized.includes('alkaline earth')) {
    return CATEGORY_LEGEND[1]
  }

  if (normalized.includes('alkali metal')) {
    return CATEGORY_LEGEND[0]
  }

  if (normalized.includes('transition metal')) {
    return CATEGORY_LEGEND[2]
  }

  if (normalized.includes('post-transition')) {
    return CATEGORY_LEGEND[3]
  }

  if (normalized.includes('metalloid')) {
    return CATEGORY_LEGEND[4]
  }

  if (normalized.includes('halogen')) {
    return CATEGORY_LEGEND[6]
  }

  if (normalized.includes('noble gas')) {
    return CATEGORY_LEGEND[7]
  }

  if (normalized.includes('lanthanide')) {
    return CATEGORY_LEGEND[8]
  }

  if (normalized.includes('actinide')) {
    return CATEGORY_LEGEND[9]
  }

  if (normalized.includes('nonmetal')) {
    return CATEGORY_LEGEND[5]
  }

  return OTHER_CATEGORY
}

const getLegendItems = (elements: PeriodicElement[]): CategoryMeta[] => {
  const usedKeys = new Set<CategoryKey>()

  for (const element of elements) {
    usedKeys.add(getCategoryMeta(element.category).key)
  }

  return CATEGORY_LEGEND.filter((item) => usedKeys.has(item.key))
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
    return 'Radioactive. Exact half-life depends on isotope.'
  }

  return 'Stable. No commonly listed half-life.'
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

function App() {
  const [persistedState, setPersistedState] = useLocalStorage<ExplorerState>(
    'periodic-table:explorer-state',
    {
      queryInput: '',
      activeQuery: '',
      selectedSymbol: null,
    },
  )
  const [showSummary, setShowSummary] = useLocalStorage(
    'periodic-table:show-summary',
    false,
  )
  const [searchValidationError, setSearchValidationError] = useState<
    string | null
  >(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [state, dispatch] = useReducer(explorerReducer, persistedState)
  const { data, loading, error, refetch } = useFetch<PeriodicTablePayload>(
    PERIODIC_TABLE_URL,
  )

  const elements = (data?.elements ?? EMPTY_ELEMENTS).filter(
    (element) => element.number <= 118,
  )
  const query = normalizeText(state.activeQuery)
  const filteredElements = elements.filter((element) => {
    if (query.length === 0) {
      return true
    }

    const byName = normalizeText(element.name).startsWith(query)
    const bySymbol = normalizeText(element.symbol).startsWith(query)
    return byName || bySymbol
  })

  const selectedElement =
    filteredElements.find((element) => element.symbol === state.selectedSymbol) ??
    filteredElements[0] ??
    null
  const selectedCategory = selectedElement
    ? getCategoryMeta(selectedElement.category)
    : OTHER_CATEGORY
  const legendItems = getLegendItems(elements)
  const hasEmptyDataset = !loading && !error && elements.length === 0
  const hasNoSearchMatches =
    !loading &&
    !error &&
    elements.length > 0 &&
    query.length > 0 &&
    filteredElements.length === 0
  useEffect(() => {
    setPersistedState(state)
  }, [setPersistedState, state])

  useEffect(() => {
    if (loading || error || elements.length === 0) {
      return
    }

    const selectedSymbolExists = state.selectedSymbol
      ? elements.some((element) => element.symbol === state.selectedSymbol)
      : false

    if (selectedSymbolExists) {
      return
    }

    const fallbackElement = filteredElements[0] ?? elements[0] ?? null
    if (fallbackElement && fallbackElement.symbol !== state.selectedSymbol) {
      dispatch({ type: 'select-element', symbol: fallbackElement.symbol })
    }
  }, [elements, error, filteredElements, loading, state.selectedSymbol])

  useEffect(() => {
    if (!isDetailOpen) {
      return
    }

    const { documentElement, body } = document
    const previousHtmlOverflow = documentElement.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - documentElement.clientWidth

    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsDetailOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      documentElement.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDetailOpen])

  const openElementDetails = (symbol: string): void => {
    dispatch({ type: 'select-element', symbol })
    setIsDetailOpen(true)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="eyebrow">Periodic Table Explorer</p>
          <h1>Tap, search and inspect every element.</h1>
          <p className="lead">
            Explore the periodic table, search elements and open focused detail
            cards with key facts.
          </p>

          <div className="header-pills" aria-label="Project highlights">
            <span className="header-pill">118 elements</span>
            <span className="header-pill">Search by symbol</span>
            <span className="header-pill">PWA ready</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="panel search-panel" aria-labelledby="search-title">
          <div className="section-heading">
            <p className="section-kicker">Search</p>
            <h2 id="search-title">Find an element by name or symbol</h2>
          </div>

          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault()
              const validationMessage = getSearchValidationMessage(
                state.queryInput,
              )

              if (validationMessage) {
                setSearchValidationError(validationMessage)
                return
              }

              setSearchValidationError(null)
              dispatch({ type: 'submit-search' })
            }}
          >
            <label className="search-label" htmlFor="element-search">
              Search by name or symbol
            </label>

            <div className="search-row">
              <input
                id="element-search"
                className={`search-input${searchValidationError ? ' search-input--invalid' : ''}`}
                type="search"
                inputMode="search"
                value={state.queryInput}
                placeholder="Try H, He or Oxygen"
                onChange={(event) => {
                  if (searchValidationError) {
                    setSearchValidationError(null)
                  }

                  dispatch({
                    type: 'set-query-input',
                    value: event.target.value,
                  })
                }}
              />

              <button className="primary-button" type="submit">
                Search
              </button>

              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setSearchValidationError(null)
                  dispatch({ type: 'clear-search' })
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {searchValidationError ? (
            <div className="search-feedback" aria-live="polite">
              <p className="feedback-note feedback-note--error">
                {searchValidationError}
              </p>
            </div>
          ) : null}
        </section>

        {loading ? (
          <section
            className="panel state-panel state-panel--loading"
            aria-live="polite"
          >
            <div className="state-hero">
              <div className="loading-spinner" aria-hidden="true" />
              <p className="state-title">Loading elements</p>
              <p className="state-text">
                Building the periodic table from the local dataset.
              </p>
            </div>

            <div className="skeleton-list" aria-hidden="true">
              <span className="skeleton-line" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="panel state-panel state-panel--error">
            <div className="state-hero">
              <div className="state-icon" style={toneVars(ERROR_COLOR)}>
                !
              </div>
              <p className="state-title">Oops. Something went wrong.</p>
              <p className="state-text">
                {error}. Retry loading the local dataset and try again.
              </p>
            </div>

            <button
              className="primary-button primary-button--danger"
              onClick={refetch}
            >
              Try again
            </button>
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            {query.length > 0 ? (
              <section
                className="panel results-panel"
                aria-labelledby="results-title"
              >
                <div className="section-heading">
                  <p className="section-kicker">Results</p>
                  <h2 id="results-title">Search results</h2>
                </div>

                {hasNoSearchMatches ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">Q</div>
                    <p className="empty-state__title">No results found</p>
                    <p className="empty-state__text">
                      Try a shorter query or clear the search to return to the
                      full periodic table.
                    </p>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => dispatch({ type: 'clear-search' })}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="result-list">
                    {filteredElements.map((element) => {
                      const category = getCategoryMeta(element.category)

                      return (
                        <button
                          key={element.number}
                          className={`result-card${selectedElement?.symbol === element.symbol ? ' result-card--selected' : ''}`}
                          type="button"
                          onClick={() => openElementDetails(element.symbol)}
                          style={toneVars(category.tone)}
                        >
                          <div className="result-card__badge">
                            <span>{element.number}</span>
                            <strong>{element.symbol}</strong>
                          </div>

                          <div className="result-card__body">
                            <p className="result-card__title">{element.name}</p>
                            <p className="result-card__meta">{category.label}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            ) : null}

            {!hasEmptyDataset && query.length === 0 ? (
              <>
                <section
                  className="panel table-panel"
                  aria-labelledby="overview-title"
                >
                  <div className="table-frame">
                    <div className="table-scroll">
                      <div className="periodic-table" style={PERIODIC_GRID_STYLE}>
                        {elements.map((element) => {
                          const category = getCategoryMeta(element.category)

                          return (
                            <button
                              key={element.number}
                              className={`element-tile${selectedElement?.symbol === element.symbol ? ' element-tile--selected' : ''}`}
                              type="button"
                              style={{
                                ...toneVars(category.tone),
                                gridColumn: element.xpos,
                                gridRow: element.ypos,
                              }}
                              onClick={() => openElementDetails(element.symbol)}
                            >
                              <span className="element-tile__number">
                                {element.number}
                              </span>
                              <span className="element-tile__symbol">
                                {element.symbol}
                              </span>
                              <span className="element-tile__name">
                                {element.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel legend-panel">
                  <div className="section-heading">
                    <p className="section-kicker">Legend</p>
                    <h2>Element categories</h2>
                  </div>

                  <div className="legend-grid">
                    {legendItems.map((item) => (
                      <span
                        key={item.key}
                        className="legend-chip"
                        style={toneVars(item.tone)}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {hasEmptyDataset ? (
              <section className="panel state-panel">
                <div className="state-hero">
                  <div className="state-icon" style={toneVars(LOADING_COLOR)}>
                    0
                  </div>
                  <p className="state-title">The dataset is empty.</p>
                  <p className="state-text">
                    Check `public/data/periodicElements.json` and add element
                    records before testing the explorer again.
                  </p>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      <footer className="app-footer">
        <p>Periodic Table Explorer</p>
      </footer>

      {isDetailOpen && selectedElement ? (
        <div
          className="modal-scrim"
          role="presentation"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-card__top">
              <div>
                <p className="section-kicker">Element details</p>
                <h2 id="detail-title">{selectedElement.name}</h2>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </button>
            </div>

            <article className="detail-card">
              <div
                className="detail-card__hero"
                style={toneVars(selectedCategory.tone)}
              >
                <p className="detail-card__label">Atomic number</p>
                <div className="detail-card__symbol-block">
                  <strong>{selectedElement.number}</strong>
                  <span>{selectedElement.symbol}</span>
                </div>
                <h3>{selectedElement.name}</h3>
                <p className="detail-card__category">{selectedCategory.label}</p>
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
                  <dt>Electron config</dt>
                  <dd>{selectedElement.electron_configuration ?? 'unknown'}</dd>
                </div>
                <div>
                  <dt>Discovered by</dt>
                  <dd>{selectedElement.discovered_by ?? 'unknown'}</dd>
                </div>
              </dl>

              <div className="fact-box">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowSummary((previous) => !previous)}
                >
                  {showSummary ? 'Hide interesting fact' : 'Show interesting fact'}
                </button>

                {showSummary ? (
                  <p className="fact-box__text">{selectedElement.summary}</p>
                ) : null}
              </div>

              <div className="detail-actions">
                <a
                  className="primary-button detail-link"
                  href={selectedElement.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Wiki
                </a>
              </div>
            </article>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
