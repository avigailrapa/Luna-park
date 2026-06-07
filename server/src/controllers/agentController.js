const { handleChat, handleExecute, getToolsForRole } = require('../agent/agentService');

async function chat(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'יש לשלוח הודעה' });
    }

    const response = await handleChat(String(message).trim(), req.user || null);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function execute(req, res, next) {
  try {
    const { tool, params } = req.body;
    if (!tool) {
      return res.status(400).json({ message: 'יש לציין tool' });
    }

    const response = await handleExecute(tool, params || {}, req.user || null);
    res.status(response.status || 200).json(response);
  } catch (err) {
    next(err);
  }
}

async function listTools(req, res) {
  const tools = getToolsForRole(req.user || null);
  res.json({ tools });
}

module.exports = { chat, execute, listTools };
