import React, { useState, useRef, useEffect } from 'react'
import { resolveColor } from './color-options'

interface ColorOption {
  label: string
  value: string
}

interface ColorPickerFieldProps {
  value: string
  onChange: (value: string) => void
  options: ColorOption[]
  branding: any
}

const CHECKERBOARD = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px'

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  value,
  onChange,
  options,
  branding,
}) => {
  const [hexInput, setHexInput] = useState('')
  const colorInputRef = useRef<HTMLInputElement>(null)

  const resolvedValue = resolveColor(value || '', branding)
  const isTransparent = resolvedValue === 'transparent'
  const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)

  // Check if current value matches a preset option
  const isPreset = options.some((opt) => opt.value === value)

  // Sync hex input when value changes
  useEffect(() => {
    if (isPreset) {
      setHexInput('')
    } else {
      setHexInput(value || '')
    }
  }, [value, isPreset])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v === '__custom__') return
    onChange(v)
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setHexInput(v)
    if (isHex(v)) {
      onChange(v)
    }
  }

  const handleHexBlur = () => {
    if (hexInput && !isHex(hexInput)) {
      setHexInput(isPreset ? '' : (value || ''))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Preset dropdown (original select with labels) */}
      <select
        value={isPreset ? value : '__custom__'}
        onChange={handleSelectChange}
        style={{
          width: '100%',
          height: 32,
          padding: '0 8px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 13,
          color: '#374151',
          backgroundColor: '#fff',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {!isPreset && (
          <option value="__custom__">
            Custom ({value})
          </option>
        )}
      </select>

      {/* Color picker + hex input */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            overflow: 'hidden',
            flexShrink: 0,
            background: isTransparent ? CHECKERBOARD : resolvedValue,
            cursor: 'pointer',
          }}
          onClick={() => colorInputRef.current?.click()}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={isHex(resolvedValue) ? resolvedValue : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
          />
        </div>

        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          placeholder="#000000"
          spellCheck={false}
          style={{
            flex: 1,
            height: 32,
            padding: '0 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: 'monospace',
            color: '#374151',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

/**
 * Creates a Puck custom color field with preset dropdown, color picker, and hex input.
 */
export const createColorField = (
  label: string,
  options: ColorOption[],
  branding: any
) => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <ColorPickerField
      value={value}
      onChange={onChange}
      options={options}
      branding={branding}
    />
  ),
})
