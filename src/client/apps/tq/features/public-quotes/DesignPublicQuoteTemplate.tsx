import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Puck } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button } from '@client/common/ui'
import { ChevronRight } from 'lucide-react'
import { publicQuotesService } from '../../services/publicQuotes'

// Puck configuration with components for quotes organized by category
const config = {
  components: {
    // Layout Components
    Columns: {
      fields: {
        columns: {
          type: 'number' as const,
        },
      },
      defaultProps: {
        columns: 2,
      },
      render: ({ columns, puck }: any) => {
        const columnClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'
        return (
          <div className={`grid ${columnClass} gap-4`}>
            {puck.renderDropZone(`columns-${columns}`)}
          </div>
        )
      },
    },
    Spacer: {
      fields: {
        size: {
          type: 'select' as const,
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
        },
      },
      defaultProps: {
        size: 'medium',
      },
      render: ({ size }: any) => {
        const heights = { small: 'h-4', medium: 'h-8', large: 'h-16' }
        return <div className={heights[size as keyof typeof heights]} />
      },
    },
    Divider: {
      fields: {},
      defaultProps: {},
      render: () => {
        return <hr className="my-4 border-gray-300" />
      },
    },

    // Typography Components
    Heading: {
      fields: {
        children: {
          type: 'text' as const,
        },
        size: {
          type: 'select' as const,
          options: [
            { label: 'H1 - Extra Large', value: 'h1' },
            { label: 'H2 - Large', value: 'h2' },
            { label: 'H3 - Medium', value: 'h3' },
            { label: 'H4 - Small', value: 'h4' },
          ],
        },
      },
      defaultProps: {
        children: 'Heading',
        size: 'h2',
      },
      render: ({ children, size }: any) => {
        const Tag = size
        const classes = {
          h1: 'text-4xl font-bold',
          h2: 'text-3xl font-bold',
          h3: 'text-2xl font-semibold',
          h4: 'text-xl font-semibold',
        }
        return <Tag className={classes[size as keyof typeof classes]}>{children}</Tag>
      },
    },
    Text: {
      fields: {
        children: {
          type: 'textarea' as const,
        },
        align: {
          type: 'select' as const,
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
      },
      defaultProps: {
        children: 'Enter your text here',
        align: 'left',
      },
      render: ({ children, align }: any) => {
        return <p className={`text-gray-700 text-${align}`}>{children}</p>
      },
    },

    // Quote Data Components
    QuoteNumber: {
      fields: {
        label: {
          type: 'text' as const,
        },
      },
      defaultProps: {
        label: 'Quote #',
      },
      render: ({ label }: any) => {
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="font-bold text-gray-900">{'{{quote.number}}'}</span>
          </div>
        )
      },
    },
    QuoteTotal: {
      fields: {
        label: {
          type: 'text' as const,
        },
      },
      defaultProps: {
        label: 'Total',
      },
      render: ({ label }: any) => {
        return (
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded">
            <span className="text-lg font-semibold">{label}:</span>
            <span className="text-2xl font-bold text-[#B725B7]">{'{{quote.total}}'}</span>
          </div>
        )
      },
    },
    ItemsTable: {
      fields: {
        showDiscount: {
          type: 'radio' as const,
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        showDiscount: true,
      },
      render: ({ showDiscount }: any) => {
        return (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Base Price</th>
                  {showDiscount && (
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                  )}
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Final Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 text-sm">{'{{item.name}}'}</td>
                  <td className="px-4 py-3 text-sm text-right">{'{{item.base_price}}'}</td>
                  {showDiscount && (
                    <td className="px-4 py-3 text-sm text-right text-red-600">{'{{item.discount}}'}</td>
                  )}
                  <td className="px-4 py-3 text-sm text-right font-semibold">{'{{item.final_price}}'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      },
    },

    // Action Components
    Button: {
      fields: {
        text: {
          type: 'text' as const,
        },
        variant: {
          type: 'select' as const,
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
      },
      defaultProps: {
        text: 'Click here',
        variant: 'primary',
      },
      render: ({ text, variant }: any) => {
        const classes = variant === 'primary'
          ? 'bg-[#B725B7] text-white hover:bg-[#9c1f9c]'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        return (
          <button className={`px-6 py-2 rounded font-medium ${classes}`}>
            {text}
          </button>
        )
      },
    },
  },
  categories: {
    layout: {
      components: ['Columns', 'Spacer', 'Divider'],
    },
    typography: {
      components: ['Heading', 'Text'],
    },
    quote: {
      title: 'Quote Data',
      components: ['QuoteNumber', 'QuoteTotal', 'ItemsTable'],
    },
    actions: {
      components: ['Button'],
    },
  },
}

export const DesignPublicQuoteTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<any>(null)
  const [data, setData] = useState<any>({ content: [], root: {} })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [id])

  const loadTemplate = async () => {
    if (!id) return
    try {
      const fetchedTemplate = await publicQuotesService.getTemplate(id)
      setTemplate(fetchedTemplate)

      // Load existing content or initialize empty
      if (fetchedTemplate.content && Object.keys(fetchedTemplate.content).length > 0) {
        setData(fetchedTemplate.content)
      } else {
        setData({ content: [], root: {} })
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const handleSave = async () => {
    if (!id) return
    setIsSaving(true)
    try {
      await publicQuotesService.updateTemplate(id, {
        content: data
      })
      console.log('✅ Template layout saved')
      navigate('/public-quotes/templates')
    } catch (error) {
      console.error('❌ Failed to save template layout:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/public-quotes/templates')
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Design Template Layout</h1>
          <p className="text-sm text-gray-600 mt-1">{template.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={config}
          data={data}
          onPublish={(publishedData: any) => {
            setData(publishedData)
          }}
        />
      </div>
    </div>
  )
}
