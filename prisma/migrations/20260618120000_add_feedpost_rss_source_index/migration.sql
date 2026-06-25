-- 2026-06-18 audit C8: index FeedPost.rssSourceId.
-- rssSourceId is a foreign key to RssSource but was unindexed, forcing a
-- sequential scan on the hottest table whenever posts are queried/joined by
-- their RSS source. Additive (CREATE INDEX only); non-destructive.

CREATE INDEX "FeedPost_rssSourceId_idx" ON "FeedPost"("rssSourceId");
