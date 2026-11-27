-- Annual paid leave resets every calendar year (no carry-over).
--
-- Before: employee.paid_leave was a running balance that every salary decremented and that
-- never reset. After: employee.annual_leave is the yearly entitlement, and the balance for a
-- year is computed: annual_leave - SUM(salary.leave_days) of that employee's salaries in that
-- year. Nothing has to run on 31 December and back-dated salaries count in their own year.
--
-- Data migration: the entitlement is rebuilt as today's balance + every paid-leave day ever
-- used (= the "Annual Leave Days" value the user entered on the employee form, assuming it
-- was not re-edited after salaries were generated). paid_leave is kept as a deprecated alias
-- of the entitlement (same value) so older clients do not show a stale balance.
-- Additive and safe on a populated DB; re-running the UPDATE is NOT idempotent, run once.
ALTER TABLE `employee` ADD COLUMN `annual_leave` INTEGER NOT NULL DEFAULT 0;

UPDATE `employee` e
LEFT JOIN (
    SELECT `employeeId`, SUM(`leave_days`) AS `used_days`
    FROM `salary`
    GROUP BY `employeeId`
) s ON s.`employeeId` = e.`id`
SET e.`annual_leave` = e.`paid_leave` + COALESCE(s.`used_days`, 0),
    e.`paid_leave` = e.`paid_leave` + COALESCE(s.`used_days`, 0);
