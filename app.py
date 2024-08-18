from flask import Flask, render_template
from routes.upload_routes import upload_routes 

app = Flask(__name__)

#  blueprint 
app.register_blueprint(upload_routes, url_prefix='/upload')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
