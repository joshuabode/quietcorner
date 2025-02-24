import threading
import statistics
import time
import pickle
from datetime import timedelta

from flask import Flask, Response, request, jsonify
from flask_session import Session 
from flask_mysqldb import MySQL
from flask_cors import CORS

from authenticator import Authenticator

app = Flask(__name__)
previous_reports = {}
active_users = []
active_user_reports = []
lock = threading.Lock()

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_DB'] = 'campus_maps'
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=3)
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
CORS(app, supports_credentials=True)

mysql = MySQL(app)


@app.post('/api/report_crowd')
def report_crowd():
    print("\n\n" + str(active_user_reports) + "\n\n")
    data = request.json
    report_valid = True
    for activity in active_user_reports:
        if activity["username"] == data["username"] and activity["location_id"] == data["location_id"]:
            if time.time_ns()*1000 < activity["timestamp"] + 1.8*(10**6):
                active_user_reports.remove(activity)
            else:
                report_valid = False
    
    if report_valid:
        active_user_reports.append({"username": data["username"], "location_id": data["location_id"], "timestamp": time.time_ns()*1000})
        building_name = data["location_id"].strip()
        crowd_level = data["crowd_level"]
        cur = mysql.connection.cursor()
        print(f"SELECT positions_occupied, max_capacity FROM campus_maps.building WHERE name = \"{building_name}\"")
        cur.execute(f"SELECT positions_occupied, max_capacity FROM campus_maps.building WHERE name = \"{building_name}\"")
        occupancy = cur.fetchall()
        print(occupancy)
        positions_occupied = occupancy[0][0]
        max_capacity = occupancy[0][1]

        new_report = crowd_level * max_capacity
        total_reports = 0
        try:
            total_reports = len(previous_reports[building_name])
        except:
            with lock:
                previous_reports[building_name] = [new_report]
        if(total_reports>0):
            with lock:
                previous_reports[building_name].append(new_report)
        # if memory becomes an issue (i.e this array becomes too large which is unlikely)
        # this array could have a fixed size of 50 items- by moving the items up and replacing
        # the oldest one.

        if (len(previous_reports[building_name])>=50):
            report_array= previous_reports[building_name][-50:]
            print(previous_reports)
            mean = statistics.mean(report_array)
            standard_devation = statistics.stdev(report_array)

            if (mean - 0.5*(standard_devation) <= new_report and
                mean + 0.5*(standard_devation) >= new_report):
                weight = 0.6
                positions_occupied = round( (weight * new_report) + 
                                            ((1 - weight) * positions_occupied) )
            
                cur.execute(f"UPDATE building SET positions_occupied = {new_report} WHERE name = \"{building_name}\"")
                mysql.connection.commit()
                cur.close()

                return jsonify({"message": "Crowd report submitted successfully"}), 201
            else:
                cur.close()
                return jsonify({"message": "Crowd Report taken, too much variance"}), 400
        else:
            cur.execute(f"UPDATE building SET positions_occupied = {new_report} WHERE name = \"{building_name}\"")
            print(previous_reports)
            print(new_report)
            print(f"UPDATE building SET positions_occupied = {new_report} WHERE name = \"{building_name}\"")
            mysql.connection.commit()
            cur.close()
            return jsonify({"message": "Crowd report submitted successfully "}), 201
    else:
        return jsonify({"message": "Crowd report discarded, reports are too frequent"}), 400

@app.get('/api/locations')
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

@app.post('/api/upload_calendar')
def upload_calendar():
    data = request.json
    username = data['username']
    with open(f'flask_ics/{username}.ics', 'wb+') as file:
        calendar = pickle.dump(data['data'], file)
    return Response(status=201)
    
@app.get('/api/fetch_calendar/<username>')
def fetch_calendar(username):
    if not username:
        return jsonify({'message': 'No username passed'}), 400
    try:
        with open(f'flask_ics/{username}.ics', 'rb') as file:
            calendar = pickle.load(file)
    except FileNotFoundError:
        return jsonify({'message': "No calendar data"}), 400
    return jsonify({'data': calendar})

@app.get('/api/login')
def login():
    authentication_data = Authenticator(request.args).validate_user()
    return jsonify(authentication_data)

@app.get('/api/logout')
def logout():
    deauthentication_data = Authenticator(request.args).invalidate_user()
    return jsonify(deauthentication_data)
