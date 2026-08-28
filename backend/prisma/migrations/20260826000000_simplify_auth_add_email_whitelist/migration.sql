-- DropEnum
DROP TYPE "VerificationPurpose";

-- DropForeignKey
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_userId_fkey";

-- DropTable
DROP TABLE "VerificationCode";

-- DropTable
DROP TABLE "Whitelist_CPF";

-- DropIndex
DROP INDEX "User_cpfHash_key";

-- AlterTable: Remove cpfHash and isVerified from User
ALTER TABLE "User" DROP COLUMN "cpfHash";
ALTER TABLE "User" DROP COLUMN "isVerified";

-- AlterTable: Add published to Lesson
ALTER TABLE "Lesson" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: WhitelistEmail
CREATE TABLE "WhitelistEmail" (
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "WhitelistEmail_pkey" PRIMARY KEY ("email")
);
