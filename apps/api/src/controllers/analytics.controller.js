import * as analyticsService from '../services/analytics.service.js';

export async function getAnalytics(req, res) {
  const analytics = await analyticsService.getAnalytics(req.params.workspaceId);
  res.json(analytics);
}

export async function exportAnalyticsCsv(req, res) {
  const csv = await analyticsService.exportAnalyticsCsv(req.params.workspaceId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="workspace-${req.params.workspaceId}-analytics.csv"`);
  res.send(csv);
}
