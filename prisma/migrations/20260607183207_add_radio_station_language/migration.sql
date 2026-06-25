ALTER TABLE "RadioStation" ADD COLUMN IF NOT EXISTS "language" TEXT;

ALTER TABLE "RadioStation" OWNER TO changemappers_app;
