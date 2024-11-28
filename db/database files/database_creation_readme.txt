Users table:
This table is used to store the username, email, and calendar data. On account creation the calendar_data field will be empty. When the user 
saves calendar data in the web app, an encrypted form of the data is stored in the database (using homomorphic encryption). Hmomorphic encryption
allows us to retrieve and use the original input without having to decrypt it. A complex homomorphic algorithm is computationally expensive so 
this will also need to be considered. The email is stored to allow the user to perform a password reset if they forget their password, otherwise
the account would be lost.

Password table:
stores the username so we know which record to check to verify the correct password has been input. the encrypted password and salt is also stored.
On account creation, a new entry will be added. when the user logs in, the salt is appended onto the password, and the hashing algorithm creates
a hash of the data. This data is then checked against the stored encrypted password to see if they match.

start_of_session and end_of_session tables:
these 2 tables kind of coincide with eachother. These tables are altered via 2 ways. User location data can be used to determine which room they 
entered or left. If the user enteres a room in a building, a new record is added to the table outlining the session_start_id, along with the 
other fields. when the user leaves the room, a new record is added to the session_end table. The user's calendar data can also be used to 
automatically add records to the session_start and session_end tables according to the times of their planned study sessions. Since records are
added in 2 ways, we need to try and prevent records being added that conflict with eachother. For example, if the user's location data is used
to add a record to the session_start table and then their calendar data is used to determine the start of the session, we first need to check if
a user is already in the room so we dont add 2 sessions for the same user at the same time.

building tables:
This table stores a record for each building and room combination (so the building and room form a composite primary key). When a record is added
to the session_start table, we go to the buildings table and increment the poitions_occupied for the given building and room by 1. same thing when
a record is added to the session_end table but this time we decrease poitions_occupied by 1. We can calculate a ratio of positions_occupied to
max_capacity to gague how busy a room is. To gague how busy the whole building is, we can do the same thing but by first summing the 
positions_occupied and max_capacity fields for every room in a building.

We can use a collection of data from the building table by calculating how busy a room is at different timestamps and this can be used to show
the user predictions about how busy a room/building is likely to be at a certain time of day.