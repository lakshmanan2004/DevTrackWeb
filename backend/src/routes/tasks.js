const express = require('express');
const { Task } = require('../models');
const { authRequired, attachUser, ah } = require('../middleware/auth');
const { taskDto } = require('../util/dto');
const { scopeFor } = require('../util/scope');
const { emitToUser, emitToRoles } = require('../sockets');

const router = express.Router();
router.use(authRequired, attachUser);

// GET /api/tasks — developer: assigned to me; leader/manager: created by me (+team)
router.get('/', ah(async (req, res) => {
  let query;
  if (req.user.role === 'developer') {
    query = { assignee: req.user._id };
  } else if (req.user.role === 'leader' || req.user.role === 'manager') {
    const scope = await scopeFor(req.user);
    query = {
      $or: [
        { assignedBy: req.user._id },
        { assignee: { $in: scope.developerIds } }
      ]
    };
  } else {
    query = {};
  }
  const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ tasks: tasks.map(taskDto) });
}));

// POST /api/tasks — leader/manager assigns a task
router.post('/', ah(async (req, res) => {
  const { assigneeId, title, note, priority, dueDate } = req.body || {};
  if (!assigneeId || !title || !title.trim()) {
    return res.status(400).json({ error: 'Developer and task title are required' });
  }
  const role = req.user.role === 'manager' ? 'PM' : 'TL';
  const task = await Task.create({
    title: title.trim(),
    note: note || 'Task assigned manually by lead.',
    priority: priority || 'medium',
    dueDate: dueDate || 'Today 5:00 PM',
    assignee: assigneeId,
    assignedBy: req.user._id,
    assignedByRole: role,
    assignedByName: req.user.name,
    status: 'pending',
    type: 'manual_assignment'
  });

  const dto = taskDto(task);
  emitToUser(String(assigneeId), 'task:new', dto);
  emitToRoles(['leader', 'manager', 'admin'], 'task:new', dto);
  res.status(201).json({ task: dto });
}));

// PATCH /api/tasks/:id — status updates (developer marks done, etc.)
router.patch('/:id', ah(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isAssignee = String(task.assignee) === String(req.user._id);
  const isAssigner = String(task.assignedBy) === String(req.user._id);
  if (!isAssignee && !isAssigner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not allowed to update this task' });
  }

  const oldStatus = task.status;
  if (req.body.status && ['pending', 'in_progress', 'completed'].includes(req.body.status)) {
    task.status = req.body.status;
  }
  await task.save();

  // When developer marks task as completed, notify the Team Lead / PM who assigned it
  if (oldStatus !== 'completed' && task.status === 'completed') {
    const { Alert, WorkLog } = require('../models');
    await Alert.create({
      audience: task.assignedByRole === 'PM' ? 'manager' : 'leader',
      user: task.assignedBy,
      developerId: req.user._id,
      kind: 'approval',
      severity: 'info',
      category: 'Task Completed',
      who: req.user.name,
      title: `Task Completed by ${req.user.name}`,
      body: `${req.user.name} marked task "${task.title}" as COMPLETED`,
      meta: `Assigned by ${task.assignedByName || 'Lead'}`
    });

    if (task.linkedLog) {
      await WorkLog.findByIdAndUpdate(task.linkedLog, {
        review: 'pending',
        reviewNote: `Developer ${req.user.name} completed targeted feedback fixes.`
      });
    }

    emitToUser(String(task.assignedBy), 'alert:new', { category: 'Task Completed', who: req.user.name });
    emitToRoles(['leader', 'manager', 'admin'], 'alert:new', { category: 'Task Completed', who: req.user.name });
  }

  const dto = taskDto(task);
  emitToUser(String(task.assignee), 'task:update', dto);
  emitToUser(String(task.assignedBy), 'task:update', dto);
  emitToRoles(['leader', 'manager', 'admin'], 'task:update', dto);
  res.json({ task: dto });
}));

module.exports = router;
