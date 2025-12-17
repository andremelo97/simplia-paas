export type Language = 'pt-BR' | 'en'

export const translations = {
  'pt-BR': {
    nav: {
      features: 'Recursos',
      pricing: 'Preços',
      contact: 'Contato',
      howItWorks: 'Como Funciona',
      forWhom: 'Para Quem',
      products: 'Produtos',
      app: 'App',
      licenses: 'Licenças',
      automation: 'Automações',
      tqDescription: 'Transcreva consultas e gere cotações com IA',
      access: 'Acessar',
      scheduleDemo: 'Agendar Demonstração'
    },
    hero: {
      tagline: 'Onde o cuidado encontra a conversão',
      subtitle: 'Plataforma SaaS para clínicas de estética. Centralize operações, automatize processos e escale seu negócio.',
      cta: 'Agendar Demonstração'
    },
    platform: {
      badge: 'Plataforma Multi-App',
      title: 'Tudo que sua clínica precisa em um só lugar',
      description: 'Esqueça planilhas, papéis e sistemas desconectados. A LivoCare.ai centraliza toda a gestão da sua clínica em uma plataforma inteligente que cresce junto com o seu negócio.',
      hub: {
        title: 'Hub Central',
        description: 'Seu ponto de partida para todas as ferramentas',
        items: [
          'Login único para todos os aplicativos',
          'Gerencie sua equipe e permissões',
          'Personalize com a sua marca',
          'Controle quem acessa o quê',
          'Painel de métricas e uso'
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
      description: 'Primeiro aplicativo do ecossistema LivoCare. Transforme consultas em cotações profissionais usando IA generativa, transcrição de áudio e templates inteligentes.',
      learnMore: 'Saiba mais',
      mediaPlaceholder: 'Vídeo em breve',
      features: {
        transcription: {
          title: 'Transcrição por IA',
          description: 'Grave consultas diretamente no navegador ou faça upload de arquivos de áudio. Nossa tecnologia de transcrição converte áudio em texto com precisão médica.'
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
        badge: 'App LivoCare',
        title: 'TQ - Transcription & Quote',
        description: 'Transforme consultas em cotações profissionais com IA. Grave áudios diretamente no navegador, transcreva com precisão médica usando nossa tecnologia de IA e deixe nosso Agente de IA preencher automaticamente seus templates. Envie cotações personalizadas com link seguro, senha e rastreamento de visualizações.',
        cta1: 'Agendar Demonstração',
        cta2: 'Acessar TQ',
        videoPlaceholder: 'Vídeo em breve'
      },
      howItWorks: {
        badge: 'Como Funciona',
        title: 'Do áudio à cotação em 4 passos',
        subtitle: 'Um fluxo simples e intuitivo que economiza horas do seu dia. Grave consultas, transcreva com IA e envie cotações profissionais em minutos.',
        videoPlaceholder: 'Vídeo demonstrativo em breve',
        steps: [
          { title: 'Grave a consulta', description: 'Grave diretamente no navegador ou faça upload de arquivos de áudio. Suporta diversos formatos e funciona em qualquer dispositivo com microfone.' },
          { title: 'Transcrição automática', description: 'Nossa tecnologia de IA converte o áudio em texto com precisão médica em segundos. Detecta automaticamente o idioma.' },
          { title: 'IA preenche o template', description: 'Nosso Agente de IA analisa a transcrição e preenche automaticamente seu template de cotação ou relatório clínico com as informações relevantes.' },
          { title: 'Envie ao paciente', description: 'A cotação vira um mini-site com sua marca: logo, cores e layout personalizados. Envie o link por e-mail e acompanhe visualizações para converter mais pacientes.' }
        ]
      },
      features: {
        badge: 'Recursos',
        title: 'Tudo que você precisa para criar cotações profissionais',
        subtitle: 'Ferramentas poderosas para otimizar seu fluxo de trabalho clínico.',
        items: [
          { title: 'Transcrição por IA', description: 'Nossa tecnologia de transcrição com precisão médica. Grave no navegador ou faça upload de arquivos.' },
          { title: 'Templates Inteligentes', description: 'Crie templates com placeholders. Nosso Agente de IA preenche usando o contexto da transcrição.' },
          { title: 'Cotação vira Site', description: 'Cada cotação se torna um mini-site com sua identidade visual: logo, cores e layout personalizados. Seu paciente acessa um link exclusivo e profissional - você ganha um site grátis para cada tratamento.' },
          { title: 'Relatórios Clínicos', description: 'Gere documentação clínica padronizada. Exporte em PDF ou imprima diretamente.' },
          { title: 'Gestão de Pacientes', description: 'Cadastro completo de pacientes com histórico de sessões, cotações e relatórios.' },
          { title: 'IA Configurável', description: 'Personalize o comportamento do Agente de IA com prompts customizados para sua clínica.' }
        ]
      },
      forWhom: {
        badge: 'Para Quem',
        title: 'Feito para profissionais de saúde',
        segments: [
          { emoji: '💉', title: 'Clínicas de Estética', description: 'Agilize orçamentos de procedimentos e tratamentos estéticos.' },
          { emoji: '🩺', title: 'Médicos e Consultórios', description: 'Documente consultas e gere relatórios clínicos em minutos.' },
          { emoji: '👤', title: 'Profissionais Autônomos', description: 'Profissionalize seus orçamentos sem precisar de uma equipe.' }
        ]
      },
      benefits: {
        badge: 'Benefícios',
        title: 'Resultados que fazem a diferença',
        items: [
          { stat: '10x', label: 'Mais rápido que digitar manualmente' },
          { stat: '5h', label: 'Economizadas por semana em média' },
          { stat: '0', label: 'Erros de digitação' },
          { stat: '100%', label: 'Na nuvem, acesse de qualquer lugar' }
        ]
      },
      cta: {
        title: 'Pronto para transformar suas consultas em cotações?',
        subtitle: 'Comece agora e veja a diferença na produtividade da sua clínica.',
        button: 'Agendar Demonstração'
      },
      pricing: {
        badge: 'Planos',
        title: 'Escolha o plano ideal para sua clínica',
        subtitle: 'Pacotes de transcrição + licenças de usuário. Comece pequeno e escale conforme cresce.',
        monthly: '/mês',
        popular: 'Mais Popular',
        hours: 'horas',
        minutes: 'minutos',
        startingFrom: 'A partir de',
        perUser: 'por usuário',
        starter: {
          name: 'Starter',
          price: 'R$ 79',
          description: 'Perfeito para começar',
          limit: '1.200 min/mês (20 horas)',
          features: [
            '1 usuário incluso',
            '1.200 minutos de transcrição',
            'Transcrição monolíngue',
            'Templates básicos',
            'Cotações com link público',
            'Suporte por e-mail'
          ]
        },
        basic: {
          name: 'Basic',
          price: 'R$ 159',
          priceNote: 'preço inicial (2 usuários)',
          description: 'Para clínicas em crescimento',
          limit: '2.400 min/mês (40 horas)',
          features: [
            '2 usuários inclusos (adicione mais)',
            '2.400 minutos de transcrição',
            'Transcrição multilíngue automática',
            'Templates ilimitados',
            'Cotações com link público',
            'Relatórios clínicos em PDF',
            'Suporte prioritário'
          ],
          expandable: 'Precisa de mais usuários? Adicione licenças conforme sua necessidade.'
        },
        vip: {
          name: 'VIP',
          price: 'Sob consulta',
          description: 'Para clínicas de alto volume',
          limit: 'Tudo customizável',
          features: [
            'Minutos customizáveis',
            'Permite exceder limite mensal',
            'Usuários ilimitados',
            'Configuração de IA personalizada',
            'Templates de cotação públicos extras',
            'SLA garantido'
          ]
        },
        licenses: {
          title: 'Licenças de Usuário',
          subtitle: 'Preço por tipo de acesso (a partir do Basic)',
          operations: { name: 'Operations', price: 'R$ 35', description: 'Gravação e transcrição' },
          manager: { name: 'Manager', price: 'R$ 55', description: 'Supervisão e aprovações' },
          admin: { name: 'Admin', price: 'R$ 80', description: 'Gestão completa' }
        },
        cta: 'Começar agora'
      }
    },
    licenses: {
      badge: 'Controle de Acesso',
      title: 'Sistema de Licenças por Perfil',
      description: 'Gerencie o acesso da sua equipe com precisão. Cada usuário recebe uma licença com permissões específicas por aplicativo, garantindo segurança e governança.',
      admin: {
        title: 'Admin',
        description: 'Controle total sobre a organização e seus recursos.',
        permissions: [
          'Gerenciar usuários e licenças',
          'Configurar branding e comunicação',
          'Acessar relatórios de uso',
          'Todas as permissões de Manager'
        ]
      },
      manager: {
        title: 'Manager',
        description: 'Supervisão de equipe e gestão operacional.',
        permissions: [
          'Visualizar todos os pacientes',
          'Aprovar e editar cotações',
          'Gerenciar templates',
          'Todas as permissões de Operations'
        ]
      },
      operations: {
        title: 'Operations',
        description: 'Execução das atividades do dia a dia.',
        permissions: [
          'Criar e gravar sessões',
          'Gerar transcrições',
          'Criar cotações e relatórios',
          'Gerenciar seus pacientes'
        ]
      }
    },
    comingSoon: {
      badge: 'Roadmap',
      title: 'Mais apps em breve',
      description: 'Estamos expandindo o ecossistema LivoCare com novos aplicativos especializados para atender todas as necessidades da sua clínica.',
      apps: ['CRM Clínico', 'Agendamento', 'Financeiro', 'Marketing Automation']
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
      title: 'Entre em Contato',
      subtitle: 'Tem alguma dúvida? Fale conosco',
      name: 'Nome',
      namePlaceholder: 'Seu nome completo',
      email: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      phone: 'Telefone',
      phonePlaceholder: '(11) 99999-9999',
      message: 'Mensagem',
      messagePlaceholder: 'Como podemos ajudar?',
      send: 'Enviar Mensagem',
      sending: 'Enviando...',
      successMessage: 'Mensagem enviada com sucesso! Entraremos em contato dentro de 24 horas.',
      errorRequired: 'Todos os campos são obrigatórios'
    },
    footer: {
      tagline: 'Onde o cuidado encontra a conversão.',
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
      howItWorks: 'How It Works',
      forWhom: 'For Whom',
      products: 'Products',
      app: 'App',
      licenses: 'Licenses',
      automation: 'Automation',
      tqDescription: 'Transcribe consultations and generate quotes with AI',
      access: 'Sign In',
      scheduleDemo: 'Schedule Demo'
    },
    hero: {
      tagline: 'Where care meets conversion',
      subtitle: 'SaaS platform for aesthetic clinics. Centralize operations, automate processes, and scale your business.',
      cta: 'Schedule Demo'
    },
    platform: {
      badge: 'Multi-App Platform',
      title: 'Everything your clinic needs in one place',
      description: 'Forget spreadsheets, paperwork, and disconnected systems. LivoCare.ai centralizes your entire clinic management in one smart platform that grows with your business.',
      hub: {
        title: 'Central Hub',
        description: 'Your starting point for all tools',
        items: [
          'Single login for all applications',
          'Manage your team and permissions',
          'Customize with your brand',
          'Control who accesses what',
          'Metrics and usage dashboard'
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
      description: 'First application in the LivoCare ecosystem. Transform consultations into professional quotes using generative AI, audio transcription, and smart templates.',
      learnMore: 'Learn more',
      mediaPlaceholder: 'Video coming soon',
      features: {
        transcription: {
          title: 'AI Transcription',
          description: 'Record consultations directly in the browser or upload audio files. Our transcription technology converts audio to text with medical-grade accuracy.'
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
        badge: 'LivoCare App',
        title: 'TQ - Transcription & Quote',
        description: 'Transform consultations into professional quotes with AI. Record audio directly in the browser, transcribe with medical-grade accuracy using our AI technology, and let our AI Agent automatically fill your templates. Send personalized quotes with secure links, passwords, and view tracking.',
        cta1: 'Schedule Demo',
        cta2: 'Access TQ',
        videoPlaceholder: 'Video coming soon'
      },
      howItWorks: {
        badge: 'How It Works',
        title: 'From audio to quote in 4 steps',
        subtitle: 'A simple and intuitive workflow that saves hours of your day. Record consultations, transcribe with AI, and send professional quotes in minutes.',
        videoPlaceholder: 'Demo video coming soon',
        steps: [
          { title: 'Record the consultation', description: 'Record directly in the browser or upload audio files. Supports multiple formats and works on any device with a microphone.' },
          { title: 'Automatic transcription', description: 'Our AI technology converts audio to text with medical-grade accuracy in seconds. Automatically detects language.' },
          { title: 'AI fills the template', description: 'Our AI Agent analyzes the transcription and automatically fills your quote or clinical report template with relevant information.' },
          { title: 'Send to patient', description: 'The quote becomes a mini-site with your brand: logo, colors, and personalized layout. Send the link via email and track views to convert more patients.' }
        ]
      },
      features: {
        badge: 'Features',
        title: 'Everything you need to create professional quotes',
        subtitle: 'Powerful tools to optimize your clinical workflow.',
        items: [
          { title: 'AI Transcription', description: 'Our transcription technology with medical-grade accuracy. Record in browser or upload files.' },
          { title: 'Smart Templates', description: 'Create templates with placeholders. Our AI Agent fills them using transcription context.' },
          { title: 'Quote becomes a Website', description: 'Each quote becomes a mini-site with your visual identity: logo, colors, and personalized layout. Your patient accesses an exclusive, professional link - you get a free website for each treatment.' },
          { title: 'Clinical Reports', description: 'Generate standardized clinical documentation. Export to PDF or print directly.' },
          { title: 'Patient Management', description: 'Complete patient registry with session history, quotes, and reports.' },
          { title: 'Configurable AI', description: 'Customize the AI Agent behavior with custom prompts for your clinic.' }
        ]
      },
      forWhom: {
        badge: 'For Whom',
        title: 'Made for healthcare professionals',
        segments: [
          { emoji: '💉', title: 'Aesthetic Clinics', description: 'Streamline quotes for procedures and aesthetic treatments.' },
          { emoji: '🩺', title: 'Doctors & Offices', description: 'Document consultations and generate clinical reports in minutes.' },
          { emoji: '👤', title: 'Independent Professionals', description: 'Professionalize your quotes without needing a team.' }
        ]
      },
      benefits: {
        badge: 'Benefits',
        title: 'Results that make a difference',
        items: [
          { stat: '10x', label: 'Faster than typing manually' },
          { stat: '5h', label: 'Saved per week on average' },
          { stat: '0', label: 'Typing errors' },
          { stat: '100%', label: 'Cloud-based, access from anywhere' }
        ]
      },
      cta: {
        title: 'Ready to transform your consultations into quotes?',
        subtitle: 'Start now and see the difference in your clinic productivity.',
        button: 'Schedule Demo'
      },
      pricing: {
        badge: 'Plans',
        title: 'Choose the perfect plan for your clinic',
        subtitle: 'Transcription packages + user licenses. Start small and scale as you grow.',
        monthly: '/month',
        popular: 'Most Popular',
        hours: 'hours',
        minutes: 'minutes',
        startingFrom: 'Starting from',
        perUser: 'per user',
        starter: {
          name: 'Starter',
          price: 'R$ 79',
          description: 'Perfect to get started',
          limit: '1,200 min/month (20 hours)',
          features: [
            '1 user included',
            '1,200 transcription minutes',
            'Monolingual transcription',
            'Basic templates',
            'Public quote links',
            'Email support'
          ]
        },
        basic: {
          name: 'Basic',
          price: 'R$ 159',
          priceNote: 'starting price (2 users)',
          description: 'For growing clinics',
          limit: '2,400 min/month (40 hours)',
          features: [
            '2 users included (add more)',
            '2,400 transcription minutes',
            'Automatic multilingual transcription',
            'Unlimited templates',
            'Public quote links',
            'Clinical reports in PDF',
            'Priority support'
          ],
          expandable: 'Need more users? Add licenses as needed.'
        },
        vip: {
          name: 'VIP',
          price: 'Contact us',
          description: 'For high-volume clinics',
          limit: 'Fully customizable',
          features: [
            'Custom minutes',
            'Allows exceeding monthly limit',
            'Unlimited users',
            'Custom AI configuration',
            'Extra public quote templates',
            'Guaranteed SLA'
          ]
        },
        licenses: {
          title: 'User Licenses',
          subtitle: 'Price by access type (from Basic onwards)',
          operations: { name: 'Operations', price: 'R$ 35', description: 'Recording and transcription' },
          manager: { name: 'Manager', price: 'R$ 55', description: 'Supervision and approvals' },
          admin: { name: 'Admin', price: 'R$ 80', description: 'Full management' }
        },
        cta: 'Get started'
      }
    },
    licenses: {
      badge: 'Access Control',
      title: 'Profile-Based License System',
      description: 'Manage your team access with precision. Each user receives a license with specific permissions per application, ensuring security and governance.',
      admin: {
        title: 'Admin',
        description: 'Full control over the organization and its resources.',
        permissions: [
          'Manage users and licenses',
          'Configure branding and communication',
          'Access usage reports',
          'All Manager permissions'
        ]
      },
      manager: {
        title: 'Manager',
        description: 'Team supervision and operational management.',
        permissions: [
          'View all patients',
          'Approve and edit quotes',
          'Manage templates',
          'All Operations permissions'
        ]
      },
      operations: {
        title: 'Operations',
        description: 'Day-to-day activity execution.',
        permissions: [
          'Create and record sessions',
          'Generate transcriptions',
          'Create quotes and reports',
          'Manage own patients'
        ]
      }
    },
    comingSoon: {
      badge: 'Roadmap',
      title: 'More apps coming soon',
      description: 'We are expanding the LivoCare ecosystem with new specialized applications to meet all your clinic needs.',
      apps: ['Clinical CRM', 'Scheduling', 'Financial', 'Marketing Automation']
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
      title: 'Contact Us',
      subtitle: 'Have questions? Get in touch',
      name: 'Name',
      namePlaceholder: 'Your full name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      phone: 'Phone',
      phonePlaceholder: '+1 (555) 123-4567',
      message: 'Message',
      messagePlaceholder: 'How can we help?',
      send: 'Send Message',
      sending: 'Sending...',
      successMessage: 'Message sent successfully! We will contact you within 24 hours.',
      errorRequired: 'All fields are required'
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
