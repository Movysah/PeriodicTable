import './App.css'

const previewElements = [
  { atomicNumber: '1', symbol: 'H', name: 'Hydrogen', category: 'nonmetal' },
  { atomicNumber: '2', symbol: 'He', name: 'Helium', category: 'noble-gas' },
  {
    atomicNumber: '26',
    symbol: 'Fe',
    name: 'Iron',
    category: 'transition-metal',
  },
  { atomicNumber: '35', symbol: 'Br', name: 'Bromine', category: 'halogen' },
  {
    atomicNumber: '79',
    symbol: 'Au',
    name: 'Gold',
    category: 'transition-metal',
  },
  {
    atomicNumber: '92',
    symbol: 'U',
    name: 'Uranium',
    category: 'actinide',
  },
]

const categoryLegend = [
  { label: 'Nonmetal', category: 'nonmetal' },
  { label: 'Noble Gas', category: 'noble-gas' },
  { label: 'Transition Metal', category: 'transition-metal' },
  { label: 'Halogen', category: 'halogen' },
  { label: 'Actinide', category: 'actinide' },
]

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="eyebrow">Role A | Week 2 UI shell</p>
          <h1>Periodic Table Explorer</h1>
          <p className="lead">
            Mobile-first kostra aplikace pripravena pro vyhledavani, seznam
            prvku a detailni informace.
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="panel search-panel" aria-labelledby="search-title">
          <div className="section-heading">
            <p className="section-kicker">Search</p>
            <h2 id="search-title">Find an element</h2>
          </div>

          <form className="search-form">
            <label className="search-label" htmlFor="element-search">
              Search by name or symbol
            </label>
            <div className="search-row">
              <input
                id="element-search"
                className="search-input"
                type="search"
                placeholder="Try H, He or Oxygen"
              />
              <button className="primary-button" type="button">
                Search
              </button>
            </div>
          </form>

          <p className="section-note">
            Vizualni placeholder pro komponentu vyhledavani od Role B.
          </p>
        </section>

        <div className="content-layout">
          <section
            className="panel elements-panel"
            aria-labelledby="elements-title"
          >
            <div className="section-heading">
              <p className="section-kicker">Explorer</p>
              <h2 id="elements-title">Element preview</h2>
            </div>

            <div className="element-grid">
              {previewElements.map((element) => (
                <button
                  key={element.atomicNumber}
                  className={`element-card element-card--${element.category}`}
                  type="button"
                >
                  <span className="element-card__number">
                    {element.atomicNumber}
                  </span>
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

            <article className="detail-card">
              <div className="detail-card__hero">
                <p className="detail-card__label">Atomic number</p>
                <div className="detail-card__symbol-block">
                  <strong>1</strong>
                  <span>H</span>
                </div>
                <h3>Hydrogen</h3>
                <p className="detail-card__category">Nonmetal</p>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Atomic mass</dt>
                  <dd>1.008 u</dd>
                </div>
                <div>
                  <dt>Group</dt>
                  <dd>1</dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>1</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>Gas</dd>
                </div>
              </dl>

              <div className="detail-actions">
                <button className="secondary-button" type="button">
                  Open modal
                </button>
                <button className="ghost-button" type="button">
                  Save element
                </button>
              </div>
            </article>
          </aside>
        </div>

        <section className="status-grid" aria-label="UI states preview">
          <article className="status-card status-card--loading">
            <p className="status-card__title">Loading state</p>
            <p className="status-card__text">
              Placeholder pro nacitani dat periodicke tabulky.
            </p>
          </article>

          <article className="status-card status-card--error">
            <p className="status-card__title">Error state</p>
            <p className="status-card__text">
              Prostor pro chybovou hlasku a retry tlacitko.
            </p>
          </article>

          <article className="status-card status-card--success">
            <p className="status-card__title">Success state</p>
            <p className="status-card__text">
              Ukazka pozitivni zpetne vazby po akci uzivatele.
            </p>
          </article>
        </section>
      </main>

      <footer className="app-footer">
        <p>Role A pripravil architekturu UI, styly a interaktivni stavy.</p>
      </footer>
    </div>
  )
}

export default App
