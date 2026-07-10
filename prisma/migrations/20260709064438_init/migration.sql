-- CreateTable
CREATE TABLE `plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `employee_price` DOUBLE NOT NULL DEFAULT 0,
    `registration_fee` DOUBLE NOT NULL DEFAULT 0,
    `max_employees` INTEGER NOT NULL,
    `max_companies` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_feature` (
    `id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `feature_name` VARCHAR(191) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `plan_feature_plan_id_fkey`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_ACTIVATION', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING_ACTIVATION',
    `selected_at` DATETIME(3) NULL,
    `activated_at` DATETIME(3) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `subscription_plan_id_fkey`(`plan_id`),
    INDEX `subscription_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_addon` (
    `id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_addon_subscription_id_fkey`(`subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `departments` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,

    INDEX `company_owner_id_fkey`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verify_token` VARCHAR(191) NULL,
    `email_verify_expiry` DATETIME(3) NULL,
    `is_password_set` BOOLEAN NOT NULL DEFAULT false,
    `failed_login_attempts` INTEGER NOT NULL DEFAULT 0,
    `last_failed_login` DATETIME(3) NULL,
    `lockout_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_trial_user` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `joined_date` DATETIME(3) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `epf_enabled` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `ot_rate` DOUBLE NOT NULL DEFAULT 0,
    `allowance_enabled` BOOLEAN NOT NULL DEFAULT false,
    `basic_salary` DOUBLE NOT NULL DEFAULT 0,
    `deduction_enabled` BOOLEAN NOT NULL DEFAULT false,
    `employee_nic` VARCHAR(191) NULL,
    `epf_etf_amount` DOUBLE NULL,
    `epf_number` VARCHAR(191) NULL,
    `salary_type` ENUM('DAILY', 'MONTHLY') NOT NULL DEFAULT 'DAILY',
    `paid_leave` INTEGER NOT NULL DEFAULT 0,

    INDEX `employee_company_id_fkey`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_allowance` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recurring_allowance_employee_id_fkey`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_deduction` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recurring_deduction_employee_id_fkey`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary` (
    `id` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `working_days` INTEGER NOT NULL,
    `ot_hours` DOUBLE NOT NULL DEFAULT 0,
    `ot_amount` DOUBLE NOT NULL DEFAULT 0,
    `salary_advance` DOUBLE NOT NULL DEFAULT 0,
    `basic_pay` DOUBLE NOT NULL,
    `employee_epf` DOUBLE NOT NULL,
    `employer_epf` DOUBLE NOT NULL,
    `etf_amount` DOUBLE NOT NULL,
    `employee_tax_amount` DOUBLE NOT NULL DEFAULT 0,
    `employee_epf_rate` DECIMAL(5, 2) NULL,
    `employer_epf_rate` DECIMAL(5, 2) NULL,
    `etf_rate` DECIMAL(5, 2) NULL,
    `tax_config_id` VARCHAR(191) NULL,
    `net_salary` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employeeId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `allowance_total` DOUBLE NOT NULL DEFAULT 0,
    `deduction_total` DOUBLE NOT NULL DEFAULT 0,
    `basic_salary` DOUBLE NOT NULL,
    `gross_salary` DOUBLE NOT NULL,
    `salary_type` ENUM('DAILY', 'MONTHLY') NOT NULL,
    `total_deduction` DOUBLE NOT NULL,
    `loan_deduction` DOUBLE NOT NULL DEFAULT 0,
    `paid_leave` INTEGER NOT NULL DEFAULT 0,

    INDEX `salary_companyId_fkey`(`companyId`),
    INDEX `salary_employeeId_fkey`(`employeeId`),
    INDEX `salary_tax_config_id_fkey`(`tax_config_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_allowance` (
    `id` VARCHAR(191) NOT NULL,
    `salary_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_allowance_salary_id_fkey`(`salary_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_deduction` (
    `id` VARCHAR(191) NOT NULL,
    `salary_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_deduction_salary_id_fkey`(`salary_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_rates` (
    `id` VARCHAR(191) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `tax_free_monthly_limit` DECIMAL(10, 2) NOT NULL,
    `slab1_limit` DECIMAL(10, 2) NOT NULL,
    `slab1_rate` DECIMAL(5, 2) NOT NULL,
    `slab2_limit` DECIMAL(10, 2) NOT NULL,
    `slab2_rate` DECIMAL(5, 2) NOT NULL,
    `slab3_limit` DECIMAL(10, 2) NOT NULL,
    `slab3_rate` DECIMAL(5, 2) NOT NULL,
    `slab4_limit` DECIMAL(10, 2) NOT NULL,
    `slab4_rate` DECIMAL(5, 2) NOT NULL,
    `slab5_rate` DECIMAL(5, 2) NOT NULL,
    `employee_epf_rate` DECIMAL(5, 2) NOT NULL,
    `employer_epf_rate` DECIMAL(5, 2) NOT NULL,
    `etf_rate` DECIMAL(5, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_user_id_is_deleted_is_read_idx`(`user_id`, `is_deleted`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_intent` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'LKR',
    `gateway` VARCHAR(191) NOT NULL DEFAULT 'STRIPE',
    `status` ENUM('CREATED', 'REDIRECTED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELED') NOT NULL DEFAULT 'CREATED',
    `payment_order_id` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_intent_payment_order_id_key`(`payment_order_id`),
    INDEX `payment_intent_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subscription_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `billing_type` ENUM('REGISTRATION', 'MONTHLY') NOT NULL,
    `billing_month` VARCHAR(191) NOT NULL,
    `employee_count` INTEGER NOT NULL,
    `price_per_employee` DOUBLE NOT NULL,
    `registration_fee` DOUBLE NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `payment_intent_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paid_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `billing_period_end` DATETIME(3) NULL,
    `billing_period_start` DATETIME(3) NULL,
    `due_date` DATETIME(3) NULL,
    `plan_name_snapshot` VARCHAR(191) NULL,

    INDEX `invoice_payment_intent_id_fkey`(`payment_intent_id`),
    INDEX `invoice_plan_id_fkey`(`plan_id`),
    INDEX `invoice_subscription_id_fkey`(`subscription_id`),
    INDEX `invoice_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_login_session` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `ip_address` VARCHAR(191) NOT NULL,
    `user_agent` VARCHAR(191) NOT NULL,
    `device_type` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `login_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logout_at` DATETIME(3) NULL,
    `is_suspicious` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_login_session_user_id_idx`(`user_id`),
    INDEX `user_login_session_ip_address_idx`(`ip_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `login_session_id` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `http_method` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `resource_type` VARCHAR(191) NULL,
    `resource_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NOT NULL,
    `user_agent` VARCHAR(191) NULL,
    `status_code` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_user_id_idx`(`user_id`),
    INDEX `audit_log_created_at_idx`(`created_at`),
    INDEX `audit_log_login_session_id_fkey`(`login_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_bank` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `account_holder_name` VARCHAR(191) NOT NULL,
    `bank_name` VARCHAR(191) NOT NULL,
    `branch_name` VARCHAR(191) NOT NULL,
    `account_number` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `employee_bank_employee_id_key`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan` (
    `id` VARCHAR(191) NOT NULL,
    `loan_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `employee_name_snapshot` VARCHAR(191) NOT NULL,
    `loan_title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `interest_rate_type` ENUM('MONTHLY', 'ANNUALLY') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `installment_count` INTEGER NOT NULL,
    `interest_rate` DOUBLE NOT NULL,
    `monthly_premium` DOUBLE NOT NULL,
    `supporting_doc_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `loan_company_id_fkey`(`company_id`),
    INDEX `loan_employee_id_fkey`(`employee_id`),
    INDEX `loan_supporting_doc_id_fkey`(`supporting_doc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_installment` (
    `id` VARCHAR(191) NOT NULL,
    `loan_id` VARCHAR(191) NOT NULL,
    `installment_number` INTEGER NOT NULL,
    `due_date` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paid_amount` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PAID', 'PARTIAL', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `salary_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `loan_installment_loan_id_fkey`(`loan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_document` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NULL,
    `public_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `document_type` ENUM('EMPLOYEE', 'LOAN') NOT NULL DEFAULT 'EMPLOYEE',
    `doc_title` VARCHAR(191) NULL,

    INDEX `employee_document_employee_id_fkey`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_document` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reference_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_document_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plan_feature` ADD CONSTRAINT `plan_feature_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_addon` ADD CONSTRAINT `subscription_addon_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company` ADD CONSTRAINT `company_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_allowance` ADD CONSTRAINT `recurring_allowance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_deduction` ADD CONSTRAINT `recurring_deduction_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary` ADD CONSTRAINT `salary_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary` ADD CONSTRAINT `salary_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary` ADD CONSTRAINT `salary_tax_config_id_fkey` FOREIGN KEY (`tax_config_id`) REFERENCES `payroll_rates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_allowance` ADD CONSTRAINT `salary_allowance_salary_id_fkey` FOREIGN KEY (`salary_id`) REFERENCES `salary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_deduction` ADD CONSTRAINT `salary_deduction_salary_id_fkey` FOREIGN KEY (`salary_id`) REFERENCES `salary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_intent` ADD CONSTRAINT `payment_intent_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_payment_intent_id_fkey` FOREIGN KEY (`payment_intent_id`) REFERENCES `payment_intent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_login_session` ADD CONSTRAINT `user_login_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_login_session_id_fkey` FOREIGN KEY (`login_session_id`) REFERENCES `user_login_session`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_bank` ADD CONSTRAINT `employee_bank_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan` ADD CONSTRAINT `loan_supporting_doc_id_fkey` FOREIGN KEY (`supporting_doc_id`) REFERENCES `employee_document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_installment` ADD CONSTRAINT `loan_installment_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_document` ADD CONSTRAINT `employee_document_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_document` ADD CONSTRAINT `user_document_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
