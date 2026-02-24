const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contact = require('../models/EmergencyContact');

router.get('/', auth, async (req, res) => {
  const contacts = await Contact.find({ userId: req.userId }).sort({ priority: -1, _id: 1 });
  res.json(contacts);
});

router.post('/', auth, async (req, res) => {
  const data = req.body;
  const c = await Contact.create({
    userId: req.userId,
    name: data.name,
    phone: data.phone,
    relation: data.relation || data.relationship,
    priority: data.priority || 0
  });
  res.status(201).json(c);
});

router.put('/', auth, async (req, res) => {
  const d = req.body;
  const updated = await Contact.findOneAndUpdate({ _id: d.id, userId: req.userId }, {
    name: d.name, phone: d.phone, relation: d.relation, priority: d.priority
  }, { new: true });
  res.json(updated);
});

router.delete('/', auth, async (req, res) => {
  const { id } = req.body;
  await Contact.deleteOne({ _id: id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
