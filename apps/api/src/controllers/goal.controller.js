import * as goalService from '../services/goal.service.js';

export async function listGoals(req, res) {
  const items = await goalService.listGoals(req.params.workspaceId);
  res.json({ items, nextCursor: null });
}

export async function createGoal(req, res) {
  const goal = await goalService.createGoal({
    workspaceId: req.params.workspaceId,
    userId: req.userId,
    role: req.role,
    input: req.body,
  });

  res.status(201).json(goal);
}

export async function getGoal(req, res) {
  const goal = await goalService.getGoal({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
  });

  res.json(goal);
}

export async function updateGoal(req, res) {
  const goal = await goalService.updateGoal({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    userId: req.userId,
    role: req.role,
    patch: req.body,
  });

  res.json(goal);
}

export async function deleteGoal(req, res) {
  await goalService.deleteGoal({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    userId: req.userId,
    role: req.role,
  });

  res.status(204).send();
}

export async function createMilestone(req, res) {
  const goal = await goalService.createMilestone({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    userId: req.userId,
    role: req.role,
    input: req.body,
  });

  res.status(201).json(goal);
}

export async function updateMilestone(req, res) {
  const goal = await goalService.updateMilestone({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    milestoneId: req.params.milestoneId,
    userId: req.userId,
    role: req.role,
    patch: req.body,
  });

  res.json(goal);
}

export async function deleteMilestone(req, res) {
  await goalService.deleteMilestone({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    milestoneId: req.params.milestoneId,
    userId: req.userId,
    role: req.role,
  });

  res.status(204).send();
}

export async function createGoalUpdate(req, res) {
  const update = await goalService.createGoalUpdate({
    workspaceId: req.params.workspaceId,
    goalId: req.params.goalId,
    authorId: req.userId,
    content: req.body.content,
  });

  res.status(201).json(update);
}
