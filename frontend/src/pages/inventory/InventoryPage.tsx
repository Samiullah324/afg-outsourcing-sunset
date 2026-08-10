import { useCallback, useEffect, useState } from 'react'
import { DashboardLayout } from '@components/templates/DashboardLayout'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import {
  create,
  list,
  remove,
  update,
  InventoryItem,
  InventoryError,
} from '@/api/inventory'
import './InventoryPage.css'

interface FormState {
  name: string
  quantity: string
  price: string
  description: string
}

const emptyForm: FormState = {
  name: '',
  quantity: '',
  price: '',
  description: '',
}

const statusLabels: Record<InventoryItem['status'], string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(price)

const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await list(debouncedSearch || undefined)
      setItems(data)
    } catch (error) {
      const err = error as InventoryError
      setMessage({ type: 'error', text: err.error })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) {
      errors.name = 'Name is required'
    }
    const quantity = Number(form.quantity)
    if (form.quantity === '' || Number.isNaN(quantity) || quantity < 0) {
      errors.quantity = 'Quantity must be 0 or greater'
    }
    const price = Number(form.price)
    if (form.price === '' || Number.isNaN(price) || price < 0) {
      errors.price = 'Price must be 0 or greater'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)
    if (!validateForm()) {
      return
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price),
      description: form.description.trim() || undefined,
    }

    try {
      if (editingId) {
        await update(editingId, payload)
        setMessage({ type: 'success', text: 'Item updated successfully' })
      } else {
        await create(payload)
        setMessage({ type: 'success', text: 'Item created successfully' })
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadItems()
    } catch (error) {
      const err = error as InventoryError
      setMessage({ type: 'error', text: err.error })
      if (err.details) {
        setFieldErrors(err.details)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      price: String(item.price),
      description: item.description || '',
    })
    setFieldErrors({})
    setMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) {
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await remove(item.id)
      setMessage({ type: 'success', text: 'Item deleted successfully' })
      if (editingId === item.id) {
        handleCancelEdit()
      }
      await loadItems()
    } catch (error) {
      const err = error as InventoryError
      setMessage({ type: 'error', text: err.error })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="inventory-page">
        <div className="inventory-header">
          <div>
            <h1>Inventory</h1>
            <p>Manage stock levels, pricing, and availability</p>
          </div>
        </div>

        {message && (
          <div className={`inventory-alert inventory-alert--${message.type}`} role="alert">
            {message.text}
          </div>
        )}

        <div className="inventory-toolbar">
          <Input
            label="Search"
            placeholder="Search by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
        </div>

        <section className="inventory-form-section">
          <h2>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <form className="inventory-form" onSubmit={handleSubmit}>
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              error={fieldErrors.name}
              required
            />
            <Input
              label="Quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
              error={fieldErrors.quantity}
              required
            />
            <Input
              label="Price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              error={fieldErrors.price}
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              error={fieldErrors.description}
            />
            <div className="inventory-form-actions">
              <Button type="submit" isLoading={saving} disabled={saving}>
                {editingId ? 'Update Item' : 'Add Item'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="inventory-table-section">
          <div className="section-header">
            <h2>Stock Items</h2>
            <p>{loading ? 'Loading inventory...' : `${items.length} item(s)`}</p>
          </div>

          <div className="inventory-table">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Quantity</div>
              <div className="table-cell">Price</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Actions</div>
            </div>

            {!loading && items.length === 0 && (
              <div className="inventory-empty">No inventory items found.</div>
            )}

            {items.map((item) => (
              <div key={item.id} className="table-row">
                <div className="table-cell">{item.name}</div>
                <div className="table-cell">{item.quantity}</div>
                <div className="table-cell">{formatPrice(item.price)}</div>
                <div className="table-cell">
                  <span className={`status-badge status-badge--${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <div className="table-cell inventory-actions">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default InventoryPage
