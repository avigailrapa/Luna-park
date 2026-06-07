const express = require('express');
const optionalAuth = require('../middleware/optionalAuth');
const { chat, execute, listTools } = require('../controllers/agentController');

const router = express.Router();

router.use(optionalAuth);

router.get('/tools', listTools);
router.post('/chat', chat);
router.post('/execute', execute);

module.exports = router;
