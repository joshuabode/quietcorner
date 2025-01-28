CREATE DATABASE campus_maps;

USE campus_maps;

CREATE TABLE users (
    username VARCHAR(20) PRIMARY KEY,
    email VARCHAR(256),
    calendar_data VARBINARY(8192), 
    created_at TIMESTAMP
);

CREATE TABLE passwords (
    username VARCHAR(20) PRIMARY KEY,
    encrypted_pass BLOB(256),
    salt BLOB(256),
    created_at TIMESTAMP
);

CREATE TABLE start_of_session (
    session_start_id INT PRIMARY KEY,
    username VARCHAR(20),
    building_id INT,
    room VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE end_of_session (
    session_end_id INT PRIMARY KEY,
    username VARCHAR(20),
    building_id INT,
    room VARCHAR(20),
    created_at TIMESTAMP
);

CREATE TABLE building (
    building_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    name TEXT,
    latitude FLOAT,
    longitude FLOAT,
    opening_hours VARCHAR(256),
    facilities TEXT,
    positions_occupied INT,
    max_capacity INT,
    created_at TIMESTAMP,
    has_access_point BOOLEAN,
);



