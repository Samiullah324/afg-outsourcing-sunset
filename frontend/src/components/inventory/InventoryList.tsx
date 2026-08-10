import { Button } from '@components/atoms/Button'
import type { InventoryItem, StockStatus } from '@/types/inventory'
import './InventoryList.css'

interface InventoryListProps {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  isDeletingId?: number | null
}

const statusLabels: Record<StockStatus, string> = {
  in_stock: 'In Stock',
  low: 'Low',
  out: 'Out',
}

export const InventoryList = ({
  items,
  onEdit,
  onDelete,
  isDeletingId = null,
}: InventoryListProps) => {
  if (items.length === 0) {
    return <div className="inventory-list__empty">No inventory items found.</div>
  }

  return (
    <div className="inventory-list">
      <div className="inventory-list__header">
        <div className="inventory-list__cell">Name</div>
        <div className="inventory-list__cell">Quantity</div>
        <div className="inventory-list__cell">Price</div>
        <div className="inventory-list__cell">Stock Status</div>
        <div className="inventory-list__cell inventory-list__cell--actions">Actions</div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="inventory-list__row">
          <div className="inventory-list__cell">
            <div className="inventory-list__name">{item.name}</div>
            {item.description && (
              <div className="inventory-list__description">{item.description}</div>
            )}
          </div>
          <div className="inventory-list__cell">{item.quantity}</div>
          <div className="inventory-list__cell">${Number(item.price).toFixed(2)}</div>
          <div className="inventory-list__cell">
            <span className={`stock-badge stock-badge--${item.stock_status}`}>
              {statusLabels[item.stock_status]}
            </span>
          </div>
          <div className="inventory-list__cell inventory-list__cell--actions">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              isLoading={isDeletingId === item.id}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
