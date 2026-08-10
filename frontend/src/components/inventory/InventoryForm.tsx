import { useEffect, useState } from 'react'
import { Button } from '@components/atoms/Button'
import { FormField } from '@components/molecules/FormField'
import type { InventoryItem, InventoryItemInput } from '@/types/inventory'
import './InventoryForm.css'

export interface InventoryFormValues {
  name: string
  description: string
  quantity: string
  price: string
  low_stock_threshold: string
}

interface InventoryFormProps {
  initialItem?: InventoryItem | null
  onSubmit: (data: InventoryItemInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const emptyValues: InventoryFormValues = {
  name: '',
  description: '',
  quantity: '0',
  price: '0',
  low_stock_threshold: '5',
}

export const InventoryForm = ({
  initialItem,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InventoryFormProps) => {
  const [values, setValues] = useState<InventoryFormValues>(emptyValues)
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryFormValues, string>>>({})

  useEffect(() => {
    if (initialItem) {
      setValues({
        name: initialItem.name,
        description: initialItem.description || '',
        quantity: String(initialItem.quantity),
        price: String(initialItem.price),
        low_stock_threshold: String(initialItem.low_stock_threshold),
      })
    } else {
      setValues(emptyValues)
    }
    setErrors({})
  }, [initialItem])

  const handleChange = (field: keyof InventoryFormValues) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof InventoryFormValues, string>> = {}

    if (!values.name.trim()) {
      nextErrors.name = 'Name is required'
    }

    const quantity = Number(values.quantity)
    if (Number.isNaN(quantity) || quantity < 0) {
      nextErrors.quantity = 'Quantity must be 0 or greater'
    }

    const price = Number(values.price)
    if (Number.isNaN(price) || price < 0) {
      nextErrors.price = 'Price must be 0 or greater'
    }

    const threshold = Number(values.low_stock_threshold)
    if (Number.isNaN(threshold) || threshold < 0) {
      nextErrors.low_stock_threshold = 'Threshold must be 0 or greater'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    await onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      quantity: Number(values.quantity),
      price: Number(values.price),
      low_stock_threshold: Number(values.low_stock_threshold),
    })
  }

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <FormField
        label="Name"
        name="name"
        value={values.name}
        onChange={handleChange('name')}
        error={errors.name}
        required
      />
      <FormField
        label="Description"
        name="description"
        value={values.description}
        onChange={handleChange('description')}
        error={errors.description}
      />
      <FormField
        label="Quantity"
        name="quantity"
        type="number"
        value={values.quantity}
        onChange={handleChange('quantity')}
        error={errors.quantity}
        required
      />
      <FormField
        label="Price"
        name="price"
        type="number"
        value={values.price}
        onChange={handleChange('price')}
        error={errors.price}
        required
      />
      <FormField
        label="Low Stock Threshold"
        name="low_stock_threshold"
        type="number"
        value={values.low_stock_threshold}
        onChange={handleChange('low_stock_threshold')}
        error={errors.low_stock_threshold}
        required
      />

      <div className="inventory-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialItem ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
