from flask import Flask, request, session, redirect
from flask_session import Session # Change to ... import SqlAlchemySessionInterface later
from authenticator import Authenticator

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

@app.route("/")
def index():
    print(session)
    if not session.get("authenticated"):
        return redirect("/login")
    else:
        return redirect("/home")

@app.get("/login")
def login_form():
    print(request.args.get('csticket'))
    auth_response = Authenticator(request.args).validate_user()
    print(auth_response, type(auth_response))
    if type(auth_response).__name__ == 'Response':
        return auth_response
    

@app.post("/login")
def authenticate():
    # Set session['authenticated'] to true if succesful
    return

@app.get("/register")
def registration():
    return

@app.post("/register")
def new_user():
    return

@app.get("/no-auth")
def no_auth():
    return "<h1> Not Authenticated </h1>"

@app.get("/home")
def home():
    return "<p> Logged in! </p>"

if __name__ == "__main__":
    app.run("0.0.0.0", 5000, debug=True)