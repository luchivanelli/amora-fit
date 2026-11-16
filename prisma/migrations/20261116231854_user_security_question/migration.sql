-- AlterTable
ALTER TABLE "User" ADD COLUMN     "securityAnswerHash" TEXT,
ADD COLUMN     "securityFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "securityLockedUntil" TIMESTAMP(3),
ADD COLUMN     "securityQuestion" TEXT;
