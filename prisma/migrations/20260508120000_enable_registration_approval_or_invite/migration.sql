INSERT INTO "SystemKillSwitch" (
  "id",
  "activityPubEnabled",
  "lanDiscoveryEnabled",
  "externalExportsEnabled",
  "userRegistrationEnabled",
  "rssFetchingEnabled",
  "updatedAt"
)
VALUES ('singleton', false, false, false, true, false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "userRegistrationEnabled" = true,
    "updatedAt" = CURRENT_TIMESTAMP;