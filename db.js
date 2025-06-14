// // const mysql = require('mysql2');

// // const connection = mysql.createConnection({
// //   host: 'localhost',
// //   user: 'root',
// //   password: 'password',
// //   database: 'calllogDB'
// // });

// // // const connection = mysql.createConnection({
// // //   host: 'localhost',
// // //   user: 'root',
// // //   password: 'password',
// // //   database: 'calllogDB'
// // // });
// // connection.connect((err) => {
// //   if (err) throw err;
// //   console.log('Connected to MySQL');
// // });

// // module.exports = connection;


// const sql = require('mssql');

// const config = {
//   user: 'your-username', // e.g. kajaladmin
//   password: 'your-password',
//   server: 'your-server-name.database.windows.net', // Azure SQL server address
//   database: 'your-database-name',
//   options: {
//     encrypt: true, // required for Azure
//     trustServerCertificate: false // set to true if you're testing with self-signed cert
//   }
// };

// sql.connect(config)
//   .then(() => {
//     console.log("Connected to Azure SQL Database");
//     // You can now run queries
//   })
//   .catch(err => {
//     console.error("Connection error:", err);
//   });

//   sql.connect(config).then(pool => {
//   return pool.request()
//     .query('SELECT TOP 10 * FROM YourTableName');
// }).then(result => {
//   console.dir(result.recordset);
// }).catch(err => {
//   console.error("Query error:", err);
// });

const sql = require('mssql');

const config = {
  user: 'omghewade',
  password: 'Om@12345',
  server: 'fraudcallsqlserver.database.windows.net',
  database: 'calllogDB',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config:', err);
    throw err;
  });

module.exports = {
  sql,           // export the sql object (for types, helpers, etc.)
  poolPromise    // export the connection pool promise
};
