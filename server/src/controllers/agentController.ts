import { NextFunction, Request, Response } from 'express';
import { handleChat, handleExecute, getToolsForRole } from '../agent/agentService';

export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      res.status(400).json({ message: 'יש לשלוח הודעה' });
      return;
    }

    const response = await handleChat(String(message).trim(), req.user || null);
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
