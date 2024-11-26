Users table:
This table is used to store the username, email, and calendar data. On account creation the calendar_data field will be empty. When the user 
saves calendar data in the web app, a hash of the data is created and will be stored in the appropriate record in the table. The original data is
retrieved by reverse enginering the hash to get the original data. 