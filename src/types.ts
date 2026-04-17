export type ElementCategory =
  | 'nonmetal'
  | 'noble-gas'
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'metalloid'
  | 'halogen'
  | 'post-transition-metal'
  | 'transition-metal'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'

export type ElementPhase = 'Solid' | 'Liquid' | 'Gas' | 'Unknown'

export type PeriodicElement = {
  number: number
  symbol: string
  name: string
  atomicMass: number
  group: number | null
  period: number
  category: ElementCategory
  phase: ElementPhase
  melt: number | null
  boil: number | null
  halfLife: string | null
  summary: string
  source: string
  xpos: number
  ypos: number
}

export type PeriodicTableData = {
  elements: PeriodicElement[]
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

export type ExplorerState = {
  query: string
  selectedSymbol: string | null
  savedSymbols: string[]
  status: LoadStatus
  errorMessage: string | null
}
