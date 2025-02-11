USE campus_maps;

--initially, when a new session is created, the session_end field will be null to indicate that the user is currently
--in the building. Later when the student leaves we will edit the appropriate record

--parameters required for this file:
--username of the user
--building the user has entered

INSERT INTO session (username, building_id, session_start)
VALUES (@username, @building_id, CURRENT_TIMESTAMP);