from flask import Flask, request, jsonify
from flask_session import Session 
from flask_mysqldb import MySQL
from flask_cors import CORS
from authenticator import Authenticator
from datetime import timedelta

app = Flask(__name__)


app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_DB'] = 'campus_maps'
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=3)
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
CORS(app, supports_credentials=True)

mysql = MySQL(app)


@app.route('/api/report_crowd', methods=['POST'])
def report_crowd():
    data = request.json

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

@app.get('/api/login')
def login():
    authentication_data = Authenticator(request.args).validate_user()
    return jsonify(authentication_data)

@app.get('/api/logout')
def logout():
    deauthentication_data = Authenticator(request.args).invalidate_user()
    return jsonify(deauthentication_data)