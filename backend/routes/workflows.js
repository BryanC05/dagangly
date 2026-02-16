const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Workflow = require('../models/Workflow');

// Get seller's workflows
router.get('/', auth, async (req, res) => {
  try {
    const workflows = await Workflow.find({ seller: req.user.id });
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new workflow
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, webhookUrl, config } = req.body;

    const workflow = new Workflow({
      seller: req.user.id,
      name,
      type,
      webhookUrl,
      config,
      isActive: true,
    });

    await workflow.save();
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle workflow status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findOne({
      _id: req.params.id,
      seller: req.user.id,
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
router.delete('/:id', auth, async (req, res) => {
  try {
    await Workflow.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id,
    });

    res.json({ message: 'Workflow deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
