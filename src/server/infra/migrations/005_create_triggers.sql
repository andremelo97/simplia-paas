-- Migration: Create triggers for automatic data management
-- Description: Contains triggers for auto-creating related records and maintaining data integrity

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
    favicon_url,
    company_name
  )
  VALUES (
    NEW.id,
    '#B725B7',
    '#E91E63',
    '#5ED6CE',
    NULL,
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
-- FUTURE TRIGGERS PLACEHOLDER
-- =============================================

-- Additional triggers can be added below as needed
