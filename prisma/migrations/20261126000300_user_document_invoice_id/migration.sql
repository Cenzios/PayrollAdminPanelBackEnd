-- Link a manual-payment slip to the invoice it pays. Additive and nullable.
ALTER TABLE `user_document` ADD COLUMN `invoice_id` VARCHAR(191) NULL;
CREATE INDEX `user_document_invoice_id_idx` ON `user_document`(`invoice_id`);
