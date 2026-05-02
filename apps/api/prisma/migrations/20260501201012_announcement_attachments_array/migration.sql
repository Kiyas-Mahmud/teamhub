/*
  Warnings:

  - You are about to drop the column `attachmentPublicId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `attachmentUrl` on the `Announcement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "attachmentPublicId",
DROP COLUMN "attachmentUrl",
ADD COLUMN     "attachments" JSONB NOT NULL DEFAULT '[]';
