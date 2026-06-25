ALTER TABLE "SystemKillSwitch" ALTER COLUMN "activityPubEnabled" SET DEFAULT false;
ALTER TABLE "SystemKillSwitch" ALTER COLUMN "lanDiscoveryEnabled" SET DEFAULT false;
ALTER TABLE "SystemKillSwitch" ALTER COLUMN "externalExportsEnabled" SET DEFAULT false;
ALTER TABLE "SystemKillSwitch" ALTER COLUMN "userRegistrationEnabled" SET DEFAULT false;
ALTER TABLE "SystemKillSwitch" ALTER COLUMN "rssFetchingEnabled" SET DEFAULT false;

UPDATE "SystemKillSwitch"
SET
  "activityPubEnabled" = false,
  "lanDiscoveryEnabled" = false,
  "externalExportsEnabled" = false,
  "rssFetchingEnabled" = false
WHERE "id" = 'singleton';
