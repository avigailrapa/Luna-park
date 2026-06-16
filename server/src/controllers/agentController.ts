import { NextFunction, Request, Response } from 'express';
import { handleChat, handleExecute, getToolsForRole } from '../agent/agentService';

function sanitizeHistory(raw: unknown): { role: 'user' | 'agent'; text: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is { role: unknown; text: unknown } => !!item && typeof item === 'object')
    .map((item) => ({
      role: item.role === 'user' ? ('user' as const) : ('agent' as const),
      text: String(item.text ?? '').trim(),
    }))
    .filter((item) => item.text.length > 0);
}

export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, history } = req.body;
    if (!message || !String(message).trim()) {
      res.status(400).json({ message: 'יש לשלוח הודעה' });
      return;
    }

    const response = await handleChat(
      String(message).trim(),
      req.user || null,
      sanitizeHistory(history),
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function execute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tool, params } = req.body;
    if (!tool) {
      res.status(400).json({ message: 'יש לציין tool' });
      return;
    }

    const response = await handleExecute(tool, params || {}, req.user || null);
    res.status(response.status || 200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listTools(req: Request, res: Response): Promise<void> {
  const tools = getToolsForRole(req.user || null);
  res.json({ tools });
}
