import React, { useEffect } from 'react'
import { BrandingData } from '../../../services/branding'
import * as Icons from './icons'
import * as LucideIcons from 'lucide-react'
import { textColorOptions, backgroundColorOptions, iconColorOptions, resolveColor, fontOptions, loadGoogleFont, maxWidthOptions } from './color-options'
import { MediaPickerField } from './MediaPickerField'
import { createColorField } from './ColorPickerField'

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
      color: createColorField('Color', dividerColorOptions, branding),
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
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      borderColor: createColorField('Border Color', dividerColorOptions, branding),
      titleColor: createColorField('Title Color', textColorOptions, branding),
      descriptionColor: createColorField('Description Color', textColorOptions, branding),
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
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      iconColor: createColorField('Icon Background Color', iconColorOptions, branding),
      titleColor: createColorField('Title Color', textColorOptions, branding),
      descriptionColor: createColorField('Description Color', textColorOptions, branding),
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
      // ═══════════════════════════════════════════════════════════════
      // CONTENT
      // ═══════════════════════════════════════════════════════════════
      title: {
        type: 'text' as const,
        label: 'Title',
      },
      description: {
        type: 'textarea' as const,
        label: 'Description',
      },
      buttons: {
        type: 'array' as const,
        label: 'Buttons',
        arrayFields: {
          label: {
            type: 'text' as const,
            label: 'Label',
          },
          href: {
            type: 'text' as const,
            label: 'Link URL',
          },
          style: {
            type: 'radio' as const,
            label: 'Style',
            options: [
              { label: 'Primary', value: 'primary' },
              { label: 'Secondary', value: 'secondary' },
              { label: 'Tertiary', value: 'tertiary' },
              { label: 'Outline', value: 'outline' },
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
          textColor: createColorField('Text Color', textColorOptions, branding),
        },
        defaultItemProps: {
          label: 'Learn more',
          href: '#',
          style: 'primary',
          size: 'md',
          textColor: '#ffffff',
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // LAYOUT
      // ═══════════════════════════════════════════════════════════════
      align: {
        type: 'radio' as const,
        label: 'Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
        ],
      },
      padding: {
        type: 'text' as const,
        label: 'Padding (px)',
      },

      // ═══════════════════════════════════════════════════════════════
      // TITLE STYLING
      // ═══════════════════════════════════════════════════════════════
      titleFontFamily: {
        type: 'select' as const,
        label: 'Title Font',
        options: fontOptions,
      },
      titleSize: {
        type: 'text' as const,
        label: 'Title Size (px)',
        placeholder: '48',
      },
      titleColor: createColorField('Title Color', textColorOptions, branding),
      titleMaxWidth: {
        type: 'select' as const,
        label: 'Title Max Width',
        options: maxWidthOptions,
      },
      titleBgColor: createColorField('Title Background', backgroundColorOptions, branding),
      titleBgOpacity: {
        type: 'number' as const,
        label: 'Title Bg Opacity (0-1)',
        min: 0,
        max: 1,
        step: 0.1,
      },

      // ═══════════════════════════════════════════════════════════════
      // DESCRIPTION STYLING
      // ═══════════════════════════════════════════════════════════════
      descriptionFontFamily: {
        type: 'select' as const,
        label: 'Description Font',
        options: fontOptions,
      },
      descriptionSize: {
        type: 'text' as const,
        label: 'Description Size (px)',
        placeholder: '18',
      },
      descriptionColor: createColorField('Description Color', textColorOptions, branding),
      descriptionMaxWidth: {
        type: 'select' as const,
        label: 'Description Max Width',
        options: maxWidthOptions,
      },
      descriptionBgColor: createColorField('Description Background', backgroundColorOptions, branding),
      descriptionBgOpacity: {
        type: 'number' as const,
        label: 'Description Bg Opacity (0-1)',
        min: 0,
        max: 1,
        step: 0.1,
      },

      // ═══════════════════════════════════════════════════════════════
      // BACKGROUND
      // ═══════════════════════════════════════════════════════════════
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      backgroundMode: {
        type: 'radio' as const,
        label: 'Background Media',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
      },
      backgroundImageUrl: {
        type: 'custom' as const,
        label: 'Background Image',
        render: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
          <MediaPickerField value={value || ''} onChange={onChange} mediaType="image" />
        ),
      },
      backgroundVideoUrl: {
        type: 'custom' as const,
        label: 'Background Video',
        render: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
          <MediaPickerField value={value || ''} onChange={onChange} mediaType="video" />
        ),
      },
      videoObjectFit: {
        type: 'select' as const,
        label: 'Video Fit',
        options: [
          { label: 'Cover (fill area, crop if needed)', value: 'cover' },
          { label: 'Contain (fit inside, show all)', value: 'contain' },
          { label: 'Fill (stretch to fill)', value: 'fill' },
        ],
      },
      disableVideoOnMobile: {
        type: 'radio' as const,
        label: 'Disable Video on Mobile',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },

      // ═══════════════════════════════════════════════════════════════
      // OVERLAY (on background media)
      // ═══════════════════════════════════════════════════════════════
      showOverlay: {
        type: 'radio' as const,
        label: 'Show Overlay',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      overlayColor: {
        type: 'radio' as const,
        label: 'Overlay Color',
        options: [
          { label: 'Light (brighten)', value: 'light' },
          { label: 'Dark (darken)', value: 'dark' },
        ],
      },
      overlayOpacity: {
        type: 'number' as const,
        label: 'Overlay Opacity (0-1)',
        min: 0,
        max: 1,
        step: 0.1,
      },
      backgroundOpacity: {
        type: 'number' as const,
        label: 'Media Opacity (0-1)',
        min: 0,
        max: 1,
        step: 0.1,
      },

      // ═══════════════════════════════════════════════════════════════
      // INLINE MEDIA (image/video next to content)
      // ═══════════════════════════════════════════════════════════════
      showInlineMedia: {
        type: 'radio' as const,
        label: 'Show Inline Media',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      inlineMediaType: {
        type: 'radio' as const,
        label: 'Inline Media Type',
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video (embed)', value: 'video' },
        ],
      },
      inlineMediaUrl: {
        type: 'text' as const,
        label: 'Inline Media URL',
      },
    },
    resolveFields: (data: any, { fields }: any) => {
      const resolvedFields = { ...fields }

      // Only show backgroundImageUrl when backgroundMode is 'image'
      if (data.props.backgroundMode !== 'image') {
        delete resolvedFields.backgroundImageUrl
      }

      // Only show backgroundVideoUrl when backgroundMode is 'video'
      if (data.props.backgroundMode !== 'video') {
        delete resolvedFields.backgroundVideoUrl
      }

      // Only show backgroundOpacity, overlayColor and overlayOpacity when showOverlay is true
      if (data.props.showOverlay !== true && data.props.showOverlay !== 'true') {
        delete resolvedFields.backgroundOpacity
        delete resolvedFields.overlayColor
        delete resolvedFields.overlayOpacity
      }

      // Only show titleBgOpacity when titleBgColor is set
      if (!data.props.titleBgColor || data.props.titleBgColor === 'none') {
        delete resolvedFields.titleBgOpacity
      }

      // Only show descriptionBgOpacity when descriptionBgColor is set
      if (!data.props.descriptionBgColor || data.props.descriptionBgColor === 'none') {
        delete resolvedFields.descriptionBgOpacity
      }

      return resolvedFields
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
      backgroundMode: 'none',
      backgroundImageUrl: '',
      backgroundVideoUrl: '',
      backgroundOpacity: 0.3,
      disableVideoOnMobile: false,
      showInlineMedia: false,
      inlineMediaType: 'image',
      inlineMediaUrl: '',
      padding: '64px',
      titleFontFamily: 'inherit',
      titleSize: '',
      titleColor: '#111827',
      titleBgColor: 'none',
      titleBgOpacity: 0.5,
      descriptionFontFamily: 'inherit',
      descriptionSize: '',
      descriptionColor: '#374151',
      descriptionBgColor: 'none',
      descriptionBgOpacity: 0.5,
      backgroundColor: 'none',
      videoObjectFit: 'cover',
      showOverlay: true,
      overlayColor: 'light',
      overlayOpacity: 0.5,
      titleMaxWidth: '100%',
      descriptionMaxWidth: '100%',
    },
    render: ({ title, description, buttons, align, backgroundMode, backgroundImageUrl, backgroundVideoUrl, backgroundOpacity, disableVideoOnMobile, showInlineMedia, inlineMediaType, inlineMediaUrl, padding, titleFontFamily, titleSize, titleColor, titleBgColor, titleBgOpacity, descriptionFontFamily, descriptionSize, descriptionColor, descriptionBgColor, descriptionBgOpacity, backgroundColor, videoObjectFit, showOverlay, overlayColor, overlayOpacity, titleMaxWidth, descriptionMaxWidth }: any) => {
      useEffect(() => {
        loadGoogleFont(titleFontFamily)
        loadGoogleFont(descriptionFontFamily)
      }, [titleFontFamily, descriptionFontFamily])
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

      // Helper: Render inline media (image or video embed)
      const renderInlineMedia = () => {
        if (!showInlineMedia || !inlineMediaUrl) return null

        if (inlineMediaType === 'video') {
          return (
            <div style={{ aspectRatio: '16 / 9', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src={inlineMediaUrl}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
                allowFullScreen
                title="Hero Video"
              />
            </div>
          )
        } else {
          return (
            <div style={{ aspectRatio: '16 / 9', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={inlineMediaUrl}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )
        }
      }

      // Determine if we have a background
      const hasVideoBackground = backgroundMode === 'video' && backgroundVideoUrl
      const hasImageBackground = backgroundMode === 'image' && backgroundImageUrl
      const hasBackground = hasVideoBackground || hasImageBackground

      // Background mode: render with background media
      if (hasBackground) {
        const bgWrapperId = `hero-bg-wrapper-${Math.random().toString(36).substr(2, 9)}`
        const bgVideoId = `hero-bg-video-${Math.random().toString(36).substr(2, 9)}`
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
              {/* Background video layer */}
              {hasVideoBackground && backgroundVideoUrl && (
                <video
                  className={bgVideoId}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onEnded={(e) => {
                    // Force loop in case loop attribute fails
                    const video = e.currentTarget as HTMLVideoElement;
                    video.currentTime = 0;
                    video.play().catch(() => {
                      // Silently fail if autoplay is blocked
                    });
                  }}
                  onCanPlay={(e) => {
                    // Ensure video plays when ready
                    const video = e.currentTarget as HTMLVideoElement;
                    video.play().catch(() => {
                      // Silently fail if autoplay is blocked
                    });
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: (videoObjectFit || 'cover') as 'cover' | 'contain' | 'fill',
                    opacity: backgroundOpacity || 0.3,
                    zIndex: 0,
                  }}
                >
                  <source src={backgroundVideoUrl} type="video/mp4" />
                </video>
              )}
              
              {/* Background image layer */}
              {hasImageBackground && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: backgroundOpacity || 1,
                    zIndex: 0,
                  }}
                />
              )}
              
              {/* Gradient overlay - light (white) or dark (black) for text legibility */}
              {(showOverlay === true || showOverlay === 'true') && (() => {
                const opacity = overlayOpacity ?? 0.5
                const rgb = overlayColor === 'dark' ? '0, 0, 0' : '255, 255, 255'
                const gradient = align === 'center'
                  ? `linear-gradient(to bottom, rgba(${rgb}, ${opacity}), rgba(${rgb}, ${opacity}))`
                  : `linear-gradient(to right, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, ${opacity * 0.5}) 50%, rgba(${rgb}, ${opacity * 0.1}) 70%, rgba(${rgb}, 0) 100%)`
                return (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      background: gradient,
                      zIndex: 1,
                    }}
                  />
                )
              })()}
              {/* Content */}
              <div style={{ width: '100%', maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '100%', maxWidth: '768px', ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' } : { textAlign: 'left' }), paddingLeft: '16px', paddingRight: '16px' }}>
                  <h1 className={bgTitleId} style={{
                    fontFamily: titleFontFamily !== 'inherit' ? `'${titleFontFamily}', sans-serif` : 'inherit',
                    fontSize: `${parseInt(titleSize) || 48}px`,
                    fontWeight: '700',
                    marginBottom: '16px',
                    wordBreak: 'break-word',
                    color: resolveColor(titleColor, branding),
                    ...(titleMaxWidth && titleMaxWidth !== '100%' ? { maxWidth: titleMaxWidth, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) } : {}),
                    ...(titleBgColor && titleBgColor !== 'none' ? {
                      display: 'inline-block',
                      backgroundColor: `${resolveColor(titleBgColor, branding)}${Math.round((titleBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                      padding: '4px 12px',
                      borderRadius: '4px',
                    } : {})
                  }}>
                    {title}
                  </h1>
                  <p className={bgDescId} style={{
                    fontFamily: descriptionFontFamily !== 'inherit' ? `'${descriptionFontFamily}', sans-serif` : 'inherit',
                    fontSize: `${parseInt(descriptionSize) || 18}px`,
                    marginBottom: '24px',
                    lineHeight: '1.625',
                    wordBreak: 'break-word',
                    color: resolveColor(descriptionColor, branding),
                    ...(descriptionMaxWidth && descriptionMaxWidth !== '100%' ? { maxWidth: descriptionMaxWidth, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) } : {}),
                    ...(descriptionBgColor && descriptionBgColor !== 'none' ? {
                      display: 'inline-block',
                      backgroundColor: `${resolveColor(descriptionBgColor, branding)}${Math.round((descriptionBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                      padding: '4px 12px',
                      borderRadius: '4px',
                    } : {})
                  }}>
                    {description}
                  </p>
                  {buttons && buttons.length > 0 && (
                    <div className={bgButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
                      {buttons.map((button: any, index: number) => (
                        <a
                          key={index}
                          href={button.href}
                          target="_blank"
                          rel="noopener noreferrer"
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
              ${disableVideoOnMobile ? `
                @media (max-width: 768px) {
                  .${bgVideoId} {
                    display: none !important;
                  }
                }
              ` : ''}
              @media (min-width: 640px) {
                .${bgWrapperId} {
                  padding-left: 24px;
                  padding-right: 24px;
                  min-height: 400px;
                }
                .${bgTitleId} {
                  margin-bottom: 24px;
                }
                .${bgDescId} {
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
                  <h1 className={inlineTitleId} style={{
                    fontFamily: titleFontFamily !== 'inherit' ? `'${titleFontFamily}', sans-serif` : 'inherit',
                    fontSize: `${parseInt(titleSize) || 48}px`,
                    fontWeight: '700',
                    marginBottom: '16px',
                    wordBreak: 'break-word',
                    color: resolveColor(titleColor, branding),
                    ...(titleMaxWidth && titleMaxWidth !== '100%' ? { maxWidth: titleMaxWidth, marginLeft: 'auto', marginRight: 'auto' } : {}),
                    ...(titleBgColor && titleBgColor !== 'none' ? {
                      display: 'inline-block',
                      backgroundColor: `${resolveColor(titleBgColor, branding)}${Math.round((titleBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                      padding: '4px 12px',
                      borderRadius: '4px',
                    } : {})
                  }}>
                    {title}
                  </h1>
                  <p className={inlineDescId} style={{
                    fontFamily: descriptionFontFamily !== 'inherit' ? `'${descriptionFontFamily}', sans-serif` : 'inherit',
                    fontSize: `${parseInt(descriptionSize) || 18}px`,
                    marginBottom: '24px',
                    lineHeight: '1.625',
                    wordBreak: 'break-word',
                    color: resolveColor(descriptionColor, branding),
                    ...(descriptionMaxWidth && descriptionMaxWidth !== '100%' ? { maxWidth: descriptionMaxWidth, marginLeft: 'auto', marginRight: 'auto' } : {}),
                    ...(descriptionBgColor && descriptionBgColor !== 'none' ? {
                      display: 'inline-block',
                      backgroundColor: `${resolveColor(descriptionBgColor, branding)}${Math.round((descriptionBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                      padding: '4px 12px',
                      borderRadius: '4px',
                    } : {})
                  }}>
                    {description}
                  </p>
                  {buttons && buttons.length > 0 && (
                    <div className={inlineButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', ...(showInlineMedia && inlineMediaUrl ? { marginBottom: '24px' } : {}) }}>
                      {buttons.map((button: any, index: number) => (
                        <a
                          key={index}
                          href={button.href}
                          target="_blank"
                          rel="noopener noreferrer"
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
                  {renderInlineMedia()}
                </div>
              ) : (
                // Layout left - two columns (or single column if no media)
                <div className={inlineGridId} style={{ width: '100%', ...(showInlineMedia && inlineMediaUrl ? { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'center' } : {}) }}>
                  <div style={{ textAlign: 'left' }}>
                    <h1 className={inlineTitleId} style={{
                      fontFamily: titleFontFamily !== 'inherit' ? `'${titleFontFamily}', sans-serif` : 'inherit',
                      fontSize: `${parseInt(titleSize) || 48}px`,
                      fontWeight: '700',
                      marginBottom: '16px',
                      wordBreak: 'break-word',
                      color: resolveColor(titleColor, branding),
                      ...(titleMaxWidth && titleMaxWidth !== '100%' ? { maxWidth: titleMaxWidth } : {}),
                      ...(titleBgColor && titleBgColor !== 'none' ? {
                        display: 'inline-block',
                        backgroundColor: `${resolveColor(titleBgColor, branding)}${Math.round((titleBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                        padding: '4px 12px',
                        borderRadius: '4px',
                      } : {})
                    }}>
                      {title}
                    </h1>
                    <p className={inlineDescId} style={{
                      fontFamily: descriptionFontFamily !== 'inherit' ? `'${descriptionFontFamily}', sans-serif` : 'inherit',
                      fontSize: `${parseInt(descriptionSize) || 18}px`,
                      marginBottom: '24px',
                      lineHeight: '1.625',
                      wordBreak: 'break-word',
                      color: resolveColor(descriptionColor, branding),
                      ...(descriptionMaxWidth && descriptionMaxWidth !== '100%' ? { maxWidth: descriptionMaxWidth } : {}),
                      ...(descriptionBgColor && descriptionBgColor !== 'none' ? {
                        display: 'inline-block',
                        backgroundColor: `${resolveColor(descriptionBgColor, branding)}${Math.round((descriptionBgOpacity || 0.5) * 255).toString(16).padStart(2, '0')}`,
                        padding: '4px 12px',
                        borderRadius: '4px',
                      } : {})
                    }}>
                      {description}
                    </p>
                    {buttons && buttons.length > 0 && (
                      <div className={inlineButtonsId} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-start' }}>
                        {buttons.map((button: any, index: number) => (
                          <a
                            key={index}
                            href={button.href}
                            target="_blank"
                            rel="noopener noreferrer"
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
                  {showInlineMedia && inlineMediaUrl && (
                    <div style={{ width: '100%' }}>
                      {renderInlineMedia()}
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
                margin-bottom: 24px;
              }
              .${inlineDescId} {
                margin-bottom: 32px;
              }
              .${inlineButtonsId} {
                gap: 16px;
                ${showInlineMedia && inlineMediaUrl ? 'margin-bottom: 32px;' : ''}
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
              .${inlineGridId} {
                gap: 48px;
              }
            }
            @media (min-width: 1024px) {
              .${inlineGridId} {
                grid-template-columns: ${showInlineMedia && inlineMediaUrl ? 'repeat(2, 1fr)' : '1fr'};
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
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      valueColor: createColorField('Value Color', textColorOptions, branding),
      descriptionColor: createColorField('Description Color', textColorOptions, branding),
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
  TextColumns: {
    fields: {
      columns: {
        type: 'array' as const,
        label: 'Columns (max 3)',
        max: 3,
        arrayFields: {
          title: {
            type: 'text' as const,
            label: 'Title',
          },
          text: {
            type: 'textarea' as const,
            label: 'Text',
          },
        },
        defaultItemProps: {
          title: 'Column Title',
          text: 'Add your text content here.',
        },
      },
      alignment: {
        type: 'radio' as const,
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
        ],
      },
      titleSize: {
        type: 'text' as const,
        label: 'Title Size (px)',
        placeholder: '20',
      },
      textSize: {
        type: 'text' as const,
        label: 'Text Size (px)',
        placeholder: '16',
      },
      gap: {
        type: 'select' as const,
        label: 'Gap Between Columns',
        options: [
          { label: 'Small (16px)', value: 'sm' },
          { label: 'Medium (24px)', value: 'md' },
          { label: 'Large (32px)', value: 'lg' },
          { label: 'X-Large (48px)', value: 'xl' },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      titleColor: createColorField('Title Color', textColorOptions, branding),
      textColor: createColorField('Text Color', textColorOptions, branding),
    },
    defaultProps: {
      columns: [
        { title: 'First Column', text: 'Content for column 1.' },
        { title: 'Second Column', text: 'Content for column 2.' },
      ],
      alignment: 'left',
      titleSize: '',
      textSize: '',
      gap: 'md',
      verticalPadding: 32,
      backgroundColor: 'none',
      titleColor: '#111827',
      textColor: '#4b5563',
    },
    render: ({ columns, alignment, titleSize, textSize, gap, verticalPadding, backgroundColor, titleColor, textColor }: any) => {
      const gapMap: Record<string, string> = {
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
      }

      const validColumns = Array.isArray(columns) ? columns.filter((col: any) => col && (col.title || col.text)) : []
      const columnCount = Math.min(validColumns.length, 3)

      if (validColumns.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add columns to display side by side (max 3)
            </div>
          </div>
        )
      }

      const gridId = `textcols-grid-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              className={gridId}
              style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: gapMap[gap] || '24px',
              }}
            >
              {validColumns.map((column: any, index: number) => (
                <div
                  key={index}
                  style={{
                    textAlign: alignment,
                  }}
                >
                  {column.title && (
                    <h3
                      style={{
                        fontSize: `${parseInt(titleSize) || 20}px`,
                        fontWeight: '600',
                        marginBottom: '12px',
                        wordBreak: 'break-word',
                        color: resolveColor(titleColor, branding),
                      }}
                    >
                      {column.title}
                    </h3>
                  )}
                  {column.text && (
                    <p
                      style={{
                        fontSize: `${parseInt(textSize) || 16}px`,
                        lineHeight: '1.625',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        color: resolveColor(textColor, branding),
                      }}
                    >
                      {column.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @media (min-width: 768px) {
              .${gridId} {
                grid-template-columns: repeat(${columnCount}, 1fr) !important;
              }
            }
          `}</style>
        </>
      )
    },
  },
  TextRows: {
    fields: {
      rows: {
        type: 'array' as const,
        label: 'Text Blocks',
        max: 6,
        arrayFields: {
          title: {
            type: 'text' as const,
            label: 'Title',
          },
          text: {
            type: 'textarea' as const,
            label: 'Text',
          },
        },
        defaultItemProps: {
          title: 'Block Title',
          text: 'Add your text content here. You can write a description, explanation, or any other information.',
        },
      },
      alignment: {
        type: 'radio' as const,
        label: 'Text Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
        ],
      },
      titleSize: {
        type: 'text' as const,
        label: 'Title Size (px)',
        placeholder: '20',
      },
      textSize: {
        type: 'text' as const,
        label: 'Text Size (px)',
        placeholder: '16',
      },
      gap: {
        type: 'select' as const,
        label: 'Gap Between Rows',
        options: [
          { label: 'Small (16px)', value: 'sm' },
          { label: 'Medium (24px)', value: 'md' },
          { label: 'Large (32px)', value: 'lg' },
          { label: 'X-Large (48px)', value: 'xl' },
        ],
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: [
          { label: 'Small (480px)', value: '480px' },
          { label: 'Medium (640px)', value: '640px' },
          { label: 'Large (768px)', value: '768px' },
          { label: 'X-Large (896px)', value: '896px' },
          { label: 'Full (1152px)', value: '1152px' },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      titleColor: createColorField('Title Color', textColorOptions, branding),
      textColor: createColorField('Text Color', textColorOptions, branding),
    },
    defaultProps: {
      rows: [
        {
          title: 'First Block',
          text: 'Add your content here. This is a text block that can be used to display information in a clean, organized way.',
        },
        {
          title: 'Second Block',
          text: 'Each block has a title and a text area below. You can customize the styling and layout as needed.',
        },
      ],
      alignment: 'left',
      titleSize: '',
      textSize: '',
      gap: 'md',
      maxWidth: '768px',
      verticalPadding: 32,
      backgroundColor: 'none',
      titleColor: '#111827',
      textColor: '#4b5563',
    },
    render: ({ rows, alignment, titleSize, textSize, gap, maxWidth, verticalPadding, backgroundColor, titleColor, textColor }: any) => {
      const gapMap: Record<string, string> = {
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
      }

      const validRows = Array.isArray(rows) ? rows.filter((row: any) => row && (row.title || row.text)) : []

      if (validRows.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: maxWidth,
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add text blocks (stacked vertically)
            </div>
          </div>
        )
      }

      return (
        <div
          style={{
            width: '100%',
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
            backgroundColor: resolveColor(backgroundColor, branding),
          }}
        >
          <div
            style={{
              maxWidth: maxWidth,
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: gapMap[gap] || '24px',
            }}
          >
            {validRows.map((row: any, index: number) => (
              <div
                key={index}
                style={{
                  textAlign: alignment,
                }}
              >
                {row.title && (
                  <h3
                    style={{
                      fontSize: `${parseInt(titleSize) || 20}px`,
                      fontWeight: '600',
                      marginBottom: '12px',
                      wordBreak: 'break-word',
                      color: resolveColor(titleColor, branding),
                    }}
                  >
                    {row.title}
                  </h3>
                )}
                {row.text && (
                  <p
                    style={{
                      fontSize: `${parseInt(textSize) || 16}px`,
                      lineHeight: '1.625',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      color: resolveColor(textColor, branding),
                    }}
                  >
                    {row.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
  },
  Testimonials: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'Section Title',
      },
      showTitle: {
        type: 'radio' as const,
        label: 'Show Title',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      testimonials: {
        type: 'array' as const,
        label: 'Testimonials',
        max: 6,
        arrayFields: {
          quote: {
            type: 'textarea' as const,
            label: 'Quote',
          },
          authorName: {
            type: 'text' as const,
            label: 'Author Name',
          },
          authorRole: {
            type: 'text' as const,
            label: 'Role / Company',
          },
          authorPhoto: {
            type: 'text' as const,
            label: 'Photo URL (optional)',
          },
          rating: {
            type: 'select' as const,
            label: 'Rating (stars)',
            options: [
              { label: 'No rating', value: 0 },
              { label: '1 star', value: 1 },
              { label: '2 stars', value: 2 },
              { label: '3 stars', value: 3 },
              { label: '4 stars', value: 4 },
              { label: '5 stars', value: 5 },
            ],
          },
        },
        defaultItemProps: {
          quote: 'This product exceeded my expectations. Highly recommended!',
          authorName: 'John Doe',
          authorRole: 'CEO, Company',
          authorPhoto: '',
          rating: 5,
        },
      },
      columns: {
        type: 'select' as const,
        label: 'Columns',
        options: [
          { label: '1 column', value: 1 },
          { label: '2 columns', value: 2 },
          { label: '3 columns', value: 3 },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      cardBackgroundColor: createColorField('Card Background', backgroundColorOptions, branding),
      quoteColor: createColorField('Quote Text Color', textColorOptions, branding),
      authorColor: createColorField('Author Name Color', textColorOptions, branding),
      roleColor: createColorField('Role Text Color', textColorOptions, branding),
      starColor: createColorField('Star Color', [
          { label: 'Yellow', value: '#fbbf24' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Orange', value: '#f97316' },
          { label: 'Gold', value: '#d4af37' },
        ], branding),
    },
    defaultProps: {
      title: 'What Our Clients Say',
      showTitle: true,
      testimonials: [
        {
          quote: 'Exceptional service and results. The team went above and beyond our expectations.',
          authorName: 'Maria Silva',
          authorRole: 'Marketing Director, TechCorp',
          authorPhoto: '',
          rating: 5,
        },
        {
          quote: 'Professional, reliable, and truly understands our needs. Highly recommended!',
          authorName: 'Carlos Santos',
          authorRole: 'CEO, StartupX',
          authorPhoto: '',
          rating: 5,
        },
      ],
      columns: 2,
      verticalPadding: 48,
      backgroundColor: 'none',
      cardBackgroundColor: '#ffffff',
      quoteColor: '#374151',
      authorColor: '#111827',
      roleColor: '#6b7280',
      starColor: '#fbbf24',
    },
    render: ({ title, showTitle, testimonials, columns, verticalPadding, backgroundColor, cardBackgroundColor, quoteColor, authorColor, roleColor, starColor }: any) => {
      const gridId = `testimonials-grid-${Math.random().toString(36).substr(2, 9)}`
      const cardId = `testimonials-card-${Math.random().toString(36).substr(2, 9)}`

      const validTestimonials = Array.isArray(testimonials) ? testimonials.filter((t: any) => t && t.quote) : []

      const renderStars = (rating: number) => {
        if (!rating || rating === 0) return null
        return (
          <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={star <= rating ? resolveColor(starColor, branding) : 'none'}
                stroke={resolveColor(starColor, branding)}
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )
      }

      if (validTestimonials.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add testimonials to display customer reviews
            </div>
          </div>
        )
      }

      return (
        <>
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto' }}>
              {showTitle && title && (
                <h2
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '40px',
                    color: resolveColor(authorColor, branding),
                  }}
                >
                  {title}
                </h2>
              )}
              <div
                className={gridId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(columns, validTestimonials.length)}, 1fr)`,
                  gap: '24px',
                }}
              >
                {validTestimonials.map((testimonial: any, index: number) => (
                  <div
                    key={index}
                    className={cardId}
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      backgroundColor: resolveColor(cardBackgroundColor, branding),
                      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {renderStars(testimonial.rating)}
                    <p
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: resolveColor(quoteColor, branding),
                        marginBottom: '20px',
                        flex: 1,
                        fontStyle: 'italic',
                      }}
                    >
                      "{testimonial.quote}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {testimonial.authorPhoto ? (
                        <img
                          src={testimonial.authorPhoto}
                          alt={testimonial.authorName}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: branding.primaryColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '18px',
                          }}
                        >
                          {testimonial.authorName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '15px',
                            color: resolveColor(authorColor, branding),
                          }}
                        >
                          {testimonial.authorName}
                        </div>
                        {testimonial.authorRole && (
                          <div
                            style={{
                              fontSize: '13px',
                              color: resolveColor(roleColor, branding),
                            }}
                          >
                            {testimonial.authorRole}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .${gridId} {
                grid-template-columns: 1fr !important;
              }
            }
            @media (min-width: 769px) and (max-width: 1024px) {
              .${gridId} {
                grid-template-columns: repeat(${Math.min(2, columns)}, 1fr) !important;
              }
            }
          `}</style>
        </>
      )
    },
  },
  FAQ: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'Section Title',
      },
      showTitle: {
        type: 'radio' as const,
        label: 'Show Title',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      titleLevel: {
        type: 'select' as const,
        label: 'Title Hierarchy',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
          { label: 'H5', value: 'h5' },
          { label: 'H6', value: 'h6' },
        ],
      },
      items: {
        type: 'array' as const,
        label: 'Questions & Answers',
        max: 12,
        arrayFields: {
          question: {
            type: 'text' as const,
            label: 'Question',
          },
          answer: {
            type: 'textarea' as const,
            label: 'Answer',
          },
        },
        defaultItemProps: {
          question: 'How does your service work?',
          answer: 'Our service is designed to be simple and intuitive. Just sign up, choose your plan, and you can start using all features immediately.',
        },
      },
      allowMultipleOpen: {
        type: 'radio' as const,
        label: 'Allow Multiple Open',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      defaultOpen: {
        type: 'radio' as const,
        label: 'First Item Open by Default',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: [
          { label: 'Small (640px)', value: '640px' },
          { label: 'Medium (768px)', value: '768px' },
          { label: 'Large (896px)', value: '896px' },
          { label: 'Full (1152px)', value: '1152px' },
        ],
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      questionColor: createColorField('Question Color', textColorOptions, branding),
      answerColor: createColorField('Answer Color', textColorOptions, branding),
      iconColor: createColorField('Icon Color', textColorOptions, branding),
      dividerColor: createColorField('Divider Color', [
          { label: 'Light Gray', value: '#e5e7eb' },
          { label: 'Gray', value: '#d1d5db' },
          { label: 'Primary', value: 'primary' },
          { label: 'None', value: 'transparent' },
        ], branding),
    },
    defaultProps: {
      title: 'Frequently Asked Questions',
      showTitle: true,
      titleLevel: 'h2',
      items: [
        {
          question: 'How does your service work?',
          answer: 'Our service is designed to be simple and intuitive. Just sign up, choose your plan, and you can start using all features immediately.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.',
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.',
        },
      ],
      allowMultipleOpen: false,
      defaultOpen: true,
      verticalPadding: 48,
      maxWidth: '768px',
      backgroundColor: 'none',
      questionColor: '#111827',
      answerColor: '#4b5563',
      iconColor: '#6b7280',
      dividerColor: '#e5e7eb',
    },
    render: ({ title, showTitle, titleLevel, items, allowMultipleOpen, defaultOpen, verticalPadding, maxWidth, backgroundColor, questionColor, answerColor, iconColor, dividerColor }: any) => {
      const TitleTag = titleLevel || 'h2'
      const titleSizes: Record<string, number> = {
        h1: 48,
        h2: 36,
        h3: 28,
        h4: 24,
        h5: 20,
        h6: 16,
      }
      const titleFontSize = titleSizes[titleLevel] || 36
      const [openItems, setOpenItems] = React.useState<number[]>(defaultOpen ? [0] : [])

      const validItems = Array.isArray(items) ? items.filter((item: any) => item && item.question) : []

      const toggleItem = (index: number) => {
        if (allowMultipleOpen) {
          setOpenItems((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
          )
        } else {
          setOpenItems((prev) => (prev.includes(index) ? [] : [index]))
        }
      }

      const isOpen = (index: number) => openItems.includes(index)

      if (validItems.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: maxWidth,
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add FAQ items to display questions and answers
            </div>
          </div>
        )
      }

      return (
        <div
          style={{
            width: '100%',
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
            backgroundColor: resolveColor(backgroundColor, branding),
          }}
        >
          <div style={{ maxWidth: maxWidth, marginLeft: 'auto', marginRight: 'auto' }}>
            {showTitle && title && (
              <TitleTag
                style={{
                  fontSize: `${titleFontSize}px`,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: '40px',
                  color: resolveColor(questionColor, branding),
                }}
              >
                {title}
              </TitleTag>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {validItems.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    borderBottom: index < validItems.length - 1 ? `1px solid ${resolveColor(dividerColor, branding)}` : 'none',
                  }}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 0',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: resolveColor(questionColor, branding),
                        paddingRight: '16px',
                      }}
                    >
                      {item.question}
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={resolveColor(iconColor, branding)}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        flexShrink: 0,
                        transform: isOpen(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen(index) ? '500px' : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: resolveColor(answerColor, branding),
                        paddingBottom: '20px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
  },
  PricingTable: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'Section Title',
      },
      showTitle: {
        type: 'radio' as const,
        label: 'Show Title',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      subtitle: {
        type: 'text' as const,
        label: 'Subtitle',
      },
      plans: {
        type: 'array' as const,
        label: 'Pricing Plans',
        max: 4,
        arrayFields: {
          name: {
            type: 'text' as const,
            label: 'Plan Name',
          },
          price: {
            type: 'text' as const,
            label: 'Price',
          },
          period: {
            type: 'text' as const,
            label: 'Period (e.g., /month)',
          },
          description: {
            type: 'text' as const,
            label: 'Description',
          },
          features: {
            type: 'textarea' as const,
            label: 'Features (one per line)',
          },
          buttonLabel: {
            type: 'text' as const,
            label: 'Button Label',
          },
          buttonUrl: {
            type: 'text' as const,
            label: 'Button URL',
          },
          isHighlighted: {
            type: 'radio' as const,
            label: 'Highlight (Recommended)',
            options: [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
          },
          highlightLabel: {
            type: 'text' as const,
            label: 'Highlight Badge Text',
          },
        },
        defaultItemProps: {
          name: 'Basic',
          price: '$29',
          period: '/month',
          description: 'Perfect for small teams',
          features: 'Feature 1\nFeature 2\nFeature 3',
          buttonLabel: 'Get Started',
          buttonUrl: '#',
          isHighlighted: false,
          highlightLabel: 'Most Popular',
        },
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      cardBackgroundColor: createColorField('Card Background', backgroundColorOptions, branding),
      highlightBorderColor: createColorField('Highlight Border Color', [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'Blue', value: '#3b82f6' },
          { label: 'Green', value: '#10b981' },
          { label: 'Purple', value: '#8b5cf6' },
        ], branding),
    },
    defaultProps: {
      title: 'Choose Your Plan',
      showTitle: true,
      subtitle: 'Simple, transparent pricing that grows with you',
      plans: [
        {
          name: 'Starter',
          price: '$19',
          period: '/month',
          description: 'For individuals and small projects',
          features: '5 Projects\n10GB Storage\nEmail Support\nBasic Analytics',
          buttonLabel: 'Start Free Trial',
          buttonUrl: '#',
          isHighlighted: false,
          highlightLabel: '',
        },
        {
          name: 'Professional',
          price: '$49',
          period: '/month',
          description: 'For growing teams and businesses',
          features: 'Unlimited Projects\n100GB Storage\nPriority Support\nAdvanced Analytics\nTeam Collaboration\nAPI Access',
          buttonLabel: 'Get Started',
          buttonUrl: '#',
          isHighlighted: true,
          highlightLabel: 'Most Popular',
        },
        {
          name: 'Enterprise',
          price: '$99',
          period: '/month',
          description: 'For large organizations',
          features: 'Everything in Pro\nUnlimited Storage\n24/7 Phone Support\nCustom Integrations\nDedicated Account Manager\nSLA Guarantee',
          buttonLabel: 'Contact Sales',
          buttonUrl: '#',
          isHighlighted: false,
          highlightLabel: '',
        },
      ],
      verticalPadding: 64,
      backgroundColor: 'none',
      cardBackgroundColor: '#ffffff',
      highlightBorderColor: 'primary',
    },
    render: ({ title, showTitle, subtitle, plans, verticalPadding, backgroundColor, cardBackgroundColor, highlightBorderColor }: any) => {
      const gridId = `pricing-grid-${Math.random().toString(36).substr(2, 9)}`
      const cardId = `pricing-card-${Math.random().toString(36).substr(2, 9)}`

      const validPlans = Array.isArray(plans) ? plans.filter((p: any) => p && p.name) : []

      if (validPlans.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add pricing plans to display comparison table
            </div>
          </div>
        )
      }

      const parseFeatures = (features: string) => {
        if (!features) return []
        return features.split('\n').filter((f: string) => f.trim())
      }

      return (
        <>
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto' }}>
              {showTitle && (title || subtitle) && (
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                  {title && (
                    <h2
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '12px',
                      }}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p
                      style={{
                        fontSize: '18px',
                        color: '#6b7280',
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              <div
                className={gridId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(validPlans.length, 3)}, 1fr)`,
                  gap: '24px',
                  alignItems: 'stretch',
                }}
              >
                {validPlans.map((plan: any, index: number) => {
                  const features = parseFeatures(plan.features)
                  const borderColor = plan.isHighlighted ? resolveColor(highlightBorderColor, branding) : '#e5e7eb'

                  return (
                    <div
                      key={index}
                      className={cardId}
                      style={{
                        padding: '32px',
                        borderRadius: '16px',
                        backgroundColor: resolveColor(cardBackgroundColor, branding),
                        border: `2px solid ${borderColor}`,
                        boxShadow: plan.isHighlighted
                          ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                          : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transform: plan.isHighlighted ? 'scale(1.02)' : 'none',
                      }}
                    >
                      {plan.isHighlighted && plan.highlightLabel && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: resolveColor(highlightBorderColor, branding),
                            color: '#ffffff',
                            padding: '4px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {plan.highlightLabel}
                        </div>
                      )}
                      <div style={{ marginBottom: '24px' }}>
                        <h3
                          style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '8px',
                          }}
                        >
                          {plan.name}
                        </h3>
                        {plan.description && (
                          <p style={{ fontSize: '14px', color: '#6b7280' }}>{plan.description}</p>
                        )}
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <span style={{ fontSize: '40px', fontWeight: '700', color: '#111827' }}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span style={{ fontSize: '16px', color: '#6b7280' }}>{plan.period}</span>
                        )}
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '32px', flex: 1 }}>
                        {features.map((feature: string, fIndex: number) => (
                          <li
                            key={fIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 0',
                              fontSize: '14px',
                              color: '#374151',
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={branding.primaryColor}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.buttonLabel && (
                        <a
                          href={plan.buttonUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'center',
                            padding: '14px 24px',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            backgroundColor: plan.isHighlighted ? branding.primaryColor : 'transparent',
                            color: plan.isHighlighted ? '#ffffff' : branding.primaryColor,
                            border: `2px solid ${branding.primaryColor}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          {plan.buttonLabel}
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .${gridId} {
                grid-template-columns: 1fr !important;
              }
              .${cardId} {
                transform: none !important;
              }
            }
            @media (min-width: 769px) and (max-width: 1024px) {
              .${gridId} {
                grid-template-columns: repeat(${Math.min(2, validPlans.length)}, 1fr) !important;
              }
            }
          `}</style>
        </>
      )
    },
  },
  TeamSection: {
    fields: {
      title: {
        type: 'text' as const,
        label: 'Section Title',
      },
      showTitle: {
        type: 'radio' as const,
        label: 'Show Title',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      subtitle: {
        type: 'text' as const,
        label: 'Subtitle',
      },
      members: {
        type: 'array' as const,
        label: 'Team Members',
        max: 8,
        arrayFields: {
          name: {
            type: 'text' as const,
            label: 'Name',
          },
          role: {
            type: 'text' as const,
            label: 'Role / Position',
          },
          photo: {
            type: 'text' as const,
            label: 'Photo URL',
          },
          bio: {
            type: 'textarea' as const,
            label: 'Short Bio (optional)',
          },
          linkedin: {
            type: 'text' as const,
            label: 'LinkedIn URL (optional)',
          },
          email: {
            type: 'text' as const,
            label: 'Email (optional)',
          },
        },
        defaultItemProps: {
          name: 'Team Member',
          role: 'Position',
          photo: '',
          bio: '',
          linkedin: '',
          email: '',
        },
      },
      columns: {
        type: 'select' as const,
        label: 'Columns',
        options: [
          { label: '2 columns', value: 2 },
          { label: '3 columns', value: 3 },
          { label: '4 columns', value: 4 },
        ],
      },
      cardStyle: {
        type: 'radio' as const,
        label: 'Card Style',
        options: [
          { label: 'Card', value: 'card' },
          { label: 'Minimal', value: 'minimal' },
        ],
      },
      photoSize: {
        type: 'select' as const,
        label: 'Photo Size',
        options: [
          { label: 'Small (80px)', value: 80 },
          { label: 'Medium (120px)', value: 120 },
          { label: 'Large (160px)', value: 160 },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      cardBackgroundColor: createColorField('Card Background', backgroundColorOptions, branding),
      nameColor: createColorField('Name Color', textColorOptions, branding),
      roleColor: createColorField('Role Color', textColorOptions, branding),
    },
    defaultProps: {
      title: 'Meet Our Team',
      showTitle: true,
      subtitle: 'The talented people behind our success',
      members: [
        {
          name: 'Ana Costa',
          role: 'CEO & Founder',
          photo: '',
          bio: '',
          linkedin: '',
          email: '',
        },
        {
          name: 'Pedro Lima',
          role: 'CTO',
          photo: '',
          bio: '',
          linkedin: '',
          email: '',
        },
        {
          name: 'Julia Mendes',
          role: 'Head of Design',
          photo: '',
          bio: '',
          linkedin: '',
          email: '',
        },
      ],
      columns: 3,
      cardStyle: 'card',
      photoSize: 120,
      verticalPadding: 64,
      backgroundColor: 'none',
      cardBackgroundColor: '#ffffff',
      nameColor: '#111827',
      roleColor: '#6b7280',
    },
    render: ({ title, showTitle, subtitle, members, columns, cardStyle, photoSize, verticalPadding, backgroundColor, cardBackgroundColor, nameColor, roleColor }: any) => {
      const gridId = `team-grid-${Math.random().toString(36).substr(2, 9)}`

      const validMembers = Array.isArray(members) ? members.filter((m: any) => m && m.name) : []

      if (validMembers.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add team members to display
            </div>
          </div>
        )
      }

      const renderMemberCard = (member: any, index: number) => {
        const initials = member.name
          ?.split(' ')
          .map((n: string) => n.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'TM'

        const cardContent = (
          <>
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                style={{
                  width: `${photoSize}px`,
                  height: `${photoSize}px`,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: '16px',
                }}
              />
            ) : (
              <div
                style={{
                  width: `${photoSize}px`,
                  height: `${photoSize}px`,
                  borderRadius: '50%',
                  backgroundColor: branding.primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: `${photoSize / 3}px`,
                  marginBottom: '16px',
                }}
              >
                {initials}
              </div>
            )}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: resolveColor(nameColor, branding),
                marginBottom: '4px',
              }}
            >
              {member.name}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: resolveColor(roleColor, branding),
                marginBottom: member.bio ? '12px' : '0',
              }}
            >
              {member.role}
            </p>
            {member.bio && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  marginBottom: '16px',
                }}
              >
                {member.bio}
              </p>
            )}
            {(member.linkedin || member.email) && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6b7280' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    style={{ color: '#6b7280' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </>
        )

        if (cardStyle === 'card') {
          return (
            <div
              key={index}
              style={{
                padding: '32px 24px',
                borderRadius: '12px',
                backgroundColor: resolveColor(cardBackgroundColor, branding),
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {cardContent}
            </div>
          )
        }

        return (
          <div
            key={index}
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {cardContent}
          </div>
        )
      }

      return (
        <>
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto' }}>
              {showTitle && (title || subtitle) && (
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                  {title && (
                    <h2
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: resolveColor(nameColor, branding),
                        marginBottom: '12px',
                      }}
                    >
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p
                      style={{
                        fontSize: '18px',
                        color: resolveColor(roleColor, branding),
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              <div
                className={gridId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(columns, validMembers.length)}, 1fr)`,
                  gap: '32px',
                }}
              >
                {validMembers.map((member: any, index: number) => renderMemberCard(member, index))}
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 640px) {
              .${gridId} {
                grid-template-columns: 1fr !important;
              }
            }
            @media (min-width: 641px) and (max-width: 1024px) {
              .${gridId} {
                grid-template-columns: repeat(${Math.min(2, columns)}, 1fr) !important;
              }
            }
          `}</style>
        </>
      )
    },
  },
  IconList: {
    fields: {
      icons: {
        type: 'array' as const,
        label: 'Icons',
        arrayFields: {
          icon: {
            type: 'select' as const,
            label: 'Icon',
            options: [
              // Healthcare & Medical
              { label: '❤️ Heart', value: 'Heart' },
              { label: '💗 Heart Pulse', value: 'HeartPulse' },
              { label: '🩺 Stethoscope', value: 'Stethoscope' },
              { label: '💊 Pill', value: 'Pill' },
              { label: '🌡️ Thermometer', value: 'Thermometer' },
              { label: '👁️ Eye', value: 'Eye' },
              { label: '➕ Plus', value: 'Plus' },
              { label: '💉 Syringe', value: 'Syringe' },
              { label: '🏥 Hospital', value: 'Hospital' },
              { label: '🩹 Cross', value: 'Cross' },
              { label: '🏃 Activity', value: 'Activity' },
              // Business & Contact
              { label: '📧 Mail', value: 'Mail' },
              { label: '📞 Phone', value: 'Phone' },
              { label: '📍 Map Pin', value: 'MapPin' },
              { label: '🌐 Globe', value: 'Globe' },
              { label: '💬 Message Circle', value: 'MessageCircle' },
              { label: '💼 Briefcase', value: 'Briefcase' },
              { label: '🏢 Building', value: 'Building' },
              { label: '📄 File Text', value: 'FileText' },
              { label: '📋 Clipboard', value: 'ClipboardList' },
              { label: '💵 Dollar Sign', value: 'DollarSign' },
              { label: '🏷️ Tag', value: 'Tag' },
              { label: '🔗 Link', value: 'Link' },
              { label: '📱 Smartphone', value: 'Smartphone' },
              { label: '💳 Credit Card', value: 'CreditCard' },
              // Care & Wellness
              { label: '⚡ Zap', value: 'Zap' },
              { label: '⭐ Star', value: 'Star' },
              { label: '🛡️ Shield', value: 'Shield' },
              { label: '🛡️✓ Shield Check', value: 'ShieldCheck' },
              { label: '✅ Check Circle', value: 'CheckCircle' },
              { label: '✓ Check', value: 'Check' },
              { label: '🎯 Target', value: 'Target' },
              { label: '👤 User', value: 'User' },
              { label: '👥 Users', value: 'Users' },
              { label: '🏠 Home', value: 'Home' },
              { label: '⏰ Clock', value: 'Clock' },
              { label: '📅 Calendar', value: 'Calendar' },
              { label: '🏆 Trophy', value: 'Trophy' },
              { label: '🎖️ Award', value: 'Award' },
              { label: '👍 Thumbs Up', value: 'ThumbsUp' },
              { label: '💪 Arm', value: 'Dumbbell' },
              { label: '🔒 Lock', value: 'Lock' },
              // Aesthetics & Beauty
              { label: '💎 Gem', value: 'Gem' },
              { label: '🌿 Leaf', value: 'Leaf' },
              { label: '☀️ Sun', value: 'Sun' },
              { label: '🌙 Moon', value: 'Moon' },
              { label: '💧 Droplet', value: 'Droplet' },
              { label: '✂️ Scissors', value: 'Scissors' },
              { label: '✨ Sparkles', value: 'Sparkles' },
              { label: '🌸 Flower', value: 'Flower2' },
              { label: '🎨 Palette', value: 'Palette' },
              { label: '🪞 Scan', value: 'ScanFace' },
            ],
          },
          label: {
            type: 'text' as const,
            label: 'Label (optional)',
          },
        },
        defaultItemProps: {
          icon: 'Heart',
          label: '',
        },
      },
      layout: {
        type: 'radio' as const,
        label: 'Layout',
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Vertical', value: 'vertical' },
        ],
      },
      align: {
        type: 'radio' as const,
        label: 'Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      iconSize: {
        type: 'text' as const,
        label: 'Icon Size (px)',
        placeholder: '32',
      },
      iconColor: createColorField('Icon Color', iconColorOptions, branding),
      labelSize: {
        type: 'text' as const,
        label: 'Label Size (px)',
        placeholder: '14',
      },
      labelColor: createColorField('Label Color', textColorOptions, branding),
      gap: {
        type: 'select' as const,
        label: 'Gap Between Icons',
        options: [
          { label: 'Small (12px)', value: '12' },
          { label: 'Medium (24px)', value: '24' },
          { label: 'Large (32px)', value: '32' },
          { label: 'X-Large (48px)', value: '48' },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
    },
    defaultProps: {
      icons: [
        { icon: 'CheckCircle', label: '' },
        { icon: 'Shield', label: '' },
        { icon: 'Star', label: '' },
      ],
      layout: 'horizontal',
      align: 'center',
      iconSize: '',
      iconColor: 'primary',
      labelSize: '',
      labelColor: '#374151',
      gap: '24',
      verticalPadding: 16,
      backgroundColor: 'none',
    },
    render: ({ icons, layout, align, iconSize, iconColor, labelSize, labelColor, gap, verticalPadding, backgroundColor }: any) => {
      const size = parseInt(iconSize) || 32
      const color = resolveColor(iconColor, branding)
      const labelFontSize = parseInt(labelSize) || 14
      const labelTextColor = resolveColor(labelColor, branding)
      const gapValue = gap || '24'

      const validIcons = Array.isArray(icons) ? icons.filter((item: any) => item && item.icon) : []

      if (validIcons.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: resolveColor(backgroundColor, branding),
            }}
          >
            <div
              style={{
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add icons to display
            </div>
          </div>
        )
      }

      const justifyContent = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

      const renderIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName]
        if (!IconComponent) return null
        return <IconComponent size={size} color={color} strokeWidth={2} />
      }

      return (
        <div
          style={{
            width: '100%',
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
            backgroundColor: resolveColor(backgroundColor, branding),
          }}
        >
          <div
            style={{
              maxWidth: '1152px',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              flexDirection: layout === 'vertical' ? 'column' : 'row',
              flexWrap: 'wrap',
              gap: `${gapValue}px`,
              justifyContent,
              alignItems: layout === 'vertical' ? (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start') : 'center',
            }}
          >
            {validIcons.map((item: any, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {renderIcon(item.icon)}
                {item.label && (
                  <span
                    style={{
                      fontSize: `${labelFontSize}px`,
                      color: labelTextColor,
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
  },
})
