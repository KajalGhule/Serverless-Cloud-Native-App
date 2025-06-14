const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.get('/api/calls', (req, res) => {
  db.query('SELECT * FROM fraud_calls ORDER BY CallID DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json(results);
  });
});

// 📤 Broadcast updates to frontend
function insertCallsFromCSVAndEmit() {
  const rows = [];

  fs.createReadStream('calls.csv')
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (row) => {
      rows.push(row); // Collect all rows
    })
    .on('end', () => {
      console.log(`Total rows to insert: ${rows.length}`);
      let index = 0;

      const interval = setInterval(() => {
        if (index >= rows.length) {
          clearInterval(interval);
          console.log('Finished inserting all rows');
          return;
        }

        const row = rows[index++];
        const callId = parseInt(row.CallID);
        const callDuration = parseInt(row.CallDuration);

        if (isNaN(callId) || isNaN(callDuration)) {
          console.warn('Skipping row due to invalid numeric values:', row);
          return;
        }

        const formattedWindowEnd = new Date(row.WindowEnd).toISOString().slice(0, 19).replace('T', ' ');

        const values = [
          callId, formattedWindowEnd, row.Country,
          row.CallerNumber, row.ReceiverNumber,
          callDuration, row.CallType, row.FraudType
        ];

        db.query(
          'INSERT IGNORE INTO fraud_calls (CallID, WindowEnd, Country, CallerNumber, ReceiverNumber, CallDuration, CallType, FraudType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          values,
          (err, result) => {
            if (err) {
              console.error('DB Insert Error:', err);
            } else {
              console.log(`Inserted CallID ${callId}`);
              io.emit('new-call', row);
            }
          }
        );
      }, 1000); 
    })
    .on('error', (err) => {
      console.error('Error reading CSV:', err);
    });
}


insertCallsFromCSVAndEmit(); // Run once when server starts

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
