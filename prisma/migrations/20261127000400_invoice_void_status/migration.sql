-- Invoices can be VOID: an unpaid REGISTRATION invoice of a subscription that was superseded
-- (plan change, trial conversion, re-subscribe) is voided when the new plan activates. A VOID
-- invoice is never payable, never OVERDUE, never arrears and never revenue.
-- Additive (existing values and the default are kept) and safe on a populated DB.
ALTER TABLE `invoice`
    MODIFY `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'FAILED', 'VOID') NOT NULL DEFAULT 'PENDING';
