import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LucideIcon
} from 'lucide-react'
import { cn } from '@client/common/utils/cn'
import { Tooltip } from '@client/common/ui'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  children?: NavigationItem[]
  onClick?: () => void
  highlight?: boolean
}

export interface SidebarAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'danger'
}

export interface SidebarProps {
  navigation: NavigationItem[]
  isOpen: boolean
  onToggle: () => void
  title?: string
  subtitle?: string
  className?: string
  bottomActions?: SidebarAction[]
}

export const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  isOpen,
  onToggle,
  title = "LivoCare",
  subtitle = "Platform",
  className,
  bottomActions
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [manuallyCollapsed, setManuallyCollapsed] = useState<string[]>([])

  // Auto-expand parent items when a child is active (only if not manually collapsed)
  React.useEffect(() => {
    const activeParents = navigation
      .filter(item => item.children?.some(child => location.pathname.startsWith(child.href)))
      .map(item => item.name)

    if (activeParents.length > 0) {
      setExpandedItems(prev => {
        const toExpand = activeParents.filter(name => !manuallyCollapsed.includes(name))
        return [...new Set([...prev, ...toExpand])]
      })
    }
  }, [location.pathname, navigation, manuallyCollapsed])

  // Clear manual collapse when navigating away from the item's children
  React.useEffect(() => {
    setManuallyCollapsed(prev =>
      prev.filter(name => {
        const item = navigation.find(n => n.name === name)
        return item?.children?.some(child => location.pathname.startsWith(child.href))
      })
    )
  }, [location.pathname, navigation])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const isCurrentlyExpanded = prev.includes(itemName)
      if (isCurrentlyExpanded) {
        // User is collapsing: track as manually collapsed
        setManuallyCollapsed(mc => [...new Set([...mc, itemName])])
        return prev.filter(name => name !== itemName)
      } else {
        // User is expanding: remove from manually collapsed
        setManuallyCollapsed(mc => mc.filter(name => name !== itemName))
        return [...prev, itemName]
      }
    })
  }

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.children) {
      return item.children.some(child => location.pathname.startsWith(child.href))
    }
    return location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  }

  return (
    <motion.div
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        className
      )}
      style={{ width: isOpen ? '13.125rem' : '4rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/50 h-16 px-6 shadow-sm bg-white">
        <motion.div 
          className="flex items-center space-x-3"
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen && (
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-lg text-gray-500">{title}</h1>
                <button
                  onClick={onToggle}
                  className="transition-all hover:bg-purple-50/50 rounded-md p-1"
                  style={{
                    color: '#B725B7',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          )}
        </motion.div>
        
        {!isOpen && (
          <div className="flex justify-center w-full">
            <button
              onClick={onToggle}
              className="transition-all hover:bg-purple-50/50 rounded-md p-1"
              style={{ 
                color: '#B725B7',
                background: 'transparent',
                border: 'none',
                outline: 'none'
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 min-h-0", isOpen && "overflow-y-auto")} style={{ padding: '1rem', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
        {navigation.map((item, index) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.name)
          const isActive = isItemActive(item)

          // Item with children - render as expandable
          if (hasChildren) {
            return (
              <div key={item.name}>
                {/* Parent item */}
                <button
                  onClick={() => {
                    if (isOpen) {
                      // Sidebar open: just toggle submenu, don't navigate
                      toggleExpanded(item.name)
                    } else {
                      // Sidebar collapsed: navigate to the parent href
                      navigate(item.href)
                    }
                  }}
                  style={{
                    color: isActive ? '#B725B7' : '#000000',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className={cn(
                    "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-colors duration-200",
                    "hover:text-[#B725B7] hover:bg-purple-50/50",
                    isActive && "bg-purple-50/50",
                    !isOpen && "justify-center"
                  )}
                >
                  <Tooltip content={item.name} disabled={isOpen} side="right">
                    <span className="flex items-center justify-center">
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: 'inherit',
                          width: '1.25rem',
                          height: '1.25rem',
                          minWidth: '1.25rem',
                          minHeight: '1.25rem',
                          flexShrink: 0
                        }}
                      />
                    </span>
                  </Tooltip>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex-1 flex items-center justify-between"
                      style={{ marginLeft: '0.625rem' }}
                    >
                      <span className="font-medium text-sm">{item.name}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </motion.div>
                  )}
                </button>

                {/* Children items - only show when sidebar is open */}
                <AnimatePresence>
                  {isOpen && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon
                          return (
                            <NavLink
                              key={child.name}
                              to={child.href}
                              style={({ isActive: childIsActive }) => ({
                                color: childIsActive ? '#B725B7' : '#6B7280',
                                textDecoration: 'none'
                              })}
                              className={({ isActive: childIsActive }) =>
                                cn(
                                  "group relative flex items-center rounded-lg p-2 text-sm transition-colors duration-200",
                                  "hover:text-[#B725B7] hover:bg-purple-50/50",
                                  childIsActive && "bg-purple-50/50 text-[#B725B7]"
                                )
                              }
                            >
                              <ChildIcon
                                className="w-4 h-4 mr-2"
                                style={{ flexShrink: 0 }}
                              />
                              <span>{child.name}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          // Regular item without children
          // If item has onClick, render as button instead of NavLink
          if (item.onClick) {
            const isHighlight = item.highlight === true
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className={cn(
                  "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-all duration-200 w-full text-left",
                  "hover:bg-purple-50/50 hover:border hover:border-purple-200/30",
                  !isHighlight && "hover:text-[#B725B7]",
                  !isOpen && "justify-center"
                )}
                style={{ color: isHighlight ? undefined : '#000000' }}
              >
                <Tooltip content={item.name} disabled={isOpen} side="right">
                  {isHighlight ? (
                    <span className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}>
                      <Icon className="w-3.5 h-3.5 text-white" style={{ flexShrink: 0 }} />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: 'inherit',
                          width: '1.25rem',
                          height: '1.25rem',
                          minWidth: '1.25rem',
                          minHeight: '1.25rem',
                          flexShrink: 0
                        }}
                      />
                    </span>
                  )}
                </Tooltip>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex-1"
                    style={{ marginLeft: '0.625rem' }}
                  >
                    {isHighlight ? (
                      <div
                        className="font-medium text-sm"
                        style={{
                          background: 'linear-gradient(135deg, #B725B7, #E91E63)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {item.name}
                      </div>
                    ) : (
                      <div className="font-medium text-sm">{item.name}</div>
                    )}
                  </motion.div>
                )}
              </button>
            )
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              style={({ isActive }) => ({
                color: isActive ? '#B725B7' : '#000000',
                textDecoration: 'none'
              })}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-colors duration-200",
                  "hover:text-[#B725B7] hover:bg-purple-50/50 hover:border hover:border-purple-200/30",
                  isActive && "bg-purple-50/50 border border-purple-200/30",
                  !isOpen && "justify-center"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Tooltip content={item.name} disabled={isOpen} side="right">
                    <span className="flex items-center justify-center">
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: 'inherit',
                          width: '1.25rem',
                          height: '1.25rem',
                          minWidth: '1.25rem',
                          minHeight: '1.25rem',
                          flexShrink: 0
                        }}
                      />
                    </span>
                  </Tooltip>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex-1"
                      style={{ marginLeft: '0.625rem' }}
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                    </motion.div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      {bottomActions && bottomActions.length > 0 && (
        <div style={{ padding: '0.5rem 1rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {bottomActions.map((action) => {
            const ActionIcon = action.icon
            const isDanger = action.variant === 'danger'
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                style={{
                  color: '#6B7280',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                className={cn(
                  "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-colors duration-200",
                  isDanger
                    ? "hover:text-red-600 hover:bg-red-50/50"
                    : "hover:text-[#B725B7] hover:bg-purple-50/50",
                  !isOpen && "justify-center"
                )}
              >
                <Tooltip content={action.label} disabled={isOpen} side="right">
                  <span className="flex items-center justify-center">
                    <ActionIcon
                      className="w-5 h-5"
                      style={{
                        color: 'inherit',
                        width: '1.25rem',
                        height: '1.25rem',
                        minWidth: '1.25rem',
                        minHeight: '1.25rem',
                        flexShrink: 0
                      }}
                    />
                  </span>
                </Tooltip>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1"
                    style={{ marginLeft: '0.625rem' }}
                  >
                    <div className="font-medium text-sm">{action.label}</div>
                  </motion.div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
