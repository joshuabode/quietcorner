from flask import Flask, request, jsonify
from flask_mysqldb import MySQL

app = Flask(__name__)


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


    return jsonify({"message": "Crowd report submitted successfully"}), 201


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