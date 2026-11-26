import { Request, Response, NextFunction } from 'express';
import { BillingType, InvoiceStatus } from '@prisma/client';
import adminRevenueService from '../services/adminRevenue.service';

export const getRevenueSummary = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminRevenueService.getRevenueSummary();

    res.status(200).json({
      success: true,
      message: 'Revenue summary fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, billingType, month, search } = req.query;

    const result = await adminRevenueService.getAllInvoices(page, limit, {
      status: status as InvoiceStatus | undefined,
      billingType: billingType as BillingType | undefined,
      month: month as string | undefined,
      search: search as string | undefined
    });

    res.status(200).json({
      success: true,
      message: 'Invoices fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const sendReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const result = await adminRevenueService.sendReminder(invoiceId);

    res.status(200).json({
      success: true,
      message: 'Reminder email sent successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
