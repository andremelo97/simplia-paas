-- Migration: Create marketplace_items table for template marketplace
-- Description: Centralized marketplace of curated templates (clinical + landing pages) by specialty
-- Author: Claude
-- Date: 2026-02-17

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(30) NOT NULL CHECK (type IN ('template', 'landing_page')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  thumbnail_url TEXT,
  import_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON public.marketplace_items(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_specialty ON public.marketplace_items(specialty);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_locale ON public.marketplace_items(locale);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_active ON public.marketplace_items(active);

-- Composite index for common filtered queries
CREATE INDEX IF NOT EXISTS idx_marketplace_items_active_type_specialty
  ON public.marketplace_items(active, type, specialty);

COMMENT ON TABLE public.marketplace_items IS 'Curated marketplace of templates and landing pages by specialty';
COMMENT ON COLUMN public.marketplace_items.type IS 'Item type: template (clinical) or landing_page';
COMMENT ON COLUMN public.marketplace_items.specialty IS 'Medical specialty: general, dentistry, nutrition';
COMMENT ON COLUMN public.marketplace_items.content IS 'Template content: HTML/TipTap for templates, Puck JSON for landing pages';
COMMENT ON COLUMN public.marketplace_items.import_count IS 'Number of times this item has been imported by tenants';
