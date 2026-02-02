const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', (req, res) => {
  const { workspace_id, user_id } = req.body;

  if (!workspace_id || !user_id) {
    return res.status(400).json({ error: 'workspace_id and user_id required' });
  }

  const token = jwt.sign(
    { workspace_id, user_id },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;
