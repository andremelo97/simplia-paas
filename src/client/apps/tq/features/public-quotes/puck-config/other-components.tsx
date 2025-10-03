import React from 'react'
import { BrandingData } from '../../../services/branding'
import * as Icons from './icons'

const verticalPaddingOptions = [
  { label: '0px', value: 0 },
  { label: '8px', value: 8 },
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '32px', value: 32 },
  { label: '40px', value: 40 },
  { label: '48px', value: 48 },
  { label: '56px', value: 56 },
  { label: '64px', value: 64 },
  { label: '72px', value: 72 },
  { label: '80px', value: 80 },
  { label: '88px', value: 88 },
  { label: '96px', value: 96 },
  { label: '104px', value: 104 },
  { label: '112px', value: 112 },
  { label: '120px', value: 120 },
  { label: '128px', value: 128 },
  { label: '136px', value: 136 },
  { label: '144px', value: 144 },
  { label: '152px', value: 152 },
  { label: '160px', value: 160 },
]

export const createOtherComponents = (branding: BrandingData) => ({
  CardContainer: {
    fields: {
      title: {
        type: 'text' as const,
      },
      description: {
        type: 'textarea' as const,
      },
      padding: {
        type: 'select' as const,
        options: [
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' },
        ],
      },
      content: {
        type: 'slot' as const,
      },
    },
    defaultProps: {
      title: 'Card Title',
      description: 'Card description goes here',
      padding: 'md',
    },
    render: ({ title, description, padding, content: Content }: any) => {
      const paddingClasses = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      }
      return (
        <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${paddingClasses[padding as keyof typeof paddingClasses]}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          <Content />
        </div>
      )
    },
  },
  CardWithIcon: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'title',
      },
      description: {
        type: 'textarea' as const,
        label: 'description',
      },
      icon: {
        type: 'select' as const,
        label: 'icon',
        options: [
          // Ícones médicos e de saúde
          { label: 'stethoscope', value: 'stethoscope' },
          { label: 'heart-pulse', value: 'heart-pulse' },
          { label: 'pill', value: 'pill' },
          { label: 'syringe', value: 'syringe' },
          { label: 'thermometer', value: 'thermometer' },
          { label: 'bandage', value: 'bandage' },
          { label: 'tooth', value: 'tooth' },
          { label: 'eye', value: 'eye' },
          { label: 'brain', value: 'brain' },
          { label: 'dna', value: 'dna' },
          { label: 'microscope', value: 'microscope' },
          { label: 'x-ray', value: 'x-ray' },

          // Tratamentos e procedimentos
          { label: 'treatment', value: 'treatment' },
          { label: 'surgery', value: 'surgery' },
          { label: 'therapy', value: 'therapy' },
          { label: 'rehabilitation', value: 'rehabilitation' },
          { label: 'consultation', value: 'consultation' },
          { label: 'diagnosis', value: 'diagnosis' },
          { label: 'prescription', value: 'prescription' },
          { label: 'vaccine', value: 'vaccine' },

          // Documentação e comunicação
          { label: 'clipboard', value: 'clipboard' },
          { label: 'file-text', value: 'file-text' },
          { label: 'notes', value: 'notes' },
          { label: 'transcript', value: 'transcript' },
          { label: 'quote', value: 'quote' },
          { label: 'document', value: 'document' },
          { label: 'report', value: 'report' },
          { label: 'calendar', value: 'calendar' },

          // Pessoas e relacionamento
          { label: 'doctor', value: 'doctor' },
          { label: 'patient', value: 'patient' },
          { label: 'family', value: 'family' },
          { label: 'team', value: 'team' },
          { label: 'support', value: 'support' },

          // Comunicação e contato
          { label: 'phone', value: 'phone' },
          { label: 'mail', value: 'mail' },
          { label: 'message', value: 'message' },
          { label: 'chat', value: 'chat' },
          { label: 'video-call', value: 'video-call' },

          // Status e aprovação
          { label: 'check', value: 'check' },
          { label: 'check-circle', value: 'check-circle' },
          { label: 'approved', value: 'approved' },
          { label: 'verified', value: 'verified' },
          { label: 'star', value: 'star' },
          { label: 'award', value: 'award' },

          // Financeiro e pagamento
          { label: 'dollar', value: 'dollar' },
          { label: 'credit-card', value: 'credit-card' },
          { label: 'payment', value: 'payment' },
          { label: 'invoice', value: 'invoice' },
          { label: 'receipt', value: 'receipt' },

          // Tempo e agendamento
          { label: 'clock', value: 'clock' },
          { label: 'schedule', value: 'schedule' },
          { label: 'appointment', value: 'appointment' },
          { label: 'reminder', value: 'reminder' },

          // Navegação e ações
          { label: 'arrow-right', value: 'arrow-right' },
          { label: 'arrow-down', value: 'arrow-down' },
          { label: 'arrow-up', value: 'arrow-up' },
          { label: 'arrow-left', value: 'arrow-left' },
          { label: 'plus', value: 'plus' },
          { label: 'info', value: 'info' },
          { label: 'warning', value: 'warning' },
          { label: 'alert', value: 'alert' },

          // Localização e acesso
          { label: 'location', value: 'location' },
          { label: 'home', value: 'home' },
          { label: 'hospital', value: 'hospital' },
          { label: 'clinic', value: 'clinic' },

          // Tecnologia e inovação
          { label: 'shield', value: 'shield' },
          { label: 'lock', value: 'lock' },
          { label: 'settings', value: 'settings' },
          { label: 'download', value: 'download' },
          { label: 'upload', value: 'upload' },
        ],
      },
      mode: {
        type: 'radio' as const,
        label: 'mode',
        options: [
          { label: 'card', value: 'card' },
          { label: 'flat', value: 'flat' },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
    },
    defaultProps: {
      title: 'Title',
      description: 'Description',
      icon: 'stethoscope',
      mode: 'card',
      verticalPadding: 0,
    },
    render: ({ title, description, icon, mode, verticalPadding }: any) => {
      const getIconComponent = () => {
        const iconProps = { size: mode === 'flat' ? 24 : 20 }

        switch (icon) {
          // Ícones médicos e de saúde
          case 'stethoscope': return <Icons.Stethoscope {...iconProps} />
          case 'heart-pulse': return <Icons.Heart {...iconProps} />
          case 'pill': return <Icons.Pill {...iconProps} />
          case 'syringe': return <Icons.Syringe {...iconProps} />
          case 'thermometer': return <Icons.Thermometer {...iconProps} />
          case 'bandage': return <Icons.Bandage {...iconProps} />
          case 'tooth': return <Icons.Cross {...iconProps} />
          case 'eye': return <Icons.Eye {...iconProps} />
          case 'brain': return <Icons.Brain {...iconProps} />
          case 'dna': return <Icons.Dna {...iconProps} />
          case 'microscope': return <Icons.Microscope {...iconProps} />
          case 'x-ray': return <Icons.Scan {...iconProps} />

          // Tratamentos e procedimentos
          case 'treatment': return <Icons.Cross {...iconProps} />
          case 'surgery': return <Icons.Building2 {...iconProps} />
          case 'therapy': return <Icons.Handshake {...iconProps} />
          case 'rehabilitation': return <Icons.Activity {...iconProps} />
          case 'consultation': return <Icons.UserCog {...iconProps} />
          case 'diagnosis': return <Icons.Search {...iconProps} />
          case 'prescription': return <Icons.ClipboardList {...iconProps} />
          case 'vaccine': return <Icons.Shield {...iconProps} />

          // Documentação e comunicação
          case 'clipboard': return <Icons.Clipboard {...iconProps} />
          case 'file-text': return <Icons.FileText {...iconProps} />
          case 'notes': return <Icons.StickyNote {...iconProps} />
          case 'transcript': return <Icons.FileType {...iconProps} />
          case 'quote': return <Icons.MessageSquare {...iconProps} />
          case 'document': return <Icons.File {...iconProps} />
          case 'report': return <Icons.BarChart3 {...iconProps} />
          case 'calendar': return <Icons.Calendar {...iconProps} />

          // Pessoas e relacionamento
          case 'doctor': return <Icons.UserCog {...iconProps} />
          case 'patient': return <Icons.User {...iconProps} />
          case 'family': return <Icons.Users {...iconProps} />
          case 'team': return <Icons.Users2 {...iconProps} />
          case 'support': return <Icons.HeartHandshake {...iconProps} />

          // Comunicação e contato
          case 'phone': return <Icons.Phone {...iconProps} />
          case 'mail': return <Icons.Mail {...iconProps} />
          case 'message': return <Icons.MessageCircle {...iconProps} />
          case 'chat': return <Icons.MessageSquare {...iconProps} />
          case 'video-call': return <Icons.Video {...iconProps} />

          // Status e aprovação
          case 'check': return <Icons.Check {...iconProps} />
          case 'check-circle': return <Icons.CheckCircle {...iconProps} />
          case 'approved': return <Icons.ThumbsUp {...iconProps} />
          case 'verified': return <Icons.Verified {...iconProps} />
          case 'star': return <Icons.Star {...iconProps} />
          case 'award': return <Icons.Award {...iconProps} />

          // Financeiro e pagamento
          case 'dollar': return <Icons.DollarSign {...iconProps} />
          case 'credit-card': return <Icons.CreditCard {...iconProps} />
          case 'payment': return <Icons.Banknote {...iconProps} />
          case 'invoice': return <Icons.Receipt {...iconProps} />
          case 'receipt': return <Icons.FileSpreadsheet {...iconProps} />

          // Tempo e agendamento
          case 'clock': return <Icons.Clock {...iconProps} />
          case 'schedule': return <Icons.CalendarDays {...iconProps} />
          case 'appointment': return <Icons.CalendarCheck {...iconProps} />
          case 'reminder': return <Icons.AlarmClock {...iconProps} />

          // Navegação e ações
          case 'arrow-right': return <Icons.ArrowRight {...iconProps} />
          case 'arrow-down': return <Icons.ArrowDown {...iconProps} />
          case 'arrow-up': return <Icons.ArrowUp {...iconProps} />
          case 'arrow-left': return <Icons.ArrowLeft {...iconProps} />
          case 'plus': return <Icons.Plus {...iconProps} />
          case 'info': return <Icons.Info {...iconProps} />
          case 'warning': return <Icons.AlertTriangle {...iconProps} />
          case 'alert': return <Icons.AlertCircle {...iconProps} />

          // Localização e acesso
          case 'location': return <Icons.MapPin {...iconProps} />
          case 'home': return <Icons.Home {...iconProps} />
          case 'hospital': return <Icons.Hospital {...iconProps} />
          case 'clinic': return <Icons.Building {...iconProps} />

          // Tecnologia e inovação
          case 'shield': return <Icons.ShieldCheck {...iconProps} />
          case 'lock': return <Icons.Lock {...iconProps} />
          case 'settings': return <Icons.Settings {...iconProps} />
          case 'download': return <Icons.Download {...iconProps} />
          case 'upload': return <Icons.Upload {...iconProps} />

          default: return <Icons.Stethoscope {...iconProps} />
        }
      }

      if (mode === 'card') {
        // Modo Card: Layout horizontal compacto com ícone pequeno à esquerda
        return (
          <div
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
            style={{
              paddingTop: `${Math.max(24, verticalPadding)}px`,
              paddingBottom: `${Math.max(24, verticalPadding)}px`,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {getIconComponent()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        )
      } else {
        // Modo Flat: Layout vertical centralizado com ícone grande no topo
        return (
          <div
            className="text-center p-8"
            style={{
              paddingTop: `${Math.max(32, verticalPadding)}px`,
              paddingBottom: `${Math.max(32, verticalPadding)}px`,
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 text-white rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {getIconComponent()}
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        )
      }
    },
  },
  Hero: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'title',
      },
      description: {
        type: 'textarea' as const,
        label: 'description',
      },
      buttons: {
        type: 'array' as const,
        label: 'buttons',
        arrayFields: {
          label: {
            type: 'text' as const,
            label: 'label',
          },
          href: {
            type: 'text' as const,
            label: 'href',
          },
          variant: {
            type: 'select' as const,
            label: 'variant',
            options: [
              { label: 'primary', value: 'primary' },
              { label: 'secondary', value: 'secondary' },
              { label: 'tertiary', value: 'tertiary' },
            ],
          },
        },
        defaultItemProps: {
          label: 'Learn more',
          href: '#',
          variant: 'primary',
        },
      },
      align: {
        type: 'radio' as const,
        label: 'align',
        options: [
          { label: 'left', value: 'left' },
          { label: 'center', value: 'center' },
        ],
      },
      showMedia: {
        type: 'radio' as const,
        label: 'show media',
        options: [
          { label: 'yes', value: true },
          { label: 'no', value: false },
        ],
      },
      media: {
        type: 'radio' as const,
        label: 'media type',
        options: [
          { label: 'image', value: 'image' },
          { label: 'video', value: 'video' },
        ],
      },
      url: {
        type: 'text' as const,
        label: 'url',
      },
      mode: {
        type: 'radio' as const,
        label: 'mode',
        options: [
          { label: 'inline', value: 'inline' },
          { label: 'bg', value: 'bg' },
        ],
      },
      padding: {
        type: 'text' as const,
        label: 'padding',
      },
    },
    defaultProps: {
      title: 'Hero Title',
      description: 'Hero description click here.',
      buttons: [
        {
          label: 'Click here',
          href: '#',
          variant: 'primary',
        },
      ],
      align: 'left',
      showMedia: false,
      media: 'image',
      url: '',
      mode: 'inline',
      padding: '64px',
    },
    render: ({ title, description, buttons, align, showMedia, media, url, mode, padding }: any) => {
      const alignClasses = {
        left: 'text-left',
        center: 'text-center',
      }

      const getButtonVariantStyles = (variant: string) => {
        switch (variant) {
          case 'primary':
            return {
              backgroundColor: branding.primaryColor,
              color: 'white',
              borderColor: branding.primaryColor
            }
          case 'secondary':
            return {
              backgroundColor: branding.secondaryColor,
              color: 'white',
              borderColor: branding.secondaryColor
            }
          case 'tertiary':
            return {
              backgroundColor: branding.tertiaryColor,
              color: 'white',
              borderColor: branding.tertiaryColor
            }
          default:
            return {
              backgroundColor: branding.primaryColor,
              color: 'white',
              borderColor: branding.primaryColor
            }
        }
      }

      const renderMedia = () => {
        if (!showMedia || !url) return null

        if (media === 'video') {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={url}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                title="Hero Video"
              />
            </div>
          )
        } else if (media === 'image') {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )
        }
        return null
      }

      // Background mode: image/video as background
      if (mode === 'bg' && showMedia && url && media === 'image') {
        return (
          <div
            className="relative px-8 min-h-[500px] flex items-center"
            style={{
              paddingTop: padding ? `${parseInt(padding)}px` : '64px',
              paddingBottom: padding ? `${parseInt(padding)}px` : '64px',
            }}
          >
            {/* Background image layer */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* Gradient overlay - white from left fading to transparent */}
            <div
              className="absolute inset-0"
              style={{
                background: align === 'center'
                  ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75))'
                  : 'linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.2) 70%, rgba(255, 255, 255, 0) 100%)',
              }}
            />
            {/* Content */}
            <div className="max-w-6xl mx-auto relative z-10 w-full">
              <div className={align === 'center' ? 'max-w-3xl mx-auto text-center' : 'max-w-3xl text-left'}>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {title}
                </h1>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  {description}
                </p>
                {buttons && buttons.length > 0 && (
                  <div className={`flex flex-wrap gap-4 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {buttons.map((button: any, index: number) => (
                      <a
                        key={index}
                        href={button.href}
                        className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors border"
                        style={getButtonVariantStyles(button.variant)}
                      >
                        {button.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      // Inline mode (default)
      return (
        <div
          className="bg-white px-8"
          style={{
            paddingTop: padding ? `${parseInt(padding)}px` : '64px',
            paddingBottom: padding ? `${parseInt(padding)}px` : '64px',
          }}
        >
          <div className="max-w-6xl mx-auto">
            {align === 'center' ? (
              // Layout centralizado - single column
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {title}
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {description}
                </p>
                {buttons && buttons.length > 0 && (
                  <div className={`flex flex-wrap gap-4 justify-center ${showMedia && url ? 'mb-8' : ''}`}>
                    {buttons.map((button: any, index: number) => (
                      <a
                        key={index}
                        href={button.href}
                        className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors border"
                        style={getButtonVariantStyles(button.variant)}
                      >
                        {button.label}
                      </a>
                    ))}
                  </div>
                )}
                {renderMedia()}
              </div>
            ) : (
              // Layout left - two columns (or single column if no media)
              <div className={showMedia && url ? "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" : ""}>
                <div className="text-left">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    {title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    {description}
                  </p>
                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-4 justify-start">
                      {buttons.map((button: any, index: number) => (
                        <a
                          key={index}
                          href={button.href}
                          className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors border"
                          style={getButtonVariantStyles(button.variant)}
                        >
                          {button.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {showMedia && url && (
                  <div>
                    {renderMedia()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  Logos: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'title',
      },
      logos: {
        type: 'array' as const,
        label: 'logos',
        arrayFields: {
          alt: {
            type: 'text' as const,
            label: 'alt',
          },
          imageUrl: {
            type: 'text' as const,
            label: 'imageUrl',
          },
        },
        defaultItemProps: {
          alt: '',
          imageUrl: '',
        },
      },
    },
    defaultProps: {
      title: 'Trusted by leading companies',
      logos: [
        { alt: 'Company 1', imageUrl: '' },
        { alt: 'Company 2', imageUrl: '' },
        { alt: 'Company 3', imageUrl: '' },
        { alt: 'Company 4', imageUrl: '' },
      ],
    },
    render: ({ title, logos }: any) => {
      return (
        <div className="text-center py-12">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-8">{title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center max-w-4xl mx-auto">
            {logos && logos.length > 0 ? (
              logos.map((logo: any, index: number) => (
                <div key={index} className="flex items-center justify-center h-16 bg-gray-100 rounded p-4">
                  {logo.imageUrl ? (
                    <img
                      src={logo.imageUrl}
                      alt={logo.alt || `Logo ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {logo.alt || `Logo ${index + 1}`}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center h-16 bg-gray-100 rounded">
                <span className="text-gray-500 text-sm">No logos added</span>
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  Stats: {
    fields: {
      itemsPerRow: {
        type: 'select' as const,
        label: 'Items per row',
        options: [
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
        ],
      },
      items: {
        type: 'array' as const,
        label: 'items',
        arrayFields: {
          title: {
            type: 'text' as const,
            label: 'title',
          },
          description: {
            type: 'text' as const,
            label: 'description',
          },
          value: {
            type: 'text' as const,
            label: 'value',
          },
        },
        defaultItemProps: {
          title: 'Stat',
          description: 'Description',
          value: '1,000',
        },
      },
    },
    defaultProps: {
      itemsPerRow: 3,
      items: [
        { title: 'Stat', description: 'Happy Customers', value: '10K+' },
        { title: 'Stat', description: 'Satisfaction Rate', value: '99%' },
        { title: 'Stat', description: 'Support Available', value: '24/7' },
      ],
    },
    render: ({ itemsPerRow, items }: any) => {
      const getGridClasses = () => {
        switch (itemsPerRow) {
          case 1: return 'grid-cols-1'
          case 2: return 'grid-cols-1 md:grid-cols-2'
          case 3: return 'grid-cols-1 md:grid-cols-3'
          default: return 'grid-cols-1 md:grid-cols-3'
        }
      }

      return (
        <div className={`grid ${getGridClasses()} gap-8 py-12`}>
          {items && items.length > 0 ? (
            items.map((item: any, index: number) => (
              <div key={index} className="text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{ color: branding.primaryColor }}
                >
                  {item.value}
                </div>
                <div className="text-gray-600">
                  {item.description}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No stats added
            </div>
          )}
        </div>
      )
    },
  },
})
