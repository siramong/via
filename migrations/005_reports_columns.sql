-- Migration 005: Add moderation-support columns to reports
-- Safe to run multiple times

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_lat DOUBLE PRECISION;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_lng DOUBLE PRECISION;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ocr_confidence DOUBLE PRECISION;
