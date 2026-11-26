-- Catch-up migration: columns/relations that were added to schema.prisma (and to the shared DB by the
-- main backend) without a migration in this repo. Already present in DBs managed by Payroll-backEnd.
-- AlterTable
ALTER TABLE `employee_document` ADD COLUMN `loan_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `loan` ADD COLUMN `remaining_installments` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `salary` ADD COLUMN `leave_days` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `sick_leave_days` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX `employee_document_loan_id_fkey` ON `employee_document`(`loan_id`);

-- AddForeignKey
ALTER TABLE `employee_document` ADD CONSTRAINT `employee_document_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

