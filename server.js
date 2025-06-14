const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const csv = require('csv-parser');
const fs = require('fs');
const { sql, poolPromise } = require('./db'); // updated import

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// 🟢 GET: Fetch calls
app.get('/api/calls', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM fraud_calls ORDER BY CallID DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'DB Error' });
  }
});

// 📤 Broadcast updates to frontend
async function insertCallsFromCSVAndEmit() {
  const rows = [];

  fs.createReadStream('calls.csv')
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (row) => {
      rows.push(row); // Collect all rows
    })
    .on('end', async () => {
      console.log(`Total rows to insert: ${rows.length}`);
      let index = 0;

      const pool = await poolPromise;

      const interval = setInterval(async () => {
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

        try {
          await pool.request()
            .input('CallID', sql.Int, callId)
            .input('WindowEnd', sql.DateTime, formattedWindowEnd)
            .input('Country', sql.VarChar, row.Country)
            .input('CallerNumber', sql.VarChar, row.CallerNumber)
            .input('ReceiverNumber', sql.VarChar, row.ReceiverNumber)
            .input('CallDuration', sql.Int, callDuration)
            .input('CallType', sql.VarChar, row.CallType)
            .input('FraudType', sql.VarChar, row.FraudType)
            .query(`IF NOT EXISTS (SELECT 1 FROM fraud_calls WHERE CallID = @CallID)
              INSERT INTO fraud_calls 
              (CallID, WindowEnd, Country, CallerNumber, ReceiverNumber, CallDuration, CallType, FraudType)
              VALUES (@CallID, @WindowEnd, @Country, @CallerNumber, @ReceiverNumber, @CallDuration, @CallType, @FraudType)`);

          console.log(`Inserted CallID ${callId}`);
          io.emit('new-call', row);
        } catch (err) {
          console.error('Insert error:', err);
        }
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
