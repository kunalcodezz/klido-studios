-- ============================================================================
-- Klido Studio — Migration 0005: Default Site Settings & Design Tokens
-- ============================================================================

INSERT INTO public.site_settings (setting_key, setting_value, is_public, description)
VALUES
  (
    'design_system',
    '{
      "colors": {
        "primary": "#123FFF",
        "primaryHover": "#0D31CC",
        "secondary": "#0D1126",
        "accent": "#C2F81A",
        "text": "#0D1126",
        "mutedText": "#4A5268",
        "background": "#FFFFFF",
        "surface": "#F7F9FE",
        "border": "#E5E9F2"
      },
      "typography": {
        "headingFont": "Plus Jakarta Sans",
        "bodyFont": "DM Sans",
        "monoFont": "JetBrains Mono",
        "baseSizePx": 16,
        "headingWeight": 700,
        "bodyWeight": 400,
        "headingLineHeight": 1.1,
        "bodyLineHeight": 1.6
      },
      "buttons": {
        "radiusPx": 8,
        "paddingX": 24,
        "paddingY": 12
      },
      "layout": {
        "containerMaxWidthPx": 1200,
        "sectionSpacingPx": 80,
        "gridGapPx": 24,
        "globalRadiusPx": 16
      }
    }'::jsonb,
    true,
    'Klido global design tokens synced with klido-website brand palette and typography'
  ),
  (
    'seo_global',
    '{
      "siteName": "Klido",
      "siteUrl": "https://www.klido.in",
      "defaultTitle": "Klido — Digital Growth & E-Commerce Operations Studio",
      "defaultMetaDescription": "Klido is an independent digital marketing studio building measurable paid acquisition, technical SEO, conversion architecture, and clean attribution systems.",
      "defaultOgImage": "https://www.klido.in/klido_Logo.png",
      "faviconUrl": "/favicon-48x48.png",
      "robotsTxt": "User-agent: *\nAllow: /\nSitemap: https://www.klido.in/sitemap.xml"
    }'::jsonb,
    true,
    'Global SEO defaults and robots.txt configuration for klido.in'
  ),
  (
    'footer_config',
    '{
      "description": "Independent digital marketing studio turning strong offers into clear positioning, considered campaigns, and practical systems for growth.",
      "email": "klidoagency@gmail.com",
      "phone": "+91 9172569021",
      "instagramHandle": "@klidoagency",
      "instagramUrl": "https://www.instagram.com/klidoagency",
      "hours": "Mon–Fri, 09:00–18:00",
      "location": "Remote Worldwide",
      "copyrightText": "Klido. All rights reserved.",
      "tagline": "Client-owned accounts · Transparent weekly reporting"
    }'::jsonb,
    true,
    'Global contact, social, and footer settings'
  )
ON CONFLICT (setting_key) DO NOTHING;
