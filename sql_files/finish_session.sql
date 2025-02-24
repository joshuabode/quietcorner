USE campus_maps;

--file to update the session_end column in the session table for a particualr user to indicate that the session is finished.

--you only need to provide the username, and the script will get the most recent session_id of the user for you.
--the most recent record a user has in the table is the one with the highest session_id value

--parameters:
--username of the user to edit the record for

UPDATE user_session
SET session_end = CURRENT_TIMESTAMP
WHERE session_id = (
    SELECT MAX(session_id)
    FROM user
    WHERE username = @username
);