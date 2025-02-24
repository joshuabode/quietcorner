//btw this is all chatgpt code rn

const fs = require('fs');
const sql = require('mssql');

// Database connection settings
const config = {
    //user: 'your_db_user',
    //password: 'your_db_password',
    server: 'server_name', //localhost?
    database: 'campus_maps',
    options: {
        encrypt: true, // Use for Azure connections
        trustServerCertificate: true // Use for self-signed certificates
    }
};

// Function to execute an SQL file
async function runSqlFile(filePath) {
    try {
        // Read the SQL file
        const query = fs.readFileSync(filePath, 'utf-8');

        // Connect to SQL Server
        await sql.connect(config);

        // Execute the SQL query
        const result = await sql.query(query);
        console.log('SQL executed successfully:', result);

        // Close the connection
        await sql.close();
    } catch (err) {
        console.error('Error executing SQL file:', err);
        sql.close();
    }
}

// Run the script
runSqlFile('db_creation.sql');

//also heres chatgpt code for a script that would run an sql file and pass in parameters

/*

const fs = require('fs');
const sql = require('mssql');

// Read the SQL file
const sqlFile = fs.readFileSync('insert_record.sql', 'utf8');

// Database connection config
const config = {
  user: 'your_username',
  password: 'your_password',
  server: 'your_server',
  database: 'your_database',
  options: {
    encrypt: true,  // Use if you have SSL
    trustServerCertificate: true,  // Use if needed
  },
};

// Function to run the SQL file with arguments
async function runSQLFile(username, email, calendar_data) {
  try {
    // Establish the database connection
    await sql.connect(config);

    // Execute the SQL file with the parameters
    await sql.query(`
      ${sqlFile}
    `, [
      { name: 'ID', type: sql.VarChar, value: username },
      { name: 'Name', type: sql.VarChar, value: email },
      { name: 'HireDate', type: sql.VarBinary, value: calendar_data }
    ]);

    console.log('Record inserted successfully');
  } catch (err) {
    console.error('Error running SQL file:', err);
  } finally {
    // Close the connection
    sql.close();
  }
}

// Pass arguments when calling the function
runSQLFile('marek', 'marek@email', 'NULL')

*/