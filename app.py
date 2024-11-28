from flask import Flask

app = Flask(__name__)

@app.get("/")
@app.get("/login")
def login_form():
    return

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