--run this file add a new user to the user table
--username is same as the uom username
--email is the same as the uom email
--calendar_data should be null for now

--you can run this file from javascript and pass arguments from there

USE campus_maps;

INSERT INTO user (username, email, calendar_data)
VALUES(@username, @email, NULL);