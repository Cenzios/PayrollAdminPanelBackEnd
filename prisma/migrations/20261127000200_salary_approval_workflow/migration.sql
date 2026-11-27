-- Salaries are created as DRAFT, can be edited / regenerated / voided (deleted) while DRAFT,
-- and are locked by approval. Existing rows were final when created, so they become APPROVED
-- (approved_at = created_at, approver unknown). Additive and safe on a populated DB.
ALTER TABLE `salary`
    ADD COLUMN `status` ENUM('DRAFT', 'APPROVED') NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN `company_working_days` INTEGER NULL,
    ADD COLUMN `is_epf_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `is_loan_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `approved_at` DATETIME(3) NULL,
    ADD COLUMN `approved_by_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_by_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL;

UPDATE `salary` SET `approved_at` = `created_at`, `updated_at` = `created_at`;

-- New rows default to DRAFT; updated_at is maintained by Prisma (@updatedAt)
ALTER TABLE `salary`
    MODIFY `status` ENUM('DRAFT', 'APPROVED') NOT NULL DEFAULT 'DRAFT',
    MODIFY `updated_at` DATETIME(3) NOT NULL;

CREATE INDEX `salary_company_period_status_idx` ON `salary`(`companyId`, `year`, `month`, `status`);

ALTER TABLE `salary` ADD CONSTRAINT `salary_approved_by_id_fkey`
    FOREIGN KEY (`approved_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `salary` ADD CONSTRAINT `salary_updated_by_id_fkey`
    FOREIGN KEY (`updated_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- A DRAFT salary RESERVES its loan instalment (salary_id set) instead of marking it PAID
ALTER TABLE `loan_installment`
    MODIFY `status` ENUM('PENDING', 'PAID', 'PARTIAL', 'SKIPPED', 'RESERVED') NOT NULL DEFAULT 'PENDING';
CREATE INDEX `loan_installment_salary_id_idx` ON `loan_installment`(`salary_id`);
