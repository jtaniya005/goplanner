import Task from '../models/Task.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getTasks = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new AppError('date query parameter (YYYY-MM-DD) is required.', 400);

  // Match boundary of the given date in local server timezone or exact UTC
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const tasks = await Task.find({
    user: req.user.id,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ start: 1 });

  res.json({ success: true, data: tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const { date, start, end, title, category, location, notes } = req.body;

  if (!date || !start || !end || !title) {
    throw new AppError('date, start time, end time, and title are required.', 400);
  }

  const dateObj = new Date(date);
  dateObj.setUTCHours(0, 0, 0, 0);

  const task = new Task({
    user: req.user.id,
    date: dateObj,
    start,
    end,
    title,
    category: category || 'other',
    location: location || '',
    notes: notes || '',
    completed: false
  });

  await task.save();
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
  if (!task) throw new AppError('Task not found.', 404);

  const allowed = ['start', 'end', 'title', 'category', 'location', 'notes', 'completed'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });

  if (req.body.date) {
    const dObj = new Date(req.body.date);
    dObj.setUTCHours(0, 0, 0, 0);
    task.date = dObj;
  }

  await task.save();
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task) throw new AppError('Task not found.', 404);

  res.json({ success: true, data: { id: req.params.id } });
});
