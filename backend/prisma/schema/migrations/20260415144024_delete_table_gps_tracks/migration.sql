/*
  Warnings:

  - You are about to drop the column `app_version` on the `user_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `offline_mode` on the `user_sessions` table. All the data in the column will be lost.
  - You are about to drop the `gps_tracks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `password_reset_otps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `gps_tracks` DROP FOREIGN KEY `gps_tracks_session_id_fkey`;

-- DropForeignKey
ALTER TABLE `password_reset_otps` DROP FOREIGN KEY `password_reset_otps_user_id_fkey`;

-- AlterTable
ALTER TABLE `user_sessions` DROP COLUMN `app_version`,
    DROP COLUMN `offline_mode`;

-- DropTable
DROP TABLE `gps_tracks`;

-- DropTable
DROP TABLE `password_reset_otps`;
