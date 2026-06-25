CREATE TABLE IF NOT EXISTS "RadioStation" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    genre TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RadioStation_isActive_isDefault_idx" ON "RadioStation"("isActive", "isDefault");

CREATE TABLE IF NOT EXISTS "Quote" (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    source TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Quote_isActive_idx" ON "Quote"("isActive");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bottomBarSettings" JSONB;

ALTER TABLE "RadioStation" OWNER TO changemappers_app;
ALTER TABLE "Quote" OWNER TO changemappers_app;
