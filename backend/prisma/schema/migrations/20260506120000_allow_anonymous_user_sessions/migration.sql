-- Allow anonymous tourist sessions to be tracked without a user account.
ALTER TABLE `user_sessions` DROP FOREIGN KEY `user_sessions_user_id_fkey`;
ALTER TABLE `user_sessions` MODIFY `user_id` VARCHAR(191) NULL;
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
