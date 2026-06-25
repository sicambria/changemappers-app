-- Add a per-user token invalidation timestamp for logout and account-wide session revocation.
ALTER TABLE "User" ADD COLUMN "tokenInvalidatedAt" TIMESTAMP(3);
