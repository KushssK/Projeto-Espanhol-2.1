-- Migration: simplify auth, add email whitelist
-- Fixed order: drop dependent objects BEFORE dropping types

-- 1. Drop foreign key from VerificationCode (depends on User)
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_userId_fkey";

-- 2. Drop VerificationCode table FIRST (its "purpose" column references VerificationPurpose)
DROP TABLE "VerificationCode";

-- 3. NOW safe to drop the enum type (no more columns reference it)
DROP TYPE "VerificationPurpose";

-- 4. Drop Whitelist_CPF (no dependencies on it)
DROP TABLE "Whitelist_CPF";

-- 5. Remove cpfHash from User (drop unique index first)
DROP INDEX "User_cpfHash_key";
ALTER TABLE "User" DROP COLUMN "cpfHash";

-- 6. Remove isVerified from User
ALTER TABLE "User" DROP COLUMN "isVerified";

-- 7. Add published to Lesson
ALTER TABLE "Lesson" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

-- 8. Create WhitelistEmail table
CREATE TABLE "WhitelistEmail" (
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "WhitelistEmail_pkey" PRIMARY KEY ("email")
);
