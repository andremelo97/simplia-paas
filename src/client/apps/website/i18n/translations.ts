export type Language = 'pt-BR' | 'en'

export const translations = {
  'pt-BR': {
    nav: {
      features: 'Plataforma',
      pricing: 'Preços',
      contact: 'Contato',
      access: 'Acessar',
      scheduleDemo: 'Agendar Demonstração'
    },
    hero: {
      tagline: 'Onde o cuidado encontra a conversão',
      subtitle: 'Plataforma SaaS multi-tenant para clínicas de estética. Centralize operações, automatize processos e escale seu negócio.',
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
      title: 'TQ - Transcription Quote',
      description: 'Primeiro aplicativo do ecossistema LivoCare. Transforme consultas em cotações profissionais usando IA generativa, transcrição de áudio e templates inteligentes.',
      mediaPlaceholder: 'Vídeo em breve',
      features: {
        transcription: {
          title: 'Transcrição por IA',
          description: 'Grave consultas diretamente no navegador ou faça upload de arquivos de áudio. Nossa engine de Speech-to-Text (Deepgram Nova-3) converte áudio em texto com precisão médica.'
        },
        templates: {
          title: 'Templates com IA Generativa',
          description: 'Crie templates de relatórios e cotações com placeholders inteligentes. O Agente de IA (GPT-4o) preenche automaticamente usando o contexto da transcrição.'
        },
        quotes: {
          title: 'Cotações com Link Público',
          description: 'Gere cotações profissionais e envie por e-mail com link seguro. Suporte a senha, expiração configurável e tracking de visualizações.'
        },
        reports: {
          title: 'Relatórios Clínicos',
          description: 'Produza documentação clínica padronizada a partir das transcrições. Exporte em PDF ou imprima diretamente do sistema.'
        }
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
      message: 'Mensagem',
      messagePlaceholder: 'Como podemos ajudar?',
      send: 'Enviar Mensagem'
    },
    footer: {
      tagline: 'Plataforma SaaS multi-tenant para clínicas de estética. Onde o cuidado encontra a conversão.',
      quickLinks: 'Links Rápidos',
      links: {
        platform: 'Plataforma',
        pricing: 'Preços',
        contact: 'Contato'
      },
      rights: 'Todos os direitos reservados.',
      madeWith: 'Feito com ❤️ no Brasil'
    }
  },
  'en': {
    nav: {
      features: 'Platform',
      pricing: 'Pricing',
      contact: 'Contact',
      access: 'Sign In',
      scheduleDemo: 'Schedule Demo'
    },
    hero: {
      tagline: 'Where care meets conversion',
      subtitle: 'Multi-tenant SaaS platform for aesthetic clinics. Centralize operations, automate processes, and scale your business.',
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
      title: 'TQ - Transcription Quote',
      description: 'First application in the LivoCare ecosystem. Transform consultations into professional quotes using generative AI, audio transcription, and smart templates.',
      mediaPlaceholder: 'Video coming soon',
      features: {
        transcription: {
          title: 'AI Transcription',
          description: 'Record consultations directly in the browser or upload audio files. Our Speech-to-Text engine (Deepgram Nova-3) converts audio to text with medical-grade accuracy.'
        },
        templates: {
          title: 'Templates with Generative AI',
          description: 'Create report and quote templates with smart placeholders. The AI Agent (GPT-4o) automatically fills them using transcription context.'
        },
        quotes: {
          title: 'Quotes with Public Link',
          description: 'Generate professional quotes and send via email with secure links. Support for passwords, configurable expiration, and view tracking.'
        },
        reports: {
          title: 'Clinical Reports',
          description: 'Produce standardized clinical documentation from transcriptions. Export to PDF or print directly from the system.'
        }
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
      message: 'Message',
      messagePlaceholder: 'How can we help?',
      send: 'Send Message'
    },
    footer: {
      tagline: 'Multi-tenant SaaS platform for aesthetic clinics. Where care meets conversion.',
      quickLinks: 'Quick Links',
      links: {
        platform: 'Platform',
        pricing: 'Pricing',
        contact: 'Contact'
      },
      rights: 'All rights reserved.',
      madeWith: 'Made with ❤️ in Brazil'
    }
  }
}

export type Translations = typeof translations['pt-BR']
