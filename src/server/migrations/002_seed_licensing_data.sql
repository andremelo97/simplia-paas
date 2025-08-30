-- Migration: Seed initial licensing data
-- Description: Creates initial user types and applications

-- Insert user types with hierarchy
INSERT INTO public.user_types (name, slug, base_price, description, hierarchy_level) VALUES
('Secretary', 'secretary', 25.00, 'Basic user with limited access to core features', 0),
('Doctor', 'doctor', 75.00, 'Medical professional with full clinical access', 1),
('Administrator', 'admin', 150.00, 'Full system access with management capabilities', 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert applications
INSERT INTO public.applications (name, slug, description, price_per_user, status, version) VALUES
('Transcription Quote', 'transcription_quote', 'Medical transcription quotation system with AI-powered analysis', 50.00, 'active', '1.0.0'),
('Patient Management', 'patient_management', 'Comprehensive patient records and appointment management', 30.00, 'active', '1.0.0'),
('Billing System', 'billing_system', 'Advanced billing and insurance management', 40.00, 'active', '1.0.0'),
('Reporting Dashboard', 'reporting_dashboard', 'Analytics and reporting tools for medical practices', 25.00, 'active', '1.0.0')
ON CONFLICT (slug) DO NOTHING;

-- Create a default tenant for testing (assuming tenant system exists)
-- This will be used for initial testing
INSERT INTO public.tenant_applications (tenant_id, application_id, status, max_users)
SELECT 'default', a.id, 'active', NULL
FROM public.applications a
WHERE a.slug = 'transcription_quote'
ON CONFLICT (tenant_id, application_id) DO NOTHING;