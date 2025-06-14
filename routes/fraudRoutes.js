// CallID	WindowEnd	Country	CallerNumber	ReceiverNumber	CallDuration	CallType	FraudType
// routes/fraudRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/add-call', (req, res) => {
  const {
    CallID, WindowEnd, Country,
    CallerNumber, ReceiverNumber,
    CallDuration, CallType, FraudType
  } = req.body;

  const rawWindowEnd = req.body.WindowEnd; // e.g., '2025-02-03T03:55:05Z'
  const formattedWindowEnd = new Date(rawWindowEnd)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' '); // e.g., '2025-02-03 03:55:05'

  const query = `
    INSERT INTO fraud_calls 
    (CallID, WindowEnd, Country, CallerNumber, ReceiverNumber, CallDuration, CallType, FraudType) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [
    CallID, formattedWindowEnd, Country,
    CallerNumber, ReceiverNumber,
    CallDuration, CallType, FraudType
  ], (err, result) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).send('Failed to insert call record');
    }
    res.status(201).send({ message: 'Call record inserted'});
  });
});


// routes/fraudRoutes.js
router.get('/calls', (req, res) => {
  const query = 'SELECT * FROM fraud_calls';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching calls:', err);
      return res.status(500).send('Failed to fetch call records');
    }
    
    results.forEach(call => {
    call.WindowEnd = new Date(call.WindowEnd).toISOString();
    });
    res.status(200).json(results);
  });
});

module.exports = router;
