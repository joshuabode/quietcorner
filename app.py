from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
import threading
import statistics

app = Flask(__name__)
previous_reports = {}
lock = threading.Lock()

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_DB'] = 'campus_maps'

mysql = MySQL(app)

@app.get("/")
@app.get("/login")
def login_form():
    return
@app.route('/api/report_crowd', methods=['POST'])
def report_crowd():

    data = request.json
    building_id = data["location_id"]
    crowd_level = data["crowd_level"]

    cur = mysql.connection.cursor()
    cur.execute("SELECT positions_occupied, max_capacity FROM building WHERE building_id = %s",(building_id,))
    occupancy = cur.fetchone()
    positions_occupied = occupancy[0]
    max_capacity = occupancy[1]

    new_report = crowd_level * max_capacity
    total_reports = 0
    try:
        total_reports = len(previous_reports[building_id])
    except:
        with lock:
            previous_reports[building_id] = [new_report]
    if(total_reports>0):
        with lock:
            previous_reports[building_id].append(new_report)
    # if memory becomes an issue (i.e this array becomes too large which is unlikely)
    # this array could have a fixed size of 5 items- by moving the items up and replacing
    # the oldest one.

    if (len(previous_reports[building_id])>=5):
        report_array= previous_reports[building_id][-5:]
        mean = statistics.mean(report_array)
        standard_devation = statistics.stdev(report_array)

        if (mean - (2*standard_devation) <= new_report and 
            mean + (2*standard_devation) >= new_report):
            weight = 0.6
            positions_occupied = round( (weight * new_report) + 
                                        ((1 - weight) * positions_occupied) )
        
            cur.execute("UPDATE building SET positions_occupied = %s WHERE building_id = %s", (positions_occupied, building_id))
            mysql.connection.commit()
            cur.close()

            return jsonify({"message": "Crowd report submitted successfully"}), 201
        else:
            cur.close()
            return jsonify({"message": "Crowd Report taken, too much variance"}), 200
    else:
        cur.execute("UPDATE building SET positions_occupied = %s WHERE building_id = %s", (positions_occupied, building_id))
        mysql.connection.commit()
        cur.close()
        return jsonify({"message": "Crowd report submitted successfully "}), 201



@app.route('/api/locations', methods=['GET'])
def get_locations():
    cur = mysql.connection.cursor()
    cur.execute('''SELECT building_id, name, longitude, latitude, opening_hours, max_capacity, positions_occupied, has_access_point, facility_1, facility_2, facility_3 FROM building''')
    locations = cur.fetchall()
    cur.close()

    return jsonify([{
        'id': loc[0],
        'name': loc[1],
        'longitude': float(loc[2]),
        'latitude': float(loc[3]),
        'opening_hours': loc[4],
        'max_capacity': loc[5],
        'positions_occupied': loc[6],
        'has_access_point': loc[7],
        'facility_1': loc[8],
        'facility_2': loc[9],
        'facility_3': loc[10],

    } for loc in locations])


@app.post("/")
@app.post("/login")
def authenticate():
    return

@app.get("/register")
def registration():
    return

@app.post("/register")
def new_user():
    return