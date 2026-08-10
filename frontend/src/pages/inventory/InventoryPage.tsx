import { useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { DashboardLayout } from '@components/templates/DashboardLayout'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { InventoryForm, InventoryList } from '@components/inventory'
import {
  createItem,
  deleteItem,
  listInventory,
  updateItem,
} from '@/api/inventory'
import type { InventoryItem, InventoryItemInput } from '@/types/inventory'
import './InventoryPage.css'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}

const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listInventory(debouncedSearch || undefined)
      setItems(data)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load inventory items.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreateOrUpdate = async (data: InventoryItemInput) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data)
        setMessage({ type: 'success', text: 'Item updated successfully.' })
      } else {
        await createItem(data)
        setMessage({ type: 'success', text: 'Item created successfully.' })
      }
      setShowForm(false)
      setEditingItem(null)
      await loadItems()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save item.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete "${item.name}"?`)
    if (!confirmed) {
      return
    }

    setIsDeletingId(item.id)
    setMessage(null)
    try {
      await deleteItem(item.id)
      setMessage({ type: 'success', text: 'Item deleted successfully.' })
      await loadItems()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete item.',
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const openCreateForm = () => {
    setEditingItem(null)
    setShowForm(true)
    setMessage(null)
  }

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item)
    setShowForm(true)
    setMessage(null)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  return (
    <DashboardLayout>
      <div className="inventory-page">
        <div className="inventory-page__header">
          <div>
            <h1>Inventory</h1>
            <p>Manage stock levels, pricing, and item details.</p>
          </div>
          <Button onClick={openCreateForm}>Add Item</Button>
        </div>

        {message && (
          <div className={`inventory-page__banner inventory-page__banner--${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="inventory-page__toolbar">
          <div className="inventory-page__search">
            <Search size={18} />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name..."
              aria-label="Search inventory"
            />
          </div>
        </div>

        {showForm && (
          <div className="inventory-page__modal">
            <div className="inventory-page__modal-content">
              <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <InventoryForm
                initialItem={editingItem}
                onSubmit={handleCreateOrUpdate}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="inventory-page__loading">Loading inventory...</div>
        ) : (
          <InventoryList
            items={items}
            onEdit={openEditForm}
            onDelete={handleDelete}
            isDeletingId={isDeletingId}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default InventoryPage
