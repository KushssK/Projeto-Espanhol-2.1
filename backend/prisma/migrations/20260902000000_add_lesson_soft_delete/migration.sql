-- AlterTable: Add soft delete support to Lesson
ALTER TABLE "Lesson" ADD COLUMN "deletedAt" TIMESTAMP(3);
