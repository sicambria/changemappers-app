-- MLP: menu personalization — per-user feature-visibility preferences.
-- Additive only: new nullable JSONB column on User; non-destructive.

ALTER TABLE "User"
  ADD COLUMN "featureVisibilityPreferences" JSONB;
