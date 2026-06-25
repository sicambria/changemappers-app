-- M-28: Add missing composite indexes for Notification and FeedPost
-- Notification: composite index for the common "fetch unread notifications for user, ordered by date" query
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- FeedPost: composite index for soft-delete-aware feed queries ordered by date
CREATE INDEX IF NOT EXISTS "FeedPost_deletedAt_createdAt_idx" ON "FeedPost"("deletedAt", "createdAt" DESC);
