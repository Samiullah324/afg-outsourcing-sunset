import { ReactNode } from 'react'
import { clsx } from 'clsx'
import './DashboardCard.css'

interface DashboardCardProps {
  title?: string
  value?: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  children?: ReactNode
}

export const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className = '',
  children,
}: DashboardCardProps) => {
  if (children != null) {
    return (
      <div className={clsx('dashboard-card', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={clsx('dashboard-card', className)}>
      <div className="card-header">
        <div className="card-info">
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {icon && (
          <div className="card-icon">
            {icon}
          </div>
        )}
      </div>
      
      <div className="card-content">
        <div className="card-value">{value}</div>
        {trend && (
          <div className={`card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}
