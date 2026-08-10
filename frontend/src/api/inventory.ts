import axios, { AxiosError } from 'axios'

export type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  price: number
  description?: string
  status: InventoryStatus
}

export interface InventoryCreatePayload {
  name: string
  quantity: number
  price: number
  description?: string
}

export interface InventoryUpdatePayload {
  name?: string
  quantity?: number
  price?: number
  description?: string
}

export interface InventoryError {
  error: string
  details?: Record<string, string>
}

const inventoryApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

inventoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function parseInventoryError(error: unknown): InventoryError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<InventoryError>
    if (axiosError.response?.data?.error) {
      return axiosError.response.data
    }
    if (axiosError.response?.status === 404) {
      return { error: 'Item not found' }
    }
  }
  return { error: 'Something went wrong. Please try again.' }
}

export async function list(search?: string): Promise<InventoryItem[]> {
  try {
    const params = search ? { search } : undefined
    const response = await inventoryApi.get<{ items: InventoryItem[] }>('/api/inventory/', { params })
    return response.data.items
  } catch (error) {
    throw parseInventoryError(error)
  }
}

export async function get(id: string): Promise<InventoryItem> {
  const response = await inventoryApi.get<InventoryItem>(`/api/inventory/${id}/`)
  return response.data
}

export async function create(payload: InventoryCreatePayload): Promise<InventoryItem> {
  try {
    const response = await inventoryApi.post<InventoryItem>('/api/inventory/', payload)
    return response.data
  } catch (error) {
    throw parseInventoryError(error)
  }
}

export async function update(id: string, payload: InventoryUpdatePayload): Promise<InventoryItem> {
  try {
    const response = await inventoryApi.put<InventoryItem>(`/api/inventory/${id}/`, payload)
    return response.data
  } catch (error) {
    throw parseInventoryError(error)
  }
}

export async function remove(id: string): Promise<void> {
  try {
    await inventoryApi.delete(`/api/inventory/${id}/`)
  } catch (error) {
    throw parseInventoryError(error)
  }
}

export { parseInventoryError }
