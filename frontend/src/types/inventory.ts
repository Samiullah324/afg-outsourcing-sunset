export type StockStatus = 'in_stock' | 'low' | 'out'

export interface InventoryItem {
  id: number
  name: string
  description?: string
  quantity: number
  price: number
  low_stock_threshold: number
  stock_status: StockStatus
  created_at: string
  updated_at: string
}

export interface InventoryItemInput {
  name: string
  description?: string
  quantity: number
  price: number
  low_stock_threshold?: number
}

export interface InventoryApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
