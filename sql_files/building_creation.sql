INSERT INTO building (name, latitude, longitude, opening_hours, positions_occupied, max_capacity,created_at, has_access_point, facility_1, facility_2, facility_3, facility_4, facility_5)

VALUES("Alan Gilbert Learning Commons", 53.4657,-2.2339, '24/7',  0, 1000,CURRENT_TIMESTAMP ,True,"Group study areas", "Silent study zones", "Café", NULL, NULL ),
      ("Main Library", 53.4668,-2.2339,'8:00 AM - 10:00 PM',  0, 1000,CURRENT_TIMESTAMP, True,"Study rooms", "Computer labs", "Printing services", NULL, NULL ),
      ("Stopford Building Library", 53.4645,-2.2301,'8:00 AM - 10:00 PM',  0, 1000,CURRENT_TIMESTAMP, False,"Study rooms", "Computer labs", "Printing services", NULL, NULL );