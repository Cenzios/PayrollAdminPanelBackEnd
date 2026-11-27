-- Loans can be edited, settled early or cancelled, with a change history.
-- Additive and safe on a populated DB.

-- Loan lifecycle status (was derived from the instalments). Loans whose instalments are all
-- PAID become COMPLETED; every other loan stays ACTIVE.
ALTER TABLE `loan`
    ADD COLUMN `status` ENUM('ACTIVE', 'COMPLETED', 'SETTLED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `settled_amount` DECIMAL(19, 4) NULL,
    ADD COLUMN `settled_at` DATETIME(3) NULL,
    ADD COLUMN `settlement_method` ENUM('CASH', 'BANK_TRANSFER') NULL,
    ADD COLUMN `settlement_note` VARCHAR(500) NULL;

UPDATE `loan` l
SET l.`status` = 'COMPLETED'
WHERE EXISTS (SELECT 1 FROM `loan_installment` i WHERE i.`loan_id` = l.`id`)
  AND NOT EXISTS (SELECT 1 FROM `loan_installment` i WHERE i.`loan_id` = l.`id` AND i.`status` <> 'PAID');

-- Instalments closed by an early settlement or a cancellation are never deducted
ALTER TABLE `loan_installment`
    MODIFY `status` ENUM('PENDING', 'PAID', 'PARTIAL', 'SKIPPED', 'RESERVED', 'SETTLED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

CREATE TABLE `loan_change_log` (
    `id` VARCHAR(191) NOT NULL,
    `loan_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `changed_by_id` VARCHAR(191) NOT NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` ENUM('CREATE', 'EDIT', 'SETTLE', 'CANCEL') NOT NULL,
    `field` VARCHAR(64) NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `reason` TEXT NULL,

    INDEX `loan_change_log_loan_id_changed_at_idx`(`loan_id`, `changed_at`),
    INDEX `loan_change_log_company_id_fkey`(`company_id`),
    INDEX `loan_change_log_changed_by_id_fkey`(`changed_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `loan_change_log` ADD CONSTRAINT `loan_change_log_loan_id_fkey`
    FOREIGN KEY (`loan_id`) REFERENCES `loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `loan_change_log` ADD CONSTRAINT `loan_change_log_company_id_fkey`
    FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `loan_change_log` ADD CONSTRAINT `loan_change_log_changed_by_id_fkey`
    FOREIGN KEY (`changed_by_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
