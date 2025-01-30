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


@app.route('/api/locations', methods=['GET'])
def get_locations():
    cur = mysql.connection.cursor()
    cur.execute('''SELECT building_id, name, longitude, latitude, opening_hours, facilities, max_capacity, positions_occupied FROM building''')
    locations = cur.fetchall()
    cur.close()

    return jsonify([{
        'id': loc[0],
        'name': loc[1],
        'longitude': float(loc[2]),
        'latitude': float(loc[3]),
        'opening_hours': loc[4],
        'facilities': loc[5],
        'max_capacity': loc[6],
        'positions_occupied': loc[7]
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