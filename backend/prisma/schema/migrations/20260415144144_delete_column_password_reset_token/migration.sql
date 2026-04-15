/*
  Warnings:

  - You are about to drop the column `password_reset_expiry` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_reset_token` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `password_reset_expiry`,
    DROP COLUMN `password_reset_token`;
