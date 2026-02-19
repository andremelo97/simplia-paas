export type Language = 'pt-BR' | 'en'

export const translations = {
  'pt-BR': {
    nav: {
      features: 'Recursos',
      pricing: 'Preço',
      contact: 'Contato',
      demo: 'Demonstração',
      howItWorks: 'Como Funciona',
      forWhom: 'Para Quem',
      testimonials: 'Depoimentos',
      results: 'Resultados',
      products: 'Produtos',
      app: 'App',
      licenses: 'Licenças',
      automation: 'Automações',
      integrations: 'Integrações',
      tqDescription: 'Transcreva consultas e gere cotações automaticamente',
      access: 'Acessar',
      knowApp: 'Conhecer App',
      startTrial: 'Testar Grátis'
    },
    hero: {
      tagline: 'Onde cuidado encontra conversão',
      subtitle: 'Plataforma SaaS para clínicas de estética. Centralize operações, automatize processos e escale seu negócio.',
      cta: 'Conhecer App'
    },
    platform: {
      badge: 'Plataforma Multi-App',
      title: 'Tudo que sua clínica precisa em um só lugar',
      description: 'Acesse todos os aplicativos com login único, personalize sua marca e acompanhe o uso dos recursos. Uma plataforma que cresce junto com o seu negócio.',
      hub: {
        title: 'Hub Central',
        description: 'Seu ponto de partida para todas as ferramentas. Acesse seus apps, configure sua marca e acompanhe métricas.',
        items: [
          'Login único para todos os aplicativos',
          'Personalize logo, cores e identidade visual',
          'Acompanhe uso de transcrição e cotas',
          'Configure comunicação e notificações'
        ]
      },
      ecosystem: {
        title: 'Ecossistema de Apps',
        description: 'Cada aplicativo se encaixa em uma etapa do seu processo. Ative apenas o que você precisa, quando precisar.'
      }
    },
    tqApp: {
      badge: 'App Disponível',
      title: 'TQ - Transcription & Quote',
      description: 'Primeiro aplicativo do ecossistema LivoCare. Transforme consultas em cotações profissionais usando transcrição de áudio, templates inteligentes e IA generativa.',
      learnMore: 'Saiba mais',
      mediaPlaceholder: 'Vídeo em breve',
      features: {
        transcription: {
          title: 'Transcrição Automática',
          description: 'Grave consultas diretamente no navegador ou faça upload de arquivos de áudio. Nossa tecnologia converte áudio em texto com precisão médica em segundos.'
        },
        templates: {
          title: 'Templates com IA Generativa',
          description: 'Crie templates de relatórios e cotações com placeholders inteligentes. Nosso Agente de IA preenche automaticamente usando o contexto da transcrição.'
        },
        quotes: {
          title: 'Cotações com Link Público',
          description: 'Gere cotações profissionais que viram um mini-site personalizado com sua marca. Customize cores, logo e layout. Seu paciente recebe um link exclusivo como se fosse um site seu - sem custo adicional.'
        },
        reports: {
          title: 'Relatórios Clínicos',
          description: 'Produza documentação clínica padronizada a partir das transcrições. Exporte em PDF ou imprima diretamente do sistema.'
        }
      }
    },
    tqPage: {
      hero: {
        badge: 'Produto',
        headline1: 'Transcreva consultas.',
        headline2: 'Envie orçamentos em 2 minutos.',
        subtitle: 'O TQ grava, transcreve e gera cotações profissionais automaticamente. Sem digitação manual. Assista à demonstração de 4 minutos.',
        title: 'Transforme consultas em planos de tratamento e cotações em minutos.',
        description: 'Grave a consulta. O TQ transcreve e organiza tudo. Seu paciente recebe a cotação pronta para decidir.',
        cta1: 'Testar grátis por 7 dias',
        cta2: 'Acessar TQ',
        ctaSubtext: 'sem compromisso',
        videoPlaceholder: 'Vídeo em breve',
        priceFrom: 'a partir de',
        trialBadge: '7 dias grátis',
        ctaStart: 'Começar teste grátis',
        ctaDemo: 'Ver Demo'
      },
      problem: {
        badge: 'O Problema',
        title: 'Depois da consulta, começa o trabalho que ninguém vê.',
        description: 'Você explica o tratamento, atende o paciente, mas depois precisa:',
        items: [
          'Escrever tudo de novo',
          'Montar plano de tratamento',
          'Formatar orçamento',
          'Enviar por e-mail'
        ],
        conclusion: 'Enquanto isso, o paciente esfria.'
      },
      solution: {
        badge: 'A Solução',
        title: 'O TQ faz isso por você, automaticamente.',
        steps: [
          { title: 'Grave a consulta', description: 'No celular ou computador' },
          { title: 'Transcrição automática', description: 'O áudio vira texto em segundos' },
          { title: 'Plano de tratamento', description: 'Gerado com templates inteligentes' },
          { title: 'Cotação profissional', description: 'Vira um link para enviar ao paciente' }
        ]
      },
      benefits: {
        badge: 'Benefícios',
        title: 'Resultados orientados a conversão',
        items: [
          'Economize até 10 horas por semana',
          'Padronize planos de tratamento',
          'Envie orçamentos claros e profissionais',
          'Reduza retrabalho da equipe',
          'Aumente a taxa de fechamento'
        ]
      },
      forWhom: {
        badge: 'Para Quem',
        title: 'O TQ é ideal para quem:',
        items: [
          { emoji: '✨', text: 'Trabalha com estética, implantes ou harmonização' },
          { emoji: '💳', text: 'Atende pacientes particulares' },
          { emoji: '📋', text: 'Precisa explicar e vender planos complexos' },
          { emoji: '⏱️', text: 'Quer ganhar tempo sem perder qualidade' }
        ]
      },
      roi: {
        badge: 'Faça as Contas',
        title: 'O investimento se paga sozinho',
        calculation: {
          line1: 'Se você economiza 10 horas por semana',
          line2: 'e sua hora vale R$ 200',
          line3: 'isso são R$ 8.000 por mês.',
          conclusion: 'O TQ custa R$ 119/mês.'
        }
      },
      pricing: {
        badge: 'Preço',
        title: 'Plano único, sem surpresas',
        subtitle: 'Tudo que você precisa para transformar consultas em conversões.',
        monthly: '/mês',
        trial: {
          badge: 'Teste Grátis',
          title: 'Teste grátis por 7 dias',
          description: '20 horas de transcrição para testar. Sem cartão de crédito.',
          cta: 'Começar Teste Grátis',
          features: ['7 dias grátis', '20h de transcrição', 'Sem cartão']
        },
        plan: {
          name: 'Early Access',
          price: 'R$ 119',
          description: 'Plano completo para validação',
          hours: '60',
          hoursPerDay: '~3h/dia',
          users: '1 Admin',
          features: [
            '60 horas de transcrição/mês',
            'Permite exceder limite mensal',
            '1 licença Admin inclusa (licenças adicionais disponíveis)',
            'Transcrição multilíngue',
            'Suporte completo (criação de templates)',
            'Cancelamento a qualquer momento'
          ]
        },
        selectPlan: 'Começar Agora',
        licenses: {
          title: 'Licenças Adicionais',
          subtitle: 'Adicione mais usuários conforme sua necessidade',
          operations: { name: 'Operations', price: 'R$ 10', description: 'Acesso de leitura' },
          manager: { name: 'Manager', price: 'R$ 20', description: 'Edição e transcrição' },
          admin: { name: 'Admin', price: 'R$ 50', description: 'Acesso total' }
        }
      },
      finalCta: {
        title: 'Teste o TQ por 7 dias e veja na prática.',
        cta: 'Começar teste grátis',
        subtext: 'Sem cartão, sem compromisso'
      },
      howItWorks: {
        badge: 'Como Funciona',
        title: 'Veja o TQ em ação',
        description: 'Cada funcionalidade foi pensada para economizar seu tempo e aumentar suas conversões.'
      },
      integrations: {
        badge: 'Integrações & Automações',
        title: 'Conecte com seus sistemas',
        description: 'Conecte o TQ com suas ferramentas. Nosso time desenvolve integrações sob medida.',
        cards: [
          { title: 'API Própria', description: 'Integre facilmente com qualquer sistema.' },
          { title: 'Qualquer Sistema', description: 'Conecte com seu ERP, CRM ou agenda.' },
          { title: 'Nós Desenvolvemos', description: 'Automações sob medida para você.' }
        ],
        cta: 'Falar com especialista'
      },
      testimonials: {
        badge: 'Depoimentos',
        title: 'O que dizem nossos clientes',
        items: [
          {
            quote: 'Antes eu levava 40 minutos depois de cada consulta para montar o orçamento. Agora faço em 3 minutos. O paciente recebe na hora e fica impressionado.',
            name: 'Dra. Fernanda Costa',
            role: 'Implantodontista • São Paulo',
            initials: 'DF'
          },
          {
            quote: 'Minha secretária não precisa mais transcrever nada. A consulta acaba, o áudio vai pro TQ e em minutos o orçamento está pronto. Dobramos nossos fechamentos.',
            name: 'Dr. Roberto Almeida',
            role: 'Ortodontista • Campinas',
            initials: 'DR'
          },
          {
            quote: 'O link que o paciente recebe é muito profissional. Eles conseguem ver tudo, comparar opções e aprovar direto pelo celular. Reduziu muito as ligações.',
            name: 'Dra. Marina Santos',
            role: 'Odontologia Estética • Santos',
            initials: 'DM'
          },
          {
            quote: 'Tenho 3 consultórios e agora todos seguem o mesmo padrão de orçamento. Acabou aquela bagunça de cada um fazer do seu jeito. Os pacientes notam.',
            name: 'Dr. Carlos Ribeiro',
            role: 'Cirurgião Bucomaxilofacial • SP',
            initials: 'DC'
          }
        ]
      },
      results: {
        badge: 'Resultados',
        cards: [
          { metric: '10h', label: 'economizadas por semana' },
          { metric: '2min', label: 'para criar orçamento' },
          { metric: '2x', label: 'mais orçamentos enviados' },
          { metric: '-90%', label: 'erros em orçamentos' },
          { metric: '+30%', label: 'taxa de fechamento' },
          { metric: '24/7', label: 'acesso do paciente' }
        ]
      },
      floatingButtons: {
        start: 'Começar',
        contact: 'Contato'
      }
    },
    licenses: {
      badge: 'Controle de Acesso',
      title: 'Sistema de Licenças por Perfil',
      description: 'Gerencie o acesso da sua equipe com precisão. Cada usuário recebe uma licença com permissões específicas por aplicativo, garantindo segurança e governança.',
      admin: {
        title: 'Admin',
        description: 'Acesso total ao sistema e configurações.',
        permissions: [
          'Gerenciar usuários e licenças',
          'Configurar branding e comunicação',
          'Acesso completo a transcrições',
          'Todas as permissões de Manager'
        ]
      },
      manager: {
        title: 'Manager',
        description: 'Edição de registros e acesso a transcrições.',
        permissions: [
          'Editar pacientes e sessões',
          'Criar e editar cotações',
          'Gravar e transcrever áudios',
          'Gerenciar templates'
        ]
      },
      operations: {
        title: 'Operations',
        description: 'Acesso de leitura aos registros.',
        permissions: [
          'Visualizar pacientes e sessões',
          'Visualizar cotações e relatórios',
          'Sem acesso a transcrição',
          'Sem acesso a configurações'
        ]
      }
    },
    comingSoon: {
      badge: 'Roadmap',
      title: 'Mais apps em breve',
      description: 'Estamos expandindo o ecossistema LivoCare com novos aplicativos especializados para atender todas as necessidades da sua clínica.',
      apps: ['CRM Clínico', 'Agendamento', 'Agentes de I.A', 'Marketing Automation']
    },
    automation: {
      badge: 'Automação & Integração',
      title: 'Soluções personalizadas para o seu negócio',
      description: 'Nossos produtos possuem API própria, facilitando criar integrações personalizadas. Conte com nosso time de desenvolvedores experientes para automações sob medida.',
      cards: [
        { title: 'API Própria', description: 'Todos os produtos possuem API REST + Webhooks. Integrações ficam mais simples.' },
        { title: 'Qualquer Sistema', description: 'Conecte com seu ERP, CRM, agenda ou qualquer ferramenta que você já usa.' },
        { title: 'Time Experiente', description: 'Desenvolvemos automações e agentes de IA sob medida para sua clínica.' }
      ],
      cta: 'Falar com especialista'
    },
    tqAutomation: {
      badge: 'Integrações Sob Medida',
      title: 'Conecte o TQ ao seu ecossistema',
      description: 'O TQ possui API própria, o que nos permite criar integrações personalizadas para sua operação. Nosso time desenvolve a solução ideal para você.',
      cards: [
        { title: 'API RESTful', description: 'Infraestrutura robusta com webhooks prontos para integrações.' },
        { title: 'Qualquer Sistema', description: 'Conectamos o TQ ao seu ERP, CRM, agenda ou qualquer ferramenta que você usa.' },
        { title: 'Nós Desenvolvemos', description: 'Nosso time cria automações e integrações sob medida. Serviço especializado.' }
      ],
      cta: 'Falar com especialista'
    },
    pricing: {
      title: 'Planos e Preços',
      subtitle: 'Escolha o plano ideal para sua clínica',
      monthly: '/mês',
      popular: 'Mais Popular',
      basic: {
        name: 'Basic',
        price: 'R$ 297',
        description: 'Para clínicas iniciando a transformação digital',
        features: [
          '2.400 minutos de transcrição/mês',
          'Templates básicos',
          '1 usuário',
          'Suporte por e-mail'
        ]
      },
      professional: {
        name: 'Professional',
        price: 'R$ 497',
        description: 'Para clínicas em crescimento',
        features: [
          '5.000 minutos de transcrição/mês',
          'Templates ilimitados',
          '5 usuários',
          'Relatórios clínicos',
          'Suporte prioritário'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Sob consulta',
        description: 'Para redes e grandes clínicas',
        features: [
          'Minutos ilimitados',
          'Usuários ilimitados',
          'API de integração',
          'Gerente de conta dedicado',
          'SLA garantido'
        ]
      },
      cta: 'Começar agora'
    },
    contact: {
      badge: 'Fale Conosco',
      title: 'Vamos conversar?',
      subtitle: 'Nossa equipe está pronta para ajudar sua clínica a crescer.',
      name: 'Nome',
      namePlaceholder: 'Seu nome completo',
      company: 'Empresa',
      companyPlaceholder: 'Nome da sua clínica ou empresa',
      email: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      phone: 'Telefone',
      phonePlaceholder: '(11) 99999-9999',
      message: 'Mensagem',
      messagePlaceholder: 'Conte-nos sobre sua necessidade...',
      send: 'Enviar Mensagem',
      sending: 'Enviando...',
      successMessage: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      errorRequired: 'Todos os campos são obrigatórios',
      responseTime: 'Respondemos em até 24 horas',
      preferWhatsApp: 'Prefere WhatsApp?',
      whatsAppButton: 'Conversar agora',
      reasons: {
        demo: 'Agendar uma demonstração do produto',
        automation: 'Solicitar integrações personalizadas',
        questions: 'Tirar dúvidas sobre a plataforma'
      }
    },
    install: {
      hero: {
        title: 'Instalar LivoCare',
        subtitle: 'Acesse o LivoCare direto da tela inicial do seu celular, como um app nativo. Rápido, leve e sem precisar baixar nada pela loja.',
        mobileFeatures: 'Funcionalidades disponíveis no celular:',
        feature1: 'Criar novas sessões de transcrição',
        feature2: 'Visualizar e editar sessões',
        feature3: 'Gerenciar pacientes',
        fullAccess: 'Para acesso completo ao TQ (documentos, templates, cotações e mais), utilize um tablet ou computador.'
      },
      ios: {
        safari: {
          step1: 'Toque em "⋯" na barra do navegador',
          step2: 'Toque em "Compartilhar"',
          step3: 'Toque em "Adicionar à Tela de Início"'
        },
        chrome: {
          step1: 'Toque em "" no topo, junto à URL',
          step2: 'Toque em "⋯ Mais..."',
          step3: 'Role para baixo e toque em "Adicionar à Tela de Início"'
        }
      },
      android: {
        installButton: 'Instalar App',
        installDescription: 'Toque no botão abaixo para instalar diretamente:',
        manualTitle: 'Instalação manual',
        chrome: {
          step1: 'Toque em "⋮" no canto superior direito',
          step2: 'Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"'
        },
        samsung: {
          step1: 'Toque em "≡" na parte inferior',
          step2: 'Toque em "Adicionar página a"',
          step3: 'Selecione "Tela inicial"'
        }
      },
      faq: {
        title: 'Perguntas Frequentes',
        items: [
          {
            question: 'O que é um PWA?',
            answer: 'PWA (Progressive Web App) é uma tecnologia que permite que sites funcionem como aplicativos nativos no seu celular. Você acessa pelo navegador e pode adicionar um atalho na tela inicial — sem precisar baixar pela App Store ou Google Play.'
          },
          {
            question: 'Ocupa espaço no celular?',
            answer: 'Quase nenhum. Diferente de apps tradicionais que podem ocupar centenas de megabytes, um PWA é muito leve e usa cache inteligente para funcionar de forma rápida.'
          },
          {
            question: 'É igual a um app nativo?',
            answer: 'A experiência é muito parecida: abre em tela cheia, tem ícone na tela inicial e funciona de forma fluida. A principal diferença é que você não precisa passar pela loja de aplicativos para instalar.'
          },
          {
            question: 'Como desinstalo?',
            answer: 'Da mesma forma que qualquer app: no iPhone, segure o ícone e toque em "Remover App". No Android, segure o ícone e arraste para "Desinstalar" ou use as configurações do celular.'
          },
          {
            question: 'Vou receber notificações?',
            answer: 'Isso depende do navegador e do sistema operacional. No Android com Chrome, notificações push são suportadas. No iOS (Safari), o suporte a notificações está disponível a partir do iOS 16.4.'
          }
        ]
      },
      backToTop: 'Voltar ao topo'
    },
    footer: {
      tagline: 'Onde cuidado encontra conversão.',
      quickLinks: 'Links Rápidos',
      links: {
        contact: 'Contato',
        app: 'App',
        access: 'Acessar'
      },
      rights: 'Todos os direitos reservados.',
      madeWith: 'Feito com ❤️ no Brasil'
    }
  },
  'en': {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact',
      demo: 'Demo',
      howItWorks: 'How It Works',
      forWhom: 'For Whom',
      testimonials: 'Testimonials',
      results: 'Results',
      products: 'Products',
      app: 'App',
      licenses: 'Licenses',
      automation: 'Automation',
      integrations: 'Integrations',
      tqDescription: 'Transcribe consultations and generate quotes automatically',
      access: 'Sign In',
      knowApp: 'Discover App',
      startTrial: 'Try Free'
    },
    hero: {
      tagline: 'Where care meets conversion',
      subtitle: 'SaaS platform for aesthetic clinics. Centralize operations, automate processes, and scale your business.',
      cta: 'Discover App'
    },
    platform: {
      badge: 'Multi-App Platform',
      title: 'Everything your clinic needs in one place',
      description: 'Access all applications with single sign-on, customize your brand, and track resource usage. A platform that grows with your business.',
      hub: {
        title: 'Central Hub',
        description: 'Your starting point for all tools. Access your apps, configure your brand, and track metrics.',
        items: [
          'Single login for all applications',
          'Customize logo, colors, and visual identity',
          'Track transcription usage and quotas',
          'Configure communication and notifications'
        ]
      },
      ecosystem: {
        title: 'App Ecosystem',
        description: 'Each app fits into a step of your workflow. Activate only what you need, when you need it.'
      }
    },
    tqApp: {
      badge: 'Available Now',
      title: 'TQ - Transcription & Quote',
      description: 'First application in the LivoCare ecosystem. Transform consultations into professional quotes using audio transcription, smart templates, and generative AI.',
      learnMore: 'Learn more',
      mediaPlaceholder: 'Video coming soon',
      features: {
        transcription: {
          title: 'Automatic Transcription',
          description: 'Record consultations directly in the browser or upload audio files. Our technology converts audio to text with medical-grade accuracy in seconds.'
        },
        templates: {
          title: 'Templates with Generative AI',
          description: 'Create report and quote templates with smart placeholders. Our AI Agent automatically fills them using transcription context.'
        },
        quotes: {
          title: 'Quotes with Public Link',
          description: 'Generate professional quotes that become a personalized mini-site with your brand. Customize colors, logo, and layout. Your patient receives an exclusive link like it was your own website - at no extra cost.'
        },
        reports: {
          title: 'Clinical Reports',
          description: 'Produce standardized clinical documentation from transcriptions. Export to PDF or print directly from the system.'
        }
      }
    },
    tqPage: {
      hero: {
        badge: 'Product',
        headline1: 'Transcribe consultations.',
        headline2: 'Send quotes in 2 minutes.',
        subtitle: 'TQ records, transcribes, and generates professional quotes automatically. No manual typing. Watch the 4-minute demo.',
        title: 'Transform consultations into treatment plans and quotes in minutes.',
        description: 'Record the consultation. TQ transcribes and organizes everything. Your patient receives the quote ready to decide.',
        cta1: 'Try free for 7 days',
        cta2: 'Access TQ',
        ctaSubtext: 'no commitment',
        videoPlaceholder: 'Video coming soon',
        priceFrom: 'starting at',
        trialBadge: '7 days free',
        ctaStart: 'Start free trial',
        ctaDemo: 'Watch Demo'
      },
      problem: {
        badge: 'The Problem',
        title: 'After the consultation, the invisible work begins.',
        description: 'You explain the treatment, attend the patient, but then you need to:',
        items: [
          'Write everything again',
          'Create the treatment plan',
          'Format the quote',
          'Send via email'
        ],
        conclusion: 'Meanwhile, the patient cools off.'
      },
      solution: {
        badge: 'The Solution',
        title: 'TQ does this for you, automatically.',
        steps: [
          { title: 'Record the consultation', description: 'On mobile or computer' },
          { title: 'Automatic transcription', description: 'Audio becomes text in seconds' },
          { title: 'Treatment plan', description: 'Generated with smart templates' },
          { title: 'Professional quote', description: 'Becomes a link to send to the patient' }
        ]
      },
      benefits: {
        badge: 'Benefits',
        title: 'Conversion-oriented results',
        items: [
          'Save up to 10 hours per week',
          'Standardize treatment plans',
          'Send clear, professional quotes',
          'Reduce team rework',
          'Increase closing rate'
        ]
      },
      forWhom: {
        badge: 'For Whom',
        title: 'TQ is ideal for those who:',
        items: [
          { emoji: '✨', text: 'Work with aesthetics, implants, or harmonization' },
          { emoji: '💳', text: 'Serve private patients' },
          { emoji: '📋', text: 'Need to explain and sell complex plans' },
          { emoji: '⏱️', text: 'Want to save time without losing quality' }
        ]
      },
      roi: {
        badge: 'Do the Math',
        title: 'The investment pays for itself',
        calculation: {
          line1: 'If you save 10 hours per week',
          line2: 'and your hour is worth R$ 200',
          line3: 'that\'s R$ 8,000 per month.',
          conclusion: 'TQ costs R$ 119/month.'
        }
      },
      pricing: {
        badge: 'Pricing',
        title: 'Single plan, no surprises',
        subtitle: 'Everything you need to transform consultations into conversions.',
        monthly: '/month',
        trial: {
          badge: 'Free Trial',
          title: 'Try it free for 7 days',
          description: '20 hours of transcription to test. No credit card required.',
          cta: 'Start Free Trial',
          features: ['7 days free', '20h transcription', 'No credit card']
        },
        plan: {
          name: 'Early Access',
          price: 'R$ 119',
          description: 'Complete plan for validation',
          hours: '60',
          hoursPerDay: '~3h/day',
          users: '1 Admin',
          features: [
            '60 transcription hours/month',
            'Allows exceeding monthly limit',
            '1 Admin license included (additional licenses available)',
            'Multilingual transcription',
            'Full support (template creation)',
            'Cancel anytime'
          ]
        },
        selectPlan: 'Get Started',
        licenses: {
          title: 'Additional Licenses',
          subtitle: 'Add more users as needed',
          operations: { name: 'Operations', price: 'R$ 10', description: 'Read-only access' },
          manager: { name: 'Manager', price: 'R$ 20', description: 'Editing and transcription' },
          admin: { name: 'Admin', price: 'R$ 50', description: 'Full access' }
        }
      },
      finalCta: {
        title: 'Try TQ for 7 days and see it in action.',
        cta: 'Start free trial',
        subtext: 'No credit card, no commitment'
      },
      howItWorks: {
        badge: 'How It Works',
        title: 'See TQ in action',
        description: 'Each feature was designed to save your time and increase your conversions.'
      },
      integrations: {
        badge: 'Integrations & Automations',
        title: 'Connect with your systems',
        description: 'Connect TQ with your tools. Our team develops custom integrations.',
        cards: [
          { title: 'Built-in API', description: 'Easily integrate with any system.' },
          { title: 'Any System', description: 'Connect with your ERP, CRM, or calendar.' },
          { title: 'We Develop It', description: 'Custom automations for you.' }
        ],
        cta: 'Talk to a specialist'
      },
      testimonials: {
        badge: 'Testimonials',
        title: 'What our customers say',
        items: [
          {
            quote: 'I used to spend 40 minutes after each consultation to create the quote. Now I do it in 3 minutes. The patient receives it immediately and is impressed.',
            name: 'Dr. Fernanda Costa',
            role: 'Implant Dentist • São Paulo',
            initials: 'DF'
          },
          {
            quote: 'My secretary no longer needs to transcribe anything. The consultation ends, the audio goes to TQ and in minutes the quote is ready. We doubled our closings.',
            name: 'Dr. Roberto Almeida',
            role: 'Orthodontist • Campinas',
            initials: 'DR'
          },
          {
            quote: 'The link the patient receives is very professional. They can see everything, compare options and approve directly from their phone. It greatly reduced calls.',
            name: 'Dr. Marina Santos',
            role: 'Aesthetic Dentistry • Santos',
            initials: 'DM'
          },
          {
            quote: 'I have 3 offices and now they all follow the same quote standard. No more mess of everyone doing it their own way. Patients notice.',
            name: 'Dr. Carlos Ribeiro',
            role: 'Oral Surgeon • SP',
            initials: 'DC'
          }
        ]
      },
      results: {
        badge: 'Results',
        cards: [
          { metric: '10h', label: 'saved per week' },
          { metric: '2min', label: 'to create a quote' },
          { metric: '2x', label: 'more quotes sent' },
          { metric: '-90%', label: 'quote errors' },
          { metric: '+30%', label: 'closing rate' },
          { metric: '24/7', label: 'patient access' }
        ]
      },
      floatingButtons: {
        start: 'Start',
        contact: 'Contact'
      }
    },
    licenses: {
      badge: 'Access Control',
      title: 'Profile-Based License System',
      description: 'Manage your team access with precision. Each user receives a license with specific permissions per application, ensuring security and governance.',
      admin: {
        title: 'Admin',
        description: 'Full system and configuration access.',
        permissions: [
          'Manage users and licenses',
          'Configure branding and communication',
          'Full transcription access',
          'All Manager permissions'
        ]
      },
      manager: {
        title: 'Manager',
        description: 'Record editing and transcription access.',
        permissions: [
          'Edit patients and sessions',
          'Create and edit quotes',
          'Record and transcribe audio',
          'Manage templates'
        ]
      },
      operations: {
        title: 'Operations',
        description: 'Read-only access to records.',
        permissions: [
          'View patients and sessions',
          'View quotes and reports',
          'No transcription access',
          'No configuration access'
        ]
      }
    },
    comingSoon: {
      badge: 'Roadmap',
      title: 'More apps coming soon',
      description: 'We are expanding the LivoCare ecosystem with new specialized applications to meet all your clinic needs.',
      apps: ['Clinical CRM', 'Scheduling', 'AI Agents', 'Marketing Automation']
    },
    automation: {
      badge: 'Automation & Integration',
      title: 'Custom solutions for your business',
      description: 'Our products have their own API, making it easy to create custom integrations. Count on our team of experienced developers for tailored automations.',
      cards: [
        { title: 'Built-in API', description: 'All products have REST API + Webhooks. Integrations become simpler.' },
        { title: 'Any System', description: 'Connect with your ERP, CRM, calendar, or any tool you already use.' },
        { title: 'Expert Team', description: 'We build custom automations and AI agents tailored to your clinic.' }
      ],
      cta: 'Talk to a specialist'
    },
    tqAutomation: {
      badge: 'Custom Integrations',
      title: 'Connect TQ to your ecosystem',
      description: 'TQ has its own API, which allows us to create custom integrations for your operation. Our team develops the ideal solution for you.',
      cards: [
        { title: 'RESTful API', description: 'Robust infrastructure with webhooks ready for integrations.' },
        { title: 'Any System', description: 'We connect TQ to your ERP, CRM, calendar, or any tool you use.' },
        { title: 'We Develop It', description: 'Our team creates custom automations and integrations. Specialized service.' }
      ],
      cta: 'Talk to a specialist'
    },
    pricing: {
      title: 'Plans & Pricing',
      subtitle: 'Choose the perfect plan for your clinic',
      monthly: '/month',
      popular: 'Most Popular',
      basic: {
        name: 'Basic',
        price: 'R$ 297',
        description: 'For clinics starting their digital transformation',
        features: [
          '2,400 transcription minutes/month',
          'Basic templates',
          '1 user',
          'Email support'
        ]
      },
      professional: {
        name: 'Professional',
        price: 'R$ 497',
        description: 'For growing clinics',
        features: [
          '5,000 transcription minutes/month',
          'Unlimited templates',
          '5 users',
          'Clinical reports',
          'Priority support'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Contact us',
        description: 'For networks and large clinics',
        features: [
          'Unlimited minutes',
          'Unlimited users',
          'Integration API',
          'Dedicated account manager',
          'Guaranteed SLA'
        ]
      },
      cta: 'Get started'
    },
    contact: {
      badge: 'Contact Us',
      title: 'Let\'s talk?',
      subtitle: 'Our team is ready to help your clinic grow.',
      name: 'Name',
      namePlaceholder: 'Your full name',
      company: 'Company',
      companyPlaceholder: 'Your clinic or company name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      phone: 'Phone',
      phonePlaceholder: '+1 (555) 123-4567',
      message: 'Message',
      messagePlaceholder: 'Tell us about your needs...',
      send: 'Send Message',
      sending: 'Sending...',
      successMessage: 'Message sent successfully! We will contact you soon.',
      errorRequired: 'All fields are required',
      responseTime: 'We respond within 24 hours',
      preferWhatsApp: 'Prefer WhatsApp?',
      whatsAppButton: 'Chat now',
      reasons: {
        demo: 'Schedule a product demo',
        automation: 'Request custom integrations',
        questions: 'Ask questions about the platform'
      }
    },
    install: {
      hero: {
        title: 'Install LivoCare',
        subtitle: 'Access LivoCare directly from your home screen, just like a native app. Fast, lightweight, and no app store download needed.',
        mobileFeatures: 'Features available on mobile:',
        feature1: 'Create new transcription sessions',
        feature2: 'View and edit sessions',
        feature3: 'Manage patients',
        fullAccess: 'For full TQ access (documents, templates, quotes and more), use a tablet or computer.'
      },
      ios: {
        safari: {
          step1: 'Tap "⋯" in the browser bar',
          step2: 'Tap "Share"',
          step3: 'Tap "Add to Home Screen"'
        },
        chrome: {
          step1: 'Tap "" at the top, next to the URL',
          step2: 'Tap "⋯ More..."',
          step3: 'Scroll down and tap "Add to Home Screen"'
        }
      },
      android: {
        installButton: 'Install App',
        installDescription: 'Tap the button below to install directly:',
        manualTitle: 'Manual installation',
        chrome: {
          step1: 'Tap "⋮" in the top right corner',
          step2: 'Tap "Install app" or "Add to Home screen"'
        },
        samsung: {
          step1: 'Tap "≡" at the bottom',
          step2: 'Tap "Add page to"',
          step3: 'Select "Home screen"'
        }
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          {
            question: 'What is a PWA?',
            answer: 'A PWA (Progressive Web App) is a technology that allows websites to work like native apps on your phone. You access it through the browser and can add a shortcut to your home screen — no need to download from the App Store or Google Play.'
          },
          {
            question: 'Does it take up storage?',
            answer: 'Barely any. Unlike traditional apps that can take up hundreds of megabytes, a PWA is very lightweight and uses smart caching to run quickly.'
          },
          {
            question: 'Is it the same as a native app?',
            answer: 'The experience is very similar: it opens in full screen, has an icon on the home screen, and runs smoothly. The main difference is that you don\'t need to go through the app store to install it.'
          },
          {
            question: 'How do I uninstall?',
            answer: 'Just like any app: on iPhone, hold the icon and tap "Remove App". On Android, hold the icon and drag to "Uninstall" or use your phone settings.'
          },
          {
            question: 'Will I receive notifications?',
            answer: 'It depends on the browser and operating system. On Android with Chrome, push notifications are supported. On iOS (Safari), notification support is available from iOS 16.4 onwards.'
          }
        ]
      },
      backToTop: 'Back to top'
    },
    footer: {
      tagline: 'Where care meets conversion.',
      quickLinks: 'Quick Links',
      links: {
        contact: 'Contact',
        app: 'App',
        access: 'Sign In'
      },
      rights: 'All rights reserved.',
      madeWith: 'Made with ❤️ in Brazil'
    }
  }
}

export type Translations = typeof translations['pt-BR']
