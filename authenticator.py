# The python implementation of the Authenticator class in PHP written by Iain Hart (iain.hart@manchester.ac.uk)

# By Joshua Bode

from time import time_ns
import ssl
from urllib.parse import quote, quote_plus
from urllib.request import urlopen
from flask import session, redirect, Response
from flask_session import Session # Change to ... import SqlAlchemySessionInterface later

AUTHENTICATION_SERVICE_URL = 'http://studentnet.cs.manchester.ac.uk/authenticate/'
DEVELOPER_URL = 'http://localhost:3000/main/'
AUTHENTICATION_LOGOUT_URL = 'http://studentnet.cs.manchester.ac.uk/systemlogout.php'
APP_HOME_URL = 'http://localhost:3000/main/'

# Ignore SSL errors when using the API
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class Authenticator:
    def __init__(self, request_args) -> None:
        self.request = request_args

    def validate_user(self) -> dict:
        if self.is_authenticated():
            return {'auth': True, 'url': APP_HOME_URL}
        elif not session.get('csticket') or not self.request.get('csticket'):
            return self.send_for_authentication()
        elif self.request.get('csticket') != session.get('csticket'):
            return self.send_for_authentication()
        elif self.is_get_parameters_matching_server_authentication():
            self.record_authenticated_user()
            return {'auth': False, 'url': DEVELOPER_URL}
        else:
            return {'auth': True, 'url': APP_HOME_URL}

    def is_authenticated(self) -> bool:
        auth_timestamp = self.get_time_authenticated()
        if auth_timestamp and type(auth_timestamp).__name__ == 'int':
            return True
        else:
            return False

    def send_for_authentication(self) -> Response:
        csticket = hex(time_ns())
        session["csticket"] = csticket
        url = self.get_authentication_url("validate")
        return {'auth': False, 'url': url}
    
    def get_authentication_url(self, command) -> str:
        csticket = session.get('csticket')
        url = f"{AUTHENTICATION_SERVICE_URL}?url={DEVELOPER_URL}"
        url += f"&csticket={csticket}&version=3&command={command}"
        return url
    
    def record_authenticated_user(self) -> None:
        session['authenticated'] = time_ns()
        session['username'] = quote(self.request.get('username'))
        session['fullname'] = quote(self.request.get('fullname'))
        return

    def is_get_parameters_matching_server_authentication(self) -> bool:
        url = self.get_authentication_url('confirm')
        url += '&username=' + quote_plus(quote(self.request.get('username')))
        url += '&fullname=' + quote_plus(quote(self.request.get('fullname')))
        print(url)
        if urlopen(url, context=ctx).read() != 'true':
            self.fail_authentication()
            return False
        else:
            return True
        
    def fail_authentication(self) -> Response:
        return redirect('/no-auth')
    
    def get_time_authenticated(self) -> int:
        if session.get('authenticated'):
            return session.get('authenticated')
        return None
    
    def invalidate_user(self) -> Response:
        session.clear()
        return {'auth': False, 'url': AUTHENTICATION_LOGOUT_URL}