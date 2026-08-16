import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { generatePackingList } from '../lib/aiClient.js';

export const getPackingList = asyncHandler(async (req, res) => {
  const { destination, days, tripType } = req.body;

  if (!destination) throw new AppError('destination is required.', 400);
  const numDays = Number(days || 3);
  if (!Number.isFinite(numDays) || numDays < 1 || numDays > 30) {
    throw new AppError('days must be a number between 1 and 30.', 400);
  }

  const result = await generatePackingList({
    destination,
    days: numDays,
    tripType: tripType || 'General'
  });

  res.json({ success: true, data: result.categories });
});

export const convertCurrency = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.query;

  if (!amount || !from || !to) {
    throw new AppError('amount, from, and to query parameters are required.', 400);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new AppError('amount must be a positive number.', 400);
  }

  if (from === to) {
    return res.json({ success: true, convertedAmount: numAmount });
  }

  try {
    const response = await fetch(`https://api.frankfurter.app/latest?amount=${numAmount}&from=${from}&to=${to}`);
    if (!response.ok) throw new Error("Conversion failed");
    const data = await response.json();
    const rateVal = data.rates[to];
    res.json({ success: true, convertedAmount: rateVal });
  } catch (err) {
    throw new AppError('Failed to fetch conversion rates from currency service.', 502);
  }
});
