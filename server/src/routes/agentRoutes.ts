import express from 'express';
import optionalAuth from '../middleware/optionalAuth';
import { chat, execute, listTools } from '../controllers/agentController';

const router = express.Router();

router.use(optionalAuth);

router.get('/tools', listTools);
router.post('/chat', chat);
router.post('/execute', execute);

export default router;
