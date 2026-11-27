-- One salary per employee per month. Prevents duplicate payslips from concurrent requests.
-- Fails if duplicates already exist; check first with:
--   SELECT employeeId, month, year, COUNT(*) FROM salary GROUP BY employeeId, month, year HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX `salary_employee_month_year_key` ON `salary`(`employeeId`, `month`, `year`);
