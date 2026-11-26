-- Money columns: Float/DOUBLE -> DECIMAL(19,4). otHours -> DECIMAL(9,2), interestRate -> DECIMAL(9,4).
-- Values are rounded to the new scale. Take a DB backup before running in production.
-- AlterTable
ALTER TABLE `plan` MODIFY `price` DECIMAL(19, 4) NOT NULL,
    MODIFY `employee_price` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `registration_fee` DECIMAL(19, 4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `employee` MODIFY `ot_rate` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `basic_salary` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `epf_etf_amount` DECIMAL(19, 4) NULL;

-- AlterTable
ALTER TABLE `recurring_allowance` MODIFY `amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `recurring_deduction` MODIFY `amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `salary` MODIFY `ot_hours` DECIMAL(9, 2) NOT NULL DEFAULT 0,
    MODIFY `ot_amount` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `salary_advance` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `basic_pay` DECIMAL(19, 4) NOT NULL,
    MODIFY `employee_epf` DECIMAL(19, 4) NOT NULL,
    MODIFY `employer_epf` DECIMAL(19, 4) NOT NULL,
    MODIFY `etf_amount` DECIMAL(19, 4) NOT NULL,
    MODIFY `employee_tax_amount` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `net_salary` DECIMAL(19, 4) NOT NULL,
    MODIFY `allowance_total` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `deduction_total` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    MODIFY `basic_salary` DECIMAL(19, 4) NOT NULL,
    MODIFY `gross_salary` DECIMAL(19, 4) NOT NULL,
    MODIFY `total_deduction` DECIMAL(19, 4) NOT NULL,
    MODIFY `loan_deduction` DECIMAL(19, 4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `salary_allowance` MODIFY `amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `salary_deduction` MODIFY `amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `payment_intent` MODIFY `amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `invoice` MODIFY `price_per_employee` DECIMAL(19, 4) NOT NULL,
    MODIFY `registration_fee` DECIMAL(19, 4) NOT NULL,
    MODIFY `total_amount` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `loan` MODIFY `amount` DECIMAL(19, 4) NOT NULL,
    MODIFY `interest_rate` DECIMAL(9, 4) NOT NULL,
    MODIFY `monthly_premium` DECIMAL(19, 4) NOT NULL;

-- AlterTable
ALTER TABLE `loan_installment` MODIFY `amount` DECIMAL(19, 4) NOT NULL,
    MODIFY `paid_amount` DECIMAL(19, 4) NOT NULL DEFAULT 0;

