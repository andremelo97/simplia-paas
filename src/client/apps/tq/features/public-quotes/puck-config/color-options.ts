// Centralized color options for Puck components

export const textColorOptions = [
  { label: 'Default (Gray 900)', value: 'default' },
  { label: 'Muted (Gray 600)', value: 'muted' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#111827' },
  { label: 'Gray 700', value: '#374151' },
  { label: 'Gray 600', value: '#4b5563' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
]

export const backgroundColorOptions = [
  { label: 'None', value: 'none' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f9fafb' },
  { label: 'Gray', value: '#f3f4f6' },
  { label: 'Dark Gray', value: '#e5e7eb' },
  { label: 'Black', value: '#111827' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
]

export const iconColorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Black', value: '#111827' },
  { label: 'White', value: '#ffffff' },
]

// Helper function to resolve colors with branding
export const resolveColor = (color: string, branding: any) => {
  if (color === 'default') return '#111827'
  if (color === 'muted') return '#4b5563'
  if (color === 'primary') return branding.primaryColor
  if (color === 'secondary') return branding.secondaryColor
  if (color === 'tertiary') return branding.tertiaryColor
  if (color === 'none') return 'transparent'
  return color
}
