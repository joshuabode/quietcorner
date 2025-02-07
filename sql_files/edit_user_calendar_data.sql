--run this file to edit the user table when they upload an ics file

--1st argument: the username of the user you want to edit the calendar data for
--2nd argumnet: the contents of the binary file to set the calendar_data attribute to

USE campus_maps

UPDATE user
SET calendar_data = @calendar_data
WHERE username = @username;

