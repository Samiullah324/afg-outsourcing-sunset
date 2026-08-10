import type { InventoryApiError, InventoryItem, InventoryItemInput } from '@/types/inventory'

const API_BASE = '/api/inventory'

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as InventoryApiError
    if (body.error?.message) {
      return body.error.message
    }
    if (body.error?.details) {
      const details = body.error.details
      const firstKey = Object.keys(details)[0]
      const firstValue = details[firstKey]
      if (Array.isArray(firstValue) && firstValue.length > 0) {
        return String(firstValue[0])
      }
    }
  } catch {
    // fall through to generic message
  }
  return `Request failed with status ${response.status}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json() as Promise<T>
}

export async function listInventory(q?: string): Promise<InventoryItem[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : ''
  const response = await fetch(`${API_BASE}/${params}`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<InventoryItem[]>(response)
}

export async function getItem(id: number): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/${id}/`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<InventoryItem>(response)
}

export async function createItem(data: InventoryItemInput): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<InventoryItem>(response)
}

export async function updateItem(
  id: number,
  data: InventoryItemInput
): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/${id}/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<InventoryItem>(response)
}

export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  await handleResponse<void>(response)
}
