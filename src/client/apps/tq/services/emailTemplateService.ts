import { api } from '@client/config/http';

export type ColorOption =
  | 'white'
  | 'black'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'primary-gradient'
  | 'secondary-gradient'
  | 'tertiary-gradient';

export type TextColorOption = 'white' | 'black';

export interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  website: string;
}

export interface EmailTemplateSettings {
  ctaButtonText: string;
  showLogo: boolean;
  showSocialLinks: boolean;
  showAddress: boolean;
  showPhone: boolean;
  // Contact info fields
  address: string;
  phone: string;
  socialLinks: SocialLinks;
  headerColor: ColorOption;
  headerTextColor: TextColorOption;
  buttonColor: ColorOption;
  buttonTextColor: TextColorOption;
}

export interface Branding {
  id?: number;
  tenantId?: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  logoUrl: string | null;
  backgroundVideoUrl: string | null;
  companyName: string | null;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  settings: EmailTemplateSettings;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateWithBranding extends EmailTemplate {
  branding: Branding;
  locale: string;
}

export interface EmailTemplateResponse {
  data: EmailTemplateWithBranding;
  meta: {
    code: string;
  };
}

export interface PreviewResponse {
  data: {
    subject: string;
    html: string;
  };
  meta: {
    code: string;
  };
}

export const emailTemplateService = {
  /**
   * Get email template for current tenant (includes branding and locale)
   */
  async getTemplate(): Promise<EmailTemplateWithBranding> {
    const response = await api.get<EmailTemplateResponse>('/api/tq/v1/configurations/email-template');
    return response.data;
  },

  /**
   * Update email template (subject, body, and settings)
   */
  async updateTemplate(data: {
    subject: string;
    body: string;
    settings: EmailTemplateSettings;
  }): Promise<EmailTemplate> {
    const response = await api.post<{ data: EmailTemplate }>('/api/tq/v1/configurations/email-template', data);
    return response.data;
  },

  /**
   * Reset email template to default based on tenant locale
   */
  async resetTemplate(): Promise<EmailTemplate> {
    const response = await api.post<{ data: EmailTemplate }>('/api/tq/v1/configurations/email-template/reset', {});
    return response.data;
  },

  /**
   * Generate preview HTML for email template
   */
  async getPreview(data: {
    subject: string;
    body: string;
    settings: EmailTemplateSettings;
  }): Promise<{ subject: string; html: string }> {
    const response = await api.post<PreviewResponse>('/api/tq/v1/configurations/email-template/preview', data);
    return response.data;
  }
};
