const PUBLIC_QUOTE_TEMPLATE_BASE = {
    root: { props: {} },
    zones: {},
    content: [
      {
        type: 'Header',
        props: {
          id: 'Header-32d3066b-ce78-4fd1-87ac-bcecc4ee286d',
          height: '80',
          buttonUrl: '#',
          showButton: true,
          buttonLabel: '', // to be filled per locale
          buttonVariant: 'primary',
          backgroundColor: 'white',
          buttonTextColor: '#ffffff'
        }
      },
      {
        type: 'Hero',
        props: {
          id: 'Hero-e64f1edb-e0c1-40f2-8a8d-6a55d65da418',
          align: 'left',
          title: '',
          buttons: [],
          padding: '220px',
          titleSize: '64',
          titleColor: '#111827',
          description: '',
          backgroundMode: 'none',
          inlineMediaUrl: '',
          backgroundColor: '#f9fafb',
          descriptionSize: '22',
          inlineMediaType: 'video',
          showInlineMedia: false,
          descriptionColor: 'default',
          backgroundOpacity: 1,
          backgroundImageUrl: '',
          disableVideoOnMobile: false
        }
      },
      {
        type: 'Space',
        props: {
          id: 'Space-b99f4982-87f2-4db6-acfe-5f5e24bbd350',
          size: 40,
          direction: 'vertical'
        }
      },
      {
        type: 'Flex',
        props: {
          id: 'Flex-f102d616-13ce-421a-a8d3-2a0e5578fff9',
          gap: 40,
          wrap: true,
          direction: 'column',
          justifyContent: 'flex-start',
          backgroundColor: 'none',
          verticalPadding: 0,
          horizontalPadding: 16,
          content: [
            {
              type: 'CardContainer',
              props: {
                id: 'CardContainer-577fb331-d1e4-45c3-a568-cd4c9eb38b29',
                title: '',
                content: [
                  {
                    type: 'QuoteContent',
                    props: {
                      id: 'QuoteContent-58aaf5f8-ea6b-460c-977d-63240d6703a6'
                    }
                  }
                ],
                padding: 'md',
                showTitle: false,
                titleColor: '#111827',
                borderColor: '#e5e7eb',
                description: '',
                backgroundColor: 'none',
                showDescription: false,
                descriptionColor: '#4b5563'
              }
            },
            {
              type: 'Divider',
              props: {
                id: 'Divider-818431db-1f34-404b-950b-af7293710ff7',
                color: '#e5e7eb',
                spacing: 8,
                thickness: 1
              }
            },
            {
              type: 'QuoteNumber',
              props: {
                id: 'QuoteNumber-a34fcf01-14f0-4ec7-b2e6-9424be452a83',
                size: 'l',
                label: ''
              }
            },
            {
              type: 'QuoteItems',
              props: {
                id: 'QuoteItems-5cc403ea-a212-4c17-a6bf-aedbcdb6daf9',
                showPrice: false,
                showDiscount: false
              }
            },
            {
              type: 'QuoteTotal',
              props: {
                id: 'QuoteTotal-437bd2a8-8d84-4172-a276-e49c5965038e',
                label: '',
                totalColor: 'primary'
              }
            }
          ]
        }
      },
      {
        type: 'Space',
        props: {
          id: 'Space-c6d3fa8a-eb42-483b-bcab-a06feb2bd1fb',
          size: 40,
          direction: 'vertical'
        }
      },
      {
        type: 'Footer',
        props: {
          id: 'Footer-b9f91ec2-b959-4d14-b9b9-b2fe927fb36d',
          textColor: '#ffffff',
          socialTitle: '',
          quickLinksTitle: '',
          contactTitle: '',
          quickLinks: [
            { url: '#privacy', label: '' },
            { url: '#terms', label: '' },
            { url: '#contact', label: '' }
          ],
          showContact: true,
          socialLinks: [
            { url: 'https://facebook.com', platform: 'facebook' },
            { url: 'https://instagram.com', platform: 'instagram' },
            { url: 'https://twitter.com', platform: 'twitter' }
          ],
          contactItems: [
            { type: 'phone', value: '+1 (555) 123-4567' },
            { type: 'email', value: 'contact@example.com' },
            { type: 'address', value: '123 Main St, City, State 12345' }
          ],
          copyrightText: '',
          showQuickLinks: true,
          backgroundColor: 'dark',
          showSocialLinks: true,
          verticalPadding: 32,
          horizontalPadding: 16
        }
      }
    ]
  }
  
  const DEFAULT_TEMPLATES = {
    'en-US': {
      patientSummary: {
        title: 'Patient Summary',
        description: 'Default template for patient consultation summaries',
        content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Patient Summary</mark></strong></p><p></p><p><strong>Patient Name:</strong> $patient.fullName$</p><p><strong>Provider: </strong>$me.fullName$</p><p><strong>Date of Visit:</strong> $session.created_at$</p><p></p><p>Dear $patient.first_name$,</p><p>We are providing you with a summary of your recent consultation visit to help you better understand your health and the care you received. This summary includes details about your clinical examination, any findings, treatments performed, and recommendations for future care.</p><p></p><p><strong>Your Clinical Examination</strong></p><p>During your appointment on $session.created_at$, we conducted a comprehensive clinical examination, which included: [Describe the examination performed, including areas assessed and any diagnostic tests or scans taken.] (Only include examination details if explicitly mentioned in the transcript, contextual notes, or clinical note. If not discussed, leave blank or omit.)</p><p></p><p><strong>What We Found</strong></p><p>[Summarise key findings from the examination, such as the condition of assessed areas or any areas of concern.] (Only include findings explicitly mentioned in the transcript, contextual notes, or clinical note. If no concerns were discussed, leave blank or omit.)</p><p></p><p><strong>Treatments Provided</strong></p><p>[Describe treatments performed during this visit, including any procedures or interventions.]</p><p>(Only include treatments explicitly mentioned in the transcript, contextual notes, or clinical note. If no treatment was performed, leave blank or omit.)</p><p></p><p><strong>Our Recommendations for You</strong></p><p>[Include personalised recommendations given to the patient, such as lifestyle advice, care modifications, or specific health care instructions.] (Only include recommendations explicitly mentioned in the transcript, contextual notes, or clinical note. If no recommendations were discussed, leave blank or omit.)</p><p></p><p><strong>Next Steps &amp; Follow-Up Appointments</strong></p><p>- Your next recommended visit: [Date or time frame] (only include if applicable)</p><p>- Treatment still needed: [Specify any pending treatments discussed, such as further assessments or procedures.] (only include if applicable)</p><p>- Referrals: [Mention any referrals to specialists.] (only include if applicable)</p><p></p><p><strong>Your Questions Answered</strong></p><p>[Summarise any questions or concerns the patient raised during the visit, along with the explanations provided.]</p><p>(Only include if explicitly mentioned in the transcript, contextual notes, or clinical note. If no questions were asked, leave blank or omit.)</p><p></p><p><strong>Contact Us</strong></p><p>If you have any questions or concerns about your treatment, please don\'t hesitate to contact us. We are here to help you understand and feel comfortable with your care.</p><p>We appreciate the opportunity to care for your wellbeing and look forward to seeing you at your next visit.</p><p></p><p>Sincerely</p><p>$me.fullName$</p>'
      },
      clinicalReport: {
        title: 'Clinical Report',
        description: 'Default template for clinical reports',
        content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Clinical Report</mark></strong></p><p></p><p><strong>Patient Name:</strong> $patient.fullName$</p><p><strong>Provider: </strong>$me.fullName$</p><p><strong>Date of Visit:</strong> $session.created_at$</p><p></p><p>This clinical report summarizes the consultation visit with the patient. The report includes details about the clinical examination, findings, treatments performed, and recommendations for future care.</p><p></p><p><strong>Clinical Examination</strong></p><p>During the appointment on $session.created_at$, a comprehensive clinical examination was conducted, which included: [Describe the examination performed, including areas assessed and any diagnostic tests or scans taken.] (Only include examination details if explicitly mentioned in the transcript, contextual notes, or clinical note. If not discussed, leave blank or omit.)</p>'
      },
      publicQuoteTemplate: {
        name: 'Default Public Quote Template',
        description: 'Default layout template for public quotes',
        content: ''
      }
    }
  };
  
  function buildPublicQuoteTemplateContent(locale) {
    const base = JSON.parse(JSON.stringify(PUBLIC_QUOTE_TEMPLATE_BASE));
    const currentYear = new Date().getFullYear();
  
    if (locale === 'pt-BR') {
      base.content[0].props.buttonLabel = 'Comecar agora';
      base.content[1].props.title = 'Apresente sua proposta';
      base.content[1].props.description = 'Compartilhe os destaques da sua cotacao com clareza e profissionalismo.';
      base.content[3].props.content[0].props.title = 'Detalhes da cotacao';
      base.content[3].props.content[0].props.description = 'Informacoes resumidas da proposta';
      base.content[3].props.content[2].props.label = 'Cotacao #';
      base.content[3].props.content[4].props.label = 'Total';
      base.content[5].props.quickLinks[0].label = 'Politica de Privacidade';
      base.content[5].props.quickLinks[1].label = 'Termos de Uso';
      base.content[5].props.quickLinks[2].label = 'Contato';
      base.content[5].props.socialTitle = 'Redes sociais';
      base.content[5].props.quickLinksTitle = 'Links rapidos';
      base.content[5].props.contactTitle = 'Contato';
      base.content[5].props.contactItems[0].value = '+55 (11) 1234-5678';
      base.content[5].props.contactItems[2].value = 'Av. Principal, 123 - Cidade, Estado';
      base.content[5].props.copyrightText = `Copyright ${currentYear} Todos os direitos reservados.`;
    } else {
      base.content[0].props.buttonLabel = 'Get Started';
      base.content[1].props.title = 'Hero Title';
      base.content[1].props.description = 'Hero description click here.';
      base.content[3].props.content[0].props.title = 'Card Title';
      base.content[3].props.content[0].props.description = 'Card description goes here';
      base.content[3].props.content[2].props.label = 'Quote #';
      base.content[3].props.content[4].props.label = 'Total';
      base.content[5].props.quickLinks[0].label = 'Privacy Policy';
      base.content[5].props.quickLinks[1].label = 'Terms of Service';
      base.content[5].props.quickLinks[2].label = 'Contact';
      base.content[5].props.socialTitle = 'Social Media';
      base.content[5].props.quickLinksTitle = 'Quick Links';
      base.content[5].props.contactTitle = 'Contact';
      base.content[5].props.contactItems[0].value = '+1 (555) 123-4567';
      base.content[5].props.contactItems[2].value = '123 Main St, City, State 12345';
      base.content[5].props.copyrightText = `Copyright ${currentYear} All rights reserved.`;
    }
  
    return JSON.stringify(base);
  }
  
  function getDefaultTemplates(locale = 'en-US') {
    const data = DEFAULT_TEMPLATES[locale] || DEFAULT_TEMPLATES['en-US'];
    const publicQuoteTemplateContent = buildPublicQuoteTemplateContent(locale);
  
    return {
      patientSummary: data.patientSummary,
      clinicalReport: data.clinicalReport,
      publicQuoteTemplate: {
        ...data.publicQuoteTemplate,
        content: publicQuoteTemplateContent
      }
    };
  }
  
  module.exports = {
    getDefaultTemplates,
    PUBLIC_QUOTE_TEMPLATE_BASE
  };  