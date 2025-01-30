CREATE DATABASE campus_maps;

USE campus_maps;

CREATE TABLE user (
                      username VARCHAR(20) PRIMARY KEY,
                      email VARCHAR(256),
                      calendar_data VARBINARY(8192),
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- password table likely to be removed later
CREATE TABLE password (
                          username VARCHAR(20) PRIMARY KEY,
                          encrypted_pass BLOB,
                          salt BLOB,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPOSED CHANGES MADE ON 30/01/2025
-- end_of_session table removed
-- if the record is added from an event on the user's timetable, then the start and end times are automatically filled in
-- if the record is added from a card swipe, the end attribute will be null until the user swipes again
-- to add a record from a timetabled event, first check the has_access_point attribute for the building in the buildings table

CREATE TABLE start_of_session (
                                  session_id INT PRIMARY KEY AUTO_INCREMENT,
                                  username VARCHAR(20),
                                  building_id INT,
                                  session_start DATETIME,
                                  session_end DATETIME NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE building (
                          building_id INT PRIMARY KEY AUTO_INCREMENT,
                          name TEXT,
                          latitude FLOAT,
                          longitude FLOAT,
                          opening_hours VARCHAR(256),
                          positions_occupied INT,
                          max_capacity INT,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          has_access_point BOOLEAN,
                          facility_1 TEXT,
                          facility_2 TEXT,
                          facility_3 TEXT,
                          facility_4 TEXT,
                          facility_5 TEXT
);
