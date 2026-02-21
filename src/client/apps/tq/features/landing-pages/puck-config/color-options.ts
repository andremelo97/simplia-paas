// Centralized color options for Puck components

// Google Fonts options - popular fonts for web
export const fontOptions = [
  { label: 'Default (System)', value: 'inherit' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Source Sans Pro', value: 'Source Sans Pro' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Ubuntu', value: 'Ubuntu' },
  { label: 'Rubik', value: 'Rubik' },
  { label: 'Work Sans', value: 'Work Sans' },
  { label: 'Quicksand', value: 'Quicksand' },
  { label: 'Barlow', value: 'Barlow' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Manrope', value: 'Manrope' },
]

// Max width options for text components
export const maxWidthOptions = [
  { label: 'Full width', value: '100%' },
  { label: '800px', value: '800px' },
  { label: '700px', value: '700px' },
  { label: '600px', value: '600px' },
  { label: '500px', value: '500px' },
  { label: '400px', value: '400px' },
  { label: '300px', value: '300px' },
]

// Helper to load Google Font dynamically
export const loadGoogleFont = (fontFamily: string) => {
  if (!fontFamily || fontFamily === 'inherit') return

  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(fontId)) return

  const link = document.createElement('link')
  link.id = fontId
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`
  document.head.appendChild(link)
}

export const textColorOptions = [
  { label: 'Default (Gray 900)', value: 'default' },
  { label: 'Muted (Gray 600)', value: 'muted' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
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
  { label: 'Black', value: '#000000' },
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
  { label: 'Black', value: '#000000' },
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
  if (color === 'white') return '#ffffff'
  if (color === 'dark') return '#000000'
  return color
}
