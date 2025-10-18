import { api } from '@client/config/http';

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateResponse {
  data: EmailTemplate;
  meta: {
    code: string;
  };
}

export const emailTemplateService = {
  /**
   * Get email template for current tenant
   */
  async getTemplate(): Promise<EmailTemplate> {
    const response = await api.get<EmailTemplateResponse>('/api/tq/v1/configurations/email-template');
    return response.data;
  },

  /**
   * Update email template
   */
  async updateTemplate(data: { subject: string; body: string }): Promise<EmailTemplate> {
    const response = await api.post<EmailTemplateResponse>('/api/tq/v1/configurations/email-template', data);
    return response.data;
  },

  /**
   * Reset email template to default based on tenant locale
   */
  async resetTemplate(): Promise<EmailTemplate> {
    const response = await api.post<EmailTemplateResponse>('/api/tq/v1/configurations/email-template/reset', {});
    return response.data;
  }
};
