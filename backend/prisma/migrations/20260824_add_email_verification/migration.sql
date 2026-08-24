-- AlterSchema: [Add email verification fields to User]
ALTER TABLE `User` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` ADD COLUMN `verificationCode` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `verificationExpires` DATETIME NULL;
