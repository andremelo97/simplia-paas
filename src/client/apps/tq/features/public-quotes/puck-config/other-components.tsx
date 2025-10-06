import React from 'react'
import { BrandingData } from '../../../services/branding'
import * as Icons from './icons'
import { textColorOptions, backgroundColorOptions, iconColorOptions, resolveColor } from './color-options'

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

const dividerColorOptions = [
  { label: 'Light Gray', value: '#e5e7eb' },
  { label: 'Gray', value: '#d1d5db' },
  { label: 'Dark Gray', value: '#9ca3af' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Tertiary', value: 'tertiary' },
  { label: 'Black', value: '#111827' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#10b981' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
]

const dividerThicknessOptions = [
  { label: '1px (Thin)', value: 1 },
  { label: '2px', value: 2 },
  { label: '3px', value: 3 },
  { label: '4px', value: 4 },
  { label: '5px', value: 5 },
  { label: '6px (Thick)', value: 6 },
  { label: '8px', value: 8 },
  { label: '10px', value: 10 },
]

const dividerSpacingOptions = [
  { label: '0px (None)', value: 0 },
  { label: '8px (XS)', value: 8 },
  { label: '16px (S)', value: 16 },
  { label: '24px (M)', value: 24 },
  { label: '32px (L)', value: 32 },
  { label: '40px (XL)', value: 40 },
  { label: '48px (XXL)', value: 48 },
  { label: '64px (3XL)', value: 64 },
  { label: '80px (4XL)', value: 80 },
]

export const createOtherComponents = (branding: BrandingData) => ({
  Divider: {
    fields: {
      color: {
        type: 'select' as const,
        label: 'Color',
        options: dividerColorOptions,
      },
      thickness: {
        type: 'select' as const,
        label: 'Thickness',
        options: dividerThicknessOptions,
      },
      spacing: {
        type: 'select' as const,
        label: 'Spacing (Top & Bottom)',
        options: dividerSpacingOptions,
      },
    },
    defaultProps: {
      color: '#e5e7eb',
      thickness: 1,
      spacing: 24,
    },
    render: ({ color, thickness, spacing }: any) => {
      const uniqueId = `divider-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div
            className={uniqueId}
            style={{
              width: '100%',
              paddingTop: `${spacing}px`,
              paddingBottom: `${spacing}px`,
            }}
          >
            <hr
              style={{
                border: 'none',
                borderTop: `${thickness}px solid ${resolveColor(color, branding)}`,
                margin: 0,
              }}
            />
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding-top: ${spacing > 0 ? Math.max(spacing, 16) : 0}px;
                padding-bottom: ${spacing > 0 ? Math.max(spacing, 16) : 0}px;
              }
            }
          `}</style>
        </>
      )
    },
  },
  CardContainer: {
    fields: {
      showTitle: {
        type: 'radio' as const,
        label: 'Show Title',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      title: {
        type: 'text' as const,
      },
      showDescription: {
        type: 'radio' as const,
        label: 'Show Description',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
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
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: backgroundColorOptions,
      },
      borderColor: {
        type: 'select' as const,
        label: 'Border Color',
        options: dividerColorOptions,
      },
      titleColor: {
        type: 'select' as const,
        label: 'Title Color',
        options: textColorOptions,
      },
      descriptionColor: {
        type: 'select' as const,
        label: 'Description Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      showTitle: true,
      title: 'Card Title',
      showDescription: true,
      description: 'Card description goes here',
      padding: 'md',
      backgroundColor: 'none',
      borderColor: '#e5e7eb',
      titleColor: '#111827',
      descriptionColor: '#4b5563',
    },
    render: ({ showTitle, title, showDescription, description, padding, backgroundColor, borderColor, titleColor, descriptionColor, content: Content }: any) => {
      const basePadding = {
        sm: '12px',
        md: '16px',
        lg: '24px',
      }

      const uniqueId = `card-container-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div
            className={uniqueId}
            style={{
              borderRadius: '8px',
              border: `1px solid ${resolveColor(borderColor, branding)}`,
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              padding: basePadding[padding as keyof typeof basePadding],
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            {showTitle && title && (
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>{title}</h3>
            )}
            {showDescription && description && (
              <p style={{ fontSize: '14px', marginBottom: showTitle && title ? '16px' : '0px', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>{description}</p>
            )}
            <div style={{ marginTop: (showTitle && title) || (showDescription && description) ? '16px' : '0px' }}>
              <Content />
            </div>
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding: ${padding === 'sm' ? '16px' : padding === 'md' ? '24px' : '32px'};
              }
              .${uniqueId} h3 {
                font-size: 18px;
              }
            }
          `}</style>
        </>
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
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: backgroundColorOptions,
      },
      iconColor: {
        type: 'select' as const,
        label: 'Icon Background Color',
        options: iconColorOptions,
      },
      titleColor: {
        type: 'select' as const,
        label: 'Title Color',
        options: textColorOptions,
      },
      descriptionColor: {
        type: 'select' as const,
        label: 'Description Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      title: 'Title',
      description: 'Description',
      icon: 'stethoscope',
      mode: 'card',
      verticalPadding: 0,
      backgroundColor: 'none',
      iconColor: 'primary',
      titleColor: '#111827',
      descriptionColor: '#4b5563',
    },
    render: ({ title, description, icon, mode, verticalPadding, backgroundColor, iconColor, titleColor, descriptionColor }: any) => {
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

      const uniqueId = `card-with-icon-${Math.random().toString(36).substr(2, 9)}`
      const iconId = `icon-${Math.random().toString(36).substr(2, 9)}`

      if (mode === 'card') {
        // Modo Card: Layout horizontal compacto com ícone pequeno à esquerda
        return (
          <>
            <div
              className={uniqueId}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                padding: '16px',
                paddingTop: `${Math.max(16, verticalPadding)}px`,
                paddingBottom: `${Math.max(16, verticalPadding)}px`,
                backgroundColor: resolveColor(backgroundColor, branding),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  className={iconId}
                  style={{
                    flexShrink: 0,
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: resolveColor(iconColor, branding),
                  }}
                >
                  {getIconComponent()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>{title}</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.625', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>{description}</p>
                </div>
              </div>
            </div>
            <style>{`
              @media (min-width: 640px) {
                .${uniqueId} {
                  padding: 24px;
                  padding-top: ${Math.max(24, verticalPadding)}px;
                  padding-bottom: ${Math.max(24, verticalPadding)}px;
                }
                .${uniqueId} > div {
                  gap: 16px;
                }
                .${iconId} {
                  width: 40px;
                  height: 40px;
                }
                .${uniqueId} h3 {
                  font-size: 18px;
                }
              }
            `}</style>
          </>
        )
      } else {
        // Modo Flat: Layout vertical centralizado com ícone grande no topo
        const contentId = `content-${Math.random().toString(36).substr(2, 9)}`

        return (
          <>
            <div
              className={uniqueId}
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '16px',
                paddingTop: `${Math.max(16, verticalPadding)}px`,
                paddingBottom: `${Math.max(16, verticalPadding)}px`,
                backgroundColor: resolveColor(backgroundColor, branding),
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  className={iconId}
                  style={{
                    width: '48px',
                    height: '48px',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    backgroundColor: resolveColor(iconColor, branding),
                  }}
                >
                  {getIconComponent()}
                </div>
                <div className={contentId} style={{ width: '100%', maxWidth: '384px', paddingLeft: '16px', paddingRight: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>{title}</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.625', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>{description}</p>
                </div>
              </div>
            </div>
            <style>{`
              @media (min-width: 640px) {
                .${uniqueId} {
                  padding: 24px;
                  padding-top: ${Math.max(24, verticalPadding)}px;
                  padding-bottom: ${Math.max(24, verticalPadding)}px;
                }
                .${iconId} {
                  width: 56px;
                  height: 56px;
                  margin-bottom: 20px;
                }
                .${contentId} h3 {
                  font-size: 20px;
                  margin-bottom: 16px;
                }
                .${contentId} p {
                  font-size: 16px;
                }
              }
              @media (min-width: 768px) {
                .${uniqueId} {
                  padding: 32px;
                  padding-top: ${Math.max(32, verticalPadding)}px;
                  padding-bottom: ${Math.max(32, verticalPadding)}px;
                }
                .${iconId} {
                  width: 64px;
                  height: 64px;
                  margin-bottom: 24px;
                }
              }
            `}</style>
          </>
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
          style: {
            type: 'radio' as const,
            label: 'style',
            options: [
              { label: 'primary', value: 'primary' },
              { label: 'secondary', value: 'secondary' },
              { label: 'tertiary', value: 'tertiary' },
              { label: 'outline', value: 'outline' },
            ],
          },
          size: {
            type: 'select' as const,
            label: 'Size',
            options: [
              { label: 'Small', value: 'sm' },
              { label: 'Medium', value: 'md' },
              { label: 'Large', value: 'lg' },
            ],
          },
          textColor: {
            type: 'select' as const,
            label: 'Text Color',
            options: textColorOptions,
          },
        },
        defaultItemProps: {
          label: 'Learn more',
          href: '#',
          style: 'primary',
          size: 'md',
          textColor: '#ffffff',
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
      titleColor: {
        type: 'select' as const,
        label: 'Title Color',
        options: textColorOptions,
      },
      descriptionColor: {
        type: 'select' as const,
        label: 'Description Color',
        options: textColorOptions,
      },
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: backgroundColorOptions,
      },
    },
    defaultProps: {
      title: 'Hero Title',
      description: 'Hero description click here.',
      buttons: [
        {
          label: 'Click here',
          href: '#',
          style: 'primary',
          size: 'md',
          textColor: '#ffffff',
        },
      ],
      align: 'left',
      showMedia: false,
      media: 'image',
      url: '',
      mode: 'inline',
      padding: '64px',
      titleColor: '#111827',
      descriptionColor: '#374151',
      backgroundColor: 'none',
    },
    render: ({ title, description, buttons, align, showMedia, media, url, mode, padding, titleColor, descriptionColor, backgroundColor }: any) => {
      const alignClasses = {
        left: 'text-left',
        center: 'text-center',
      }

      const getButtonStyleConfig = (style: string, textColor?: string) => {
        const baseConfig = {
          backgroundColor: branding.primaryColor,
          color: resolveColor(textColor || '#ffffff', branding),
          borderColor: branding.primaryColor
        }

        switch (style) {
          case 'primary':
            return {
              ...baseConfig,
              backgroundColor: branding.primaryColor,
              borderColor: branding.primaryColor
            }
          case 'secondary':
            return {
              ...baseConfig,
              backgroundColor: branding.secondaryColor,
              borderColor: branding.secondaryColor
            }
          case 'tertiary':
            return {
              ...baseConfig,
              backgroundColor: branding.tertiaryColor,
              borderColor: branding.tertiaryColor
            }
          case 'outline':
            return {
              backgroundColor: 'transparent',
              color: resolveColor(textColor || branding.primaryColor, branding),
              borderColor: branding.primaryColor
            }
          default:
            return baseConfig
        }
      }

      const getButtonSizeConfig = (size: string) => {
        switch (size) {
          case 'sm':
            return {
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: '12px'
            }
          case 'md':
            return {
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '14px'
            }
          case 'lg':
            return {
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '16px'
            }
          default:
            return {
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '14px'
            }
        }
      }

      const renderMedia = () => {
        if (!showMedia || !url) return null

        if (media === 'video') {
          return (
            <div style={{ aspectRatio: '16 / 9', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src={url}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
                allowFullScreen
                title="Hero Video"
              />
            </div>
          )
        } else if (media === 'image') {
          return (
            <div style={{ aspectRatio: '16 / 9', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={url}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )
        }
        return null
      }

      // Background mode: image/video as background
      if (mode === 'bg' && showMedia && url && media === 'image') {
        const bgWrapperId = `hero-bg-wrapper-${Math.random().toString(36).substr(2, 9)}`
        const bgTitleId = `hero-bg-title-${Math.random().toString(36).substr(2, 9)}`
        const bgDescId = `hero-bg-desc-${Math.random().toString(36).substr(2, 9)}`
        const bgButtonsId = `hero-bg-buttons-${Math.random().toString(36).substr(2, 9)}`

        return (
          <>
            <div
              className={bgWrapperId}
              style={{
                width: '100%',
                overflowX: 'hidden',
                position: 'relative',
                paddingLeft: '16px',
                paddingRight: '16px',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                paddingTop: padding ? `${Math.max(32, parseInt(padding))}px` : '48px',
                paddingBottom: padding ? `${Math.max(32, parseInt(padding))}px` : '48px',
                backgroundColor: resolveColor(backgroundColor, branding),
              }}
            >
              {/* Background image layer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundImage: `url(${url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              {/* Gradient overlay - white from left fading to transparent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  background: align === 'center'
                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.75))'
                    : 'linear-gradient(to right, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.2) 70%, rgba(255, 255, 255, 0) 100%)',
                }}
              />
              {/* Content */}
              <div style={{ width: '100%', maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '100%', maxWidth: '768px', ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' } : { textAlign: 'left' }), paddingLeft: '16px', paddingRight: '16px' }}>
                  <h1 className={bgTitleId} style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>
                    {title}
                  </h1>
                  <p className={bgDescId} style={{ fontSize: '18px', marginBottom: '24px', lineHeight: '1.625', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>
                    {description}
                  </p>
                  {buttons && buttons.length > 0 && (
                    <div className={bgButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
                      {buttons.map((button: any, index: number) => (
                        <a
                          key={index}
                          href={button.href}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '8px',
                            fontWeight: '500',
                            transition: 'colors 0.2s',
                            border: '1px solid',
                            ...getButtonSizeConfig(button.size || 'md'),
                            ...getButtonStyleConfig(button.style, button.textColor)
                          }}
                        >
                          {button.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <style>{`
              @media (min-width: 640px) {
                .${bgWrapperId} {
                  padding-left: 24px;
                  padding-right: 24px;
                  min-height: 400px;
                }
                .${bgTitleId} {
                  font-size: 42px;
                  margin-bottom: 24px;
                }
                .${bgDescId} {
                  font-size: 20px;
                  margin-bottom: 32px;
                }
                .${bgButtonsId} {
                  gap: 16px;
                }
                .${bgButtonsId} a {
                  padding-left: 24px;
                  padding-right: 24px;
                  padding-top: 12px;
                  padding-bottom: 12px;
                  font-size: 16px;
                }
              }
              @media (min-width: 768px) {
                .${bgWrapperId} {
                  padding-left: 32px;
                  padding-right: 32px;
                  min-height: 500px;
                }
                .${bgTitleId} {
                  font-size: 48px;
                }
                .${bgDescId} {
                  font-size: 22px;
                }
              }
              @media (min-width: 1024px) {
                .${bgTitleId} {
                  font-size: 60px;
                }
              }
            `}</style>
          </>
        )
      }

      // Inline mode (default)
      const inlineWrapperId = `hero-inline-wrapper-${Math.random().toString(36).substr(2, 9)}`
      const inlineTitleId = `hero-inline-title-${Math.random().toString(36).substr(2, 9)}`
      const inlineDescId = `hero-inline-desc-${Math.random().toString(36).substr(2, 9)}`
      const inlineButtonsId = `hero-inline-buttons-${Math.random().toString(36).substr(2, 9)}`
      const inlineGridId = `hero-inline-grid-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div
            className={inlineWrapperId}
            style={{
              width: '100%',
              overflowX: 'hidden',
              backgroundColor: resolveColor(backgroundColor, branding),
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: padding ? `${Math.max(32, parseInt(padding))}px` : '48px',
              paddingBottom: padding ? `${Math.max(32, parseInt(padding))}px` : '48px',
            }}
          >
            <div style={{ width: '100%', maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto' }}>
              {align === 'center' ? (
                // Layout centralizado - single column
                <div style={{ width: '100%', maxWidth: '768px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
                  <h1 className={inlineTitleId} style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>
                    {title}
                  </h1>
                  <p className={inlineDescId} style={{ fontSize: '18px', marginBottom: '24px', lineHeight: '1.625', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>
                    {description}
                  </p>
                  {buttons && buttons.length > 0 && (
                    <div className={inlineButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', ...(showMedia && url ? { marginBottom: '24px' } : {}) }}>
                      {buttons.map((button: any, index: number) => (
                        <a
                          key={index}
                          href={button.href}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '8px',
                            fontWeight: '500',
                            transition: 'colors 0.2s',
                            border: '1px solid',
                            ...getButtonSizeConfig(button.size || 'md'),
                            ...getButtonStyleConfig(button.style, button.textColor)
                          }}
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
                <div className={inlineGridId} style={{ width: '100%', ...(showMedia && url ? { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'center' } : {}) }}>
                  <div style={{ textAlign: 'left' }}>
                    <h1 className={inlineTitleId} style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', wordBreak: 'break-word', color: resolveColor(titleColor, branding) }}>
                      {title}
                    </h1>
                    <p className={inlineDescId} style={{ fontSize: '18px', marginBottom: '24px', lineHeight: '1.625', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>
                      {description}
                    </p>
                    {buttons && buttons.length > 0 && (
                      <div className={inlineButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-start' }}>
                        {buttons.map((button: any, index: number) => (
                          <a
                            key={index}
                            href={button.href}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: '8px',
                              fontWeight: '500',
                              transition: 'colors 0.2s',
                              border: '1px solid',
                              ...getButtonSizeConfig(button.size || 'md'),
                              ...getButtonStyleConfig(button.style, button.textColor)
                            }}
                          >
                            {button.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {showMedia && url && (
                    <div style={{ width: '100%' }}>
                      {renderMedia()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${inlineWrapperId} {
                padding-left: 24px;
                padding-right: 24px;
              }
              .${inlineTitleId} {
                font-size: 42px;
                margin-bottom: 24px;
              }
              .${inlineDescId} {
                font-size: 20px;
                margin-bottom: 32px;
              }
              .${inlineButtonsId} {
                gap: 16px;
                ${showMedia && url ? 'margin-bottom: 32px;' : ''}
              }
              .${inlineButtonsId} a {
                padding-left: 24px;
                padding-right: 24px;
                padding-top: 12px;
                padding-bottom: 12px;
                font-size: 16px;
              }
              .${inlineGridId} {
                gap: 32px;
              }
            }
            @media (min-width: 768px) {
              .${inlineWrapperId} {
                padding-left: 32px;
                padding-right: 32px;
              }
              .${inlineTitleId} {
                font-size: 48px;
              }
              .${inlineDescId} {
                font-size: 22px;
              }
              .${inlineGridId} {
                gap: 48px;
              }
            }
            @media (min-width: 1024px) {
              .${inlineTitleId} {
                font-size: 60px;
              }
              .${inlineGridId} {
                grid-template-columns: ${showMedia && url ? 'repeat(2, 1fr)' : '1fr'};
              }
            }
          `}</style>
        </>
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
      const wrapperId = `logos-wrapper-${Math.random().toString(36).substr(2, 9)}`
      const titleId = `logos-title-${Math.random().toString(36).substr(2, 9)}`
      const gridId = `logos-grid-${Math.random().toString(36).substr(2, 9)}`
      const itemId = `logos-item-${Math.random().toString(36).substr(2, 9)}`
      const textId = `logos-text-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div className={wrapperId} style={{ width: '100%', overflowX: 'hidden', textAlign: 'center', paddingTop: '32px', paddingBottom: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
            <h3 className={titleId} style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>{title}</h3>
            <div className={gridId} style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', alignItems: 'center', maxWidth: '896px', marginLeft: 'auto', marginRight: 'auto' }}>
              {logos && logos.length > 0 ? (
                logos.map((logo: any, index: number) => (
                  <div key={index} className={itemId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', backgroundColor: '#f3f4f6', borderRadius: '4px', padding: '12px' }}>
                    {logo.imageUrl ? (
                      <img
                        src={logo.imageUrl}
                        alt={logo.alt || `Logo ${index + 1}`}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className={textId} style={{ color: '#6b7280', fontSize: '12px' }}>
                        {logo.alt || `Logo ${index + 1}`}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  <span className={textId} style={{ color: '#6b7280', fontSize: '12px' }}>No logos added</span>
                </div>
              )}
            </div>
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${wrapperId} {
                padding-top: 40px;
                padding-bottom: 40px;
              }
              .${titleId} {
                font-size: 14px;
                margin-bottom: 32px;
              }
              .${gridId} {
                gap: 24px;
              }
              .${itemId} {
                height: 56px;
                padding: 16px;
              }
              .${textId} {
                font-size: 14px;
              }
            }
            @media (min-width: 768px) {
              .${wrapperId} {
                padding-top: 48px;
                padding-bottom: 48px;
              }
              .${gridId} {
                grid-template-columns: repeat(4, 1fr);
                gap: 32px;
              }
              .${itemId} {
                height: 64px;
              }
            }
          `}</style>
        </>
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
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: backgroundColorOptions,
      },
      valueColor: {
        type: 'select' as const,
        label: 'Value Color',
        options: textColorOptions,
      },
      descriptionColor: {
        type: 'select' as const,
        label: 'Description Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      itemsPerRow: 3,
      items: [
        { title: 'Stat', description: 'Happy Customers', value: '10K+' },
        { title: 'Stat', description: 'Satisfaction Rate', value: '99%' },
        { title: 'Stat', description: 'Support Available', value: '24/7' },
      ],
      backgroundColor: 'none',
      valueColor: 'primary',
      descriptionColor: '#4b5563',
    },
    render: ({ itemsPerRow, items, backgroundColor, valueColor, descriptionColor }: any) => {
      const gridId = `stats-grid-${Math.random().toString(36).substr(2, 9)}`
      const valueId = `stats-value-${Math.random().toString(36).substr(2, 9)}`
      const descId = `stats-desc-${Math.random().toString(36).substr(2, 9)}`
      const emptyId = `stats-empty-${Math.random().toString(36).substr(2, 9)}`

      const getBaseGridCols = () => {
        // Apply itemsPerRow configuration directly
        if (itemsPerRow === 1) return '1fr'
        if (itemsPerRow === 2) return 'repeat(2, 1fr)'
        return 'repeat(3, 1fr)'
      }

      return (
        <>
          <div
            className={gridId}
            style={{
              display: 'grid',
              gridTemplateColumns: getBaseGridCols(),
              gap: '16px',
              paddingTop: '32px',
              paddingBottom: '32px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            {items && items.length > 0 ? (
              items.map((item: any, index: number) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div
                    className={valueId}
                    style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', wordBreak: 'break-word', color: resolveColor(valueColor, branding) }}
                  >
                    {item.value}
                  </div>
                  <div className={descId} style={{ fontSize: '14px', wordBreak: 'break-word', color: resolveColor(descriptionColor, branding) }}>
                    {item.description}
                  </div>
                </div>
              ))
            ) : (
              <div className={emptyId} style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                No stats added
              </div>
            )}
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${gridId} {
                gap: 24px;
                padding-top: 40px;
                padding-bottom: 40px;
              }
              .${valueId} {
                font-size: 30px;
              }
              .${descId}, .${emptyId} {
                font-size: 16px;
              }
            }
            @media (min-width: 768px) {
              .${gridId} {
                gap: 32px;
                padding-top: 48px;
                padding-bottom: 48px;
              }
              .${valueId} {
                font-size: 36px;
              }
            }
          `}</style>
        </>
      )
    },
  },
})
