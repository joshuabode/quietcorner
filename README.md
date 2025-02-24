# Installing the Quiet corner web app for dev work

## 1. Installing package requirements

Run the following once you have pulled: `pip install -r requirements.txt`.

### Backend Startup

Skim-through this:
https://flask.palletsprojects.com/en/stable/quickstart/
## 2. Installation of node.js

Follow the instructions here to install node.js, npm: https://nodejs.org/en/download/package-manager

Windows users: I used the fnm method to install node.js, which you need to install via winget. If not available,
install from Microsoft Store.

Check successful installation by running:`node --version` and `npm --version`


## 3. Launching the web app
Front end:
cd into the quietcorner folder and run `npm run dev`.

Back end:
You need to install flask-mysqldb which involves installing dependencies from mysql client. Follow the instructions here: https://github.com/PyMySQL/mysqlclient#install

After installating Flask (v3.1.0), execute `flask run` to start the webapp.

Server:
`mysql.server start`