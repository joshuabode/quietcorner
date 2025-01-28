CREATE TABLE users (
    username VARCHAR(20) PRIMARY KEY,
    email VARCHAR(256),
    calendar_data VARBINARY(8192), 
    created_at TIMESTAMP
);

CREATE TABLE passwords (
    username VARCHAR(20) PRIMARY KEY,
    encrypted_pass BINARY(256),
    salt BINARY(256),
    created_at TIMESTAMP
);

CREATE TABLE start_of_session (
    session_start_id INT PRIMARY KEY,
    username VARCHAR(20) PRIMARY KEY,
    building_id INT,
    room VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE end_of_session (
    session_end_id INT PRIMARY KEY,
    username VARCHAR(20) PRIMARY KEY,
    building_id INT,
    room VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE building (
    building_id INT PRIMARY KEY,
    room VARCHAR(20) PRIMARY KEY,
    positions_occupied INT,
    max_capacity INT,
    created_at TIMESTAMP
);

-- latitude, longitude, opening hours within the buiilding table
-- there should only be one primary KEY
-- card reader boolean in buildings table
-- start/end of session tables don't update occupancy for buildings with card readers
