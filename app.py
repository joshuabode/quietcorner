from flask import Flask, request, jsonify
from flask_session import Session 
from flask_mysqldb import MySQL
from flask_cors import CORS
from authenticator import Authenticator

app = Flask(__name__)


app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_DB'] = 'campus_map'
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000/"])

mysql = MySQL(app)

# @app.get("/")
# @app.get("/login")
# def login_form():
#     auth_response = Authenticator(request.args).validate_user()
#     print(auth_response, type(auth_response))
#     if type(auth_response).__name__ == 'Response':
#         return auth_response
    
@app.get('/api/login')
def login():
    print("FU")
    authentication_data = Authenticator(request.args).validate_user()
    if not authentication_data['auth']:
        print(authentication_data)
        return jsonify(authentication_data)
    else:
        authentication_data['url'] = request.path
        print(authentication_data)
        return jsonify(authentication_data)

# @app.get('/api/locations')
# def get_locations():
#     cur = mysql.connection.cursor()
#     cur.execute('''SELECT id, name, latitude, longitude, opening_hours, facilities FROM locations''')
#     locations = cur.fetchall()
#     cur.close()

#     return jsonify([{
#         'id': loc[0],
#         'name': loc[1],
#         'latitude': float(loc[2]),
#         'longitude': float(loc[3]),
#         'opening_hours': loc[4],
#         'facilities': loc[5].split(', ')
#     } for loc in locations])


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