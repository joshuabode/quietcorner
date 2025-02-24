CREATE DATABASE campus_maps;

USE campus_maps;

--calendar data: holds the raw binary ics file of the user's timetable data

CREATE TABLE user (
                      username VARCHAR(20) PRIMARY KEY,
                      email VARCHAR(256),
                      calendar_data VARBINARY(8192),
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--session_id is unique for all records. so 2 users cannot have the same session id in the db
--session_start and session_end are the start and end times the user is in the building for. used to make
--changes to the positinos_occupied field in the buildings table

CREATE TABLE user_session (
                                  session_id INT PRIMARY KEY AUTO_INCREMENT,
                                  username VARCHAR(20),
                                  building_id INT,
                                  session_start DATETIME,
                                  session_end DATETIME NULL,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--latitude and longitude contain the coordinated of the building
--ration of positions_occupied to max_capacity can be used to gauge how full the building is
--has_access_point indicates if the building has a card scanner

--facility_n holds text info about a particular facility in the building. can contain a description or directions up 
--to ~65k characters. Holds info for up to 5 facitilies

CREATE TABLE building (
                          building_id INT PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(256),
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
