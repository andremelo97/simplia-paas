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
  'pt-BR': {
    patientSummary: {
      title: 'Resumo do Paciente',
      description: 'Template padrão para resumos de consultas de pacientes',
      content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Resumo do Paciente</mark></strong></p><p></p><p><strong>Nome do Paciente:</strong> $patient.fullName$</p><p><strong>Profissional: </strong>$me.fullName$</p><p><strong>Data da Consulta:</strong> $session.created_at$</p><p></p><p>Prezado(a) $patient.first_name$,</p><p>Estamos fornecendo um resumo de sua recente consulta para ajudá-lo(a) a entender melhor sua saúde e os cuidados que recebeu. Este resumo inclui detalhes sobre seu exame clínico, quaisquer achados, tratamentos realizados e recomendações para cuidados futuros.</p><p></p><p><strong>Seu Exame Clínico</strong></p><p>Durante sua consulta em $session.created_at$, realizamos um exame clínico abrangente, que incluiu: [Descreva o exame realizado, incluindo áreas avaliadas e quaisquer testes diagnósticos ou exames realizados.] (Inclua apenas detalhes do exame se explicitamente mencionados na transcrição, notas contextuais ou nota clínica. Se não discutido, deixe em branco ou omita.)</p><p></p><p><strong>O Que Encontramos</strong></p><p>[Resuma os principais achados do exame, como a condição das áreas avaliadas ou quaisquer áreas de preocupação.] (Inclua apenas achados explicitamente mencionados na transcrição, notas contextuais ou nota clínica. Se nenhuma preocupação foi discutida, deixe em branco ou omita.)</p><p></p><p><strong>Tratamentos Realizados</strong></p><p>[Descreva os tratamentos realizados durante esta consulta, incluindo quaisquer procedimentos ou intervenções.]</p><p>(Inclua apenas tratamentos explicitamente mencionados na transcrição, notas contextuais ou nota clínica. Se nenhum tratamento foi realizado, deixe em branco ou omita.)</p><p></p><p><strong>Nossas Recomendações para Você</strong></p><p>[Inclua recomendações personalizadas dadas ao paciente, como conselhos de estilo de vida, modificações de cuidados ou instruções específicas de saúde.] (Inclua apenas recomendações explicitamente mencionadas na transcrição, notas contextuais ou nota clínica. Se nenhuma recomendação foi discutida, deixe em branco ou omita.)</p><p></p><p><strong>Próximos Passos e Consultas de Acompanhamento</strong></p><p>- Sua próxima consulta recomendada: [Data ou período] (inclua apenas se aplicável)</p><p>- Tratamento ainda necessário: [Especifique quaisquer tratamentos pendentes discutidos, como avaliações ou procedimentos adicionais.] (inclua apenas se aplicável)</p><p>- Encaminhamentos: [Mencione quaisquer encaminhamentos para especialistas.] (inclua apenas se aplicável)</p><p></p><p><strong>Suas Perguntas Respondidas</strong></p><p>[Resuma quaisquer perguntas ou preocupações que o paciente levantou durante a consulta, juntamente com as explicações fornecidas.]</p><p>(Inclua apenas se explicitamente mencionado na transcrição, notas contextuais ou nota clínica. Se nenhuma pergunta foi feita, deixe em branco ou omita.)</p><p></p><p><strong>Entre em Contato Conosco</strong></p><p>Se você tiver alguma dúvida ou preocupação sobre seu tratamento, não hesite em entrar em contato conosco. Estamos aqui para ajudá-lo(a) a entender e se sentir confortável com seus cuidados.</p><p>Agradecemos a oportunidade de cuidar do seu bem-estar e esperamos vê-lo(a) em sua próxima consulta.</p><p></p><p>Atenciosamente</p><p>$me.fullName$</p>'
    },
    clinicalReport: {
      title: 'Relatório Clínico',
      description: 'Template padrão para relatórios clínicos completos',
      content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Notas da Consulta</mark></strong></p><p></p><p>Dr(a). $me.fullName$ atendeu $patient.fullName$ hoje sobre [motivo da consulta]. O paciente [descrever sintomas relevantes, preocupações ou motivo da visita] [Forneça um resumo conciso do propósito da consulta, incluindo sintomas, preocupações ou detalhes de exame de rotina. Se o paciente foi encaminhado, especifique o nome do médico que encaminhou e o motivo. Use frases completas para manter a clareza.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Histórico Médico Anterior:</strong></p><p>[Breve histórico de tratamentos médicos relevantes anteriores, incluindo datas e detalhes associados: Resumir procedimentos médicos anteriores relevantes para esta consulta. Incluir tratamentos como medicações, cirurgias, procedimentos ou terapias. Mencione se os tratamentos anteriores foram bem-sucedidos ou se o paciente tem problemas recorrentes.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Histórico Médico:</strong></p><p>[Liste o histórico médico relevante, incluindo alergias e condições mencionadas: documente quaisquer condições médicas relevantes, alergias ou medicamentos que possam impactar o tratamento.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Exame Clínico:</strong></p><p>- <strong>Exame Físico Geral:</strong> [Achados do exame físico geral: documente achados como sinais vitais, aparência geral, ou outras anormalidades. Se nenhuma anormalidade foi detectada, indique "Sem alterações."]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p>- <strong>Exame Específico:</strong> [Achados de exames específicos por sistema: Inclua achados relevantes como exames cardiovascular, respiratório, neurológico, musculoesquelético ou outras observações específicas.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Exames Complementares:</strong></p><p>[Tipo de exames realizados e achados: Especifique quais exames foram solicitados ou realizados, ex.: exames de sangue, raio-X, ultrassom, ressonância, tomografia. Forneça os achados, incluindo valores laboratoriais, achados de imagem ou outras observações relevantes.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Testes Clínicos:</strong></p><p>- Reflexos - [Resultados para testes realizados]</p><p>- Palpação - [Resultados para áreas testadas]</p><p>- Mobilidade - [Resultados para articulações testadas]</p><p>- Sensibilidade - [Resultados para áreas testadas]</p><p>- Outros testes - [Resultados de testes adicionais realizados]</p><p>(Inclua resultados de todos os testes clínicos realizados, garantindo clareza e consistência no formato.)</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Meus diagnósticos foram:</strong></p><p>[Diagnóstico, incluindo condições médicas relevantes: Liste cada diagnóstico separadamente, especificando achados como condições agudas, crônicas, patologias identificadas ou outras preocupações. Use terminologia apropriada e frases completas.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Plano de Tratamento:</strong></p><p>[Tratamento recomendado com base nos achados: detalhe o plano de tratamento, especificando procedimentos como medicações, terapias, procedimentos cirúrgicos ou acompanhamento. Indique claramente se o tratamento será em fases e quem será responsável por procedimentos específicos. Descreva qualquer explicação, educação ou justificativa discutida com o paciente.]</p><p>[Encaminhamento para outro profissional, se aplicável. Se encaminhando para um especialista ou outro médico, especifique o motivo do encaminhamento e o tratamento esperado que será fornecido.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p><p></p><p><strong>Complicações/riscos discutidos:</strong></p><p>[Riscos potenciais relevantes ao tratamento recomendado: liste complicações potenciais associadas ao plano de tratamento, como dor, inchaço, infecção, riscos procedimentais ou resultados a longo prazo. Descreva qualquer explicação, educação ou justificativa discutida com o paciente.]</p><p>(Inclua apenas informações se explicitamente mencionadas na transcrição, notas contextuais ou nota clínica.)</p>'
    },
    publicQuoteTemplate: {
      name: 'Template Padrão de Cotação Pública',
      description: 'Template de layout padrão para cotações públicas',
      content: ''
    }
  },
  'en-US': {
    patientSummary: {
      title: 'Patient Summary',
      description: 'Default template for patient consultation summaries',
      content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Patient Summary</mark></strong></p><p></p><p><strong>Patient Name:</strong> $patient.fullName$</p><p><strong>Provider: </strong>$me.fullName$</p><p><strong>Date of Visit:</strong> $session.created_at$</p><p></p><p>Dear $patient.first_name$,</p><p>We are providing you with a summary of your recent consultation visit to help you better understand your health and the care you received. This summary includes details about your clinical examination, any findings, treatments performed, and recommendations for future care.</p><p></p><p><strong>Your Clinical Examination</strong></p><p>During your appointment on $session.created_at$, we conducted a comprehensive clinical examination, which included: [Describe the examination performed, including areas assessed and any diagnostic tests or scans taken.] (Only include examination details if explicitly mentioned in the transcript, contextual notes, or clinical note. If not discussed, leave blank or omit.)</p><p></p><p><strong>What We Found</strong></p><p>[Summarise key findings from the examination, such as the condition of assessed areas or any areas of concern.] (Only include findings explicitly mentioned in the transcript, contextual notes, or clinical note. If no concerns were discussed, leave blank or omit.)</p><p></p><p><strong>Treatments Provided</strong></p><p>[Describe treatments performed during this visit, including any procedures or interventions.]</p><p>(Only include treatments explicitly mentioned in the transcript, contextual notes, or clinical note. If no treatment was performed, leave blank or omit.)</p><p></p><p><strong>Our Recommendations for You</strong></p><p>[Include personalised recommendations given to the patient, such as lifestyle advice, care modifications, or specific health care instructions.] (Only include recommendations explicitly mentioned in the transcript, contextual notes, or clinical note. If no recommendations were discussed, leave blank or omit.)</p><p></p><p><strong>Next Steps &amp; Follow-Up Appointments</strong></p><p>- Your next recommended visit: [Date or time frame] (only include if applicable)</p><p>- Treatment still needed: [Specify any pending treatments discussed, such as further assessments or procedures.] (only include if applicable)</p><p>- Referrals: [Mention any referrals to specialists.] (only include if applicable)</p><p></p><p><strong>Your Questions Answered</strong></p><p>[Summarise any questions or concerns the patient raised during the visit, along with the explanations provided.]</p><p>(Only include if explicitly mentioned in the transcript, contextual notes, or clinical note. If no questions were asked, leave blank or omit.)</p><p></p><p><strong>Contact Us</strong></p><p>If you have any questions or concerns about your treatment, please don\'t hesitate to contact us. We are here to help you understand and feel comfortable with your care.</p><p>We appreciate the opportunity to care for your wellbeing and look forward to seeing you at your next visit.</p><p></p><p>Sincerely</p><p>$me.fullName$</p>'
    },
    clinicalReport: {
      title: 'Clinical Report',
      description: 'Default template for comprehensive clinical reports',
      content: '<p><strong><mark data-color="var(--tt-color-highlight-purple)" style="background-color: var(--tt-color-highlight-purple); color: inherit;">Consult Notes</mark></strong></p><p></p><p>Dr. $me.fullName$ has seen $patient.fullName$ today about [reason for consultation]. The patient [describe relevant symptoms, concerns, or reason for visit] [Provide a concise summary of the consultation\'s purpose, including symptoms, concerns, or routine examination details. If the patient was referred, specify the referring clinician\'s name and reason for referral. Ensure full sentences are used to maintain clarity.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Previous Medical History:</strong></p><p>[Brief history of relevant past medical treatments, including dates and any associated details: Summarise past medical procedures relevant to this consultation. Include treatments such as medications, surgeries, procedures, or therapies. Mention whether previous treatments were successful or if the patient has had recurring issues.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Medical History:</strong></p><p>[List relevant medical history, including allergies and conditions mentioned: document any relevant medical conditions, allergies, or medications that may impact treatment.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Clinical Examination:</strong></p><p>- <strong>General Physical Examination:</strong> [Findings from the general physical examination: document findings such as vital signs, general appearance, or other abnormalities. If no abnormalities are detected, state "NAD."]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p>- <strong>Specific Examination:</strong> [Findings from system-specific examinations: Include relevant findings such as cardiovascular, respiratory, neurological, musculoskeletal examinations, or other specific observations.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Diagnostic Tests:</strong></p><p>[Type of diagnostic tests performed and findings: Specify which tests were ordered or performed, e.g., blood tests, X-rays, ultrasound, MRI, CT scans. Provide findings, including laboratory values, imaging findings, or other relevant observations.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Clinical Tests:</strong></p><p>- Reflexes - [Results for tested reflexes]</p><p>- Palpation - [Results for tested areas]</p><p>- Mobility - [Results for tested joints]</p><p>- Sensitivity - [Results for tested areas]</p><p>- Other tests - [Results for additional clinical tests performed]</p><p>(Include results for all clinical tests performed, ensuring clarity and consistency in format.)</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>My diagnoses were:</strong></p><p>[Diagnosis, including relevant medical conditions: List each diagnosis separately, specifying findings such as acute conditions, chronic conditions, identified pathologies, or other concerns. Use appropriate terminology and full sentences.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Treatment Plan:</strong></p><p>[Recommended treatment based on findings: outline the treatment plan in detail, specifying procedures such as medications, therapies, surgical procedures, or follow-up. Clearly state if treatment will be phased and who will be responsible for specific procedures. Outline any explanation, education or rationale discussed with the patient.]</p><p>[Referral to another clinician, if applicable. If referring to a specialist or another clinician, specify the reason for referral and the expected treatment they will provide.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p><p></p><p><strong>Complications/risks discussed:</strong></p><p>[Potential risks relevant to the recommended treatment: list potential complications associated with the treatment plan, such as pain, swelling, infection, procedural risks, or long-term outcomes. Outline any explanation, education or rationale discussed with the patient.]</p><p>(Only include information if explicitly mentioned in the transcript, contextual notes, or clinical note.)</p>'
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
