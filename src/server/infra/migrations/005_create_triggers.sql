-- Migration: Create triggers for automatic data management
-- Description: Contains triggers for auto-creating related records and maintaining data integrity

-- =============================================
-- GENERIC UPDATED_AT FUNCTION
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TENANT BRANDING AUTO-CREATION
-- =============================================

-- Function to auto-create tenant_branding when a tenant is created
CREATE OR REPLACE FUNCTION auto_create_tenant_branding()
RETURNS TRIGGER AS $auto_branding$
BEGIN
  INSERT INTO tenant_branding (
    tenant_id_fk,
    primary_color,
    secondary_color,
    tertiary_color,
    logo_url,
    company_name
  )
  VALUES (
    NEW.id,
    '#B725B7',
    '#E91E63',
    '#5ED6CE',
    NULL,
    NEW.name
  );
  RETURN NEW;
END;
$auto_branding$ LANGUAGE plpgsql;

-- Trigger to call the function after tenant creation
CREATE TRIGGER trigger_auto_create_tenant_branding
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tenant_branding();

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

-- Transcription plans updated_at trigger
CREATE TRIGGER trigger_transcription_plans_updated_at
  BEFORE UPDATE ON public.transcription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tenant transcription config updated_at trigger
CREATE TRIGGER trigger_tenant_transcription_config_updated_at
  BEFORE UPDATE ON public.tenant_transcription_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tenant transcription usage updated_at trigger
CREATE TRIGGER trigger_tenant_transcription_usage_updated_at
  BEFORE UPDATE ON public.tenant_transcription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUTURE TRIGGERS PLACEHOLDER
-- =============================================

-- Additional triggers can be added below as needed
