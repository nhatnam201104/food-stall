-- AlterTable
ALTER TABLE `points_of_interest`
  ADD COLUMN `address` TEXT NULL,
  ADD COLUMN `approval_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN `review_note` TEXT NULL,
  ADD COLUMN `reviewed_by` VARCHAR(191) NULL,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL,
  ADD COLUMN `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `tours`
  ADD COLUMN `estimated_duration_minutes` INTEGER NULL,
  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `idx_poi_merchant_status_active_deleted`
  ON `points_of_interest`(`merchant_id`, `approval_status`, `is_active`, `is_deleted`);

-- CreateIndex
CREATE INDEX `idx_poi_status_active_deleted`
  ON `points_of_interest`(`approval_status`, `is_active`, `is_deleted`);

-- CreateIndex
CREATE INDEX `idx_poi_deleted_created_at`
  ON `points_of_interest`(`is_deleted`, `created_at`);

-- CreateIndex
CREATE INDEX `idx_tour_creator_status_deleted`
  ON `tours`(`created_by`, `status`, `is_deleted`);

-- CreateIndex
CREATE INDEX `idx_tour_deleted_created_at`
  ON `tours`(`is_deleted`, `created_at`);

-- CreateIndex
CREATE INDEX `idx_tour_poi_poi_id`
  ON `tour_poi`(`poi_id`);

-- AddForeignKey
ALTER TABLE `points_of_interest`
  ADD CONSTRAINT `points_of_interest_reviewed_by_fkey`
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
