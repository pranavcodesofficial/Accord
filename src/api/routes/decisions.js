const express = require('express');
const authenticateToken = require('../middleware/auth');
const validateDecision = require('../middleware/validateDecision');
const queries = require('../../db/queries');
const router = express.Router();

router.use(authenticateToken);

router.post('/', validateDecision, async (req, res) => {
  try {
    const { decision_text, rationale, source_platform, source_link } = req.body;
    const { workspace_id, user_id } = req.user;

    const decision = await queries.createDecision({
      workspace_id,
      user_id,
      decision_text,
      rationale,
      source_platform,
      source_link
    });

    await queries.logAudit(decision.id, 'create', user_id);

    res.status(201).json(decision);
  } catch (error) {
    console.error('Create decision error:', error);
    res.status(500).json({ error: 'Failed to create decision' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { workspace_id } = req.user;
    const { search, is_superseded, created_after, created_before, limit, offset } = req.query;

    const result = await queries.listDecisions({
      workspace_id,
      user_id: req.query.user_id,
      search,
      is_superseded: is_superseded === 'true',
      created_after,
      created_before,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json(result);
  } catch (error) {
    console.error('List decisions error:', error);
    res.status(500).json({ error: 'Failed to list decisions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { workspace_id } = req.user;
    const decision = await queries.getDecisionById(req.params.id, workspace_id);

    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    res.json(decision);
  } catch (error) {
    console.error('Get decision error:', error);
    res.status(500).json({ error: 'Failed to get decision' });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const { workspace_id } = req.user;
    const history = await queries.getDecisionHistory(req.params.id, workspace_id);

    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

router.post('/:id/supersede', validateDecision, async (req, res) => {
  try {
    const { workspace_id, user_id } = req.user;
    const { decision_text, rationale, source_platform, source_link } = req.body;

    const original = await queries.getDecisionById(req.params.id, workspace_id);
    if (!original) {
      return res.status(404).json({ error: 'Original decision not found' });
    }

    const newDecision = await queries.createDecision({
      workspace_id,
      user_id,
      decision_text,
      rationale,
      source_platform,
      source_link,
      supersedes_decision_id: req.params.id
    });

    await queries.markDecisionSuperseded(req.params.id, workspace_id);
    await queries.logAudit(newDecision.id, 'supersede', user_id, { supersedes: req.params.id });

    res.status(201).json(newDecision);
  } catch (error) {
    console.error('Supersede error:', error);
    res.status(500).json({ error: 'Failed to supersede decision' });
  }
});

module.exports = router;
