-- AUDIT-20260613-029: Message unread-count hot query had no covering index on receiverId.
-- getUnreadMessageCountAction() runs `count({ where: { receiverId, isRead: false } })`
-- on every authenticated render; receiverId was not the leading column of any existing
-- index (only [createdAt] and [senderId, receiverId]), so the count degraded to a scan.
-- This composite index covers both equality predicates with receiverId leading.

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");
