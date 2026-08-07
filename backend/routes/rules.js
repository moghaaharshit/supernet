const express = require('express');
const router = express.Router();
const { db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } = require('../firebase');

// Get all rules
router.get('/', async (req, res) => {
  try {
    const rulesCol = collection(db, 'rules');
    const snapshot = await getDocs(rulesCol);
    const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new rule
router.post('/', async (req, res) => {
  try {
    const newRule = req.body;
    const rulesCol = collection(db, 'rules');
    const docRef = await addDoc(rulesCol, newRule);
    res.json({ id: docRef.id, ...newRule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRule = req.body;
    const ruleRef = doc(db, 'rules', id);
    await updateDoc(ruleRef, updatedRule);
    res.json({ id, ...updatedRule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ruleRef = doc(db, 'rules', id);
    await deleteDoc(ruleRef);
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
