import os
from flask import Blueprint, request, jsonify, render_template
import base64
import requests
from dotenv import load_dotenv
import json

upload_routes = Blueprint('upload', __name__)


load_dotenv()
TRUORA_API_KEY = os.getenv('TRUORA_API_KEY')
TRUORA_VALIDATION_URL = "https://api.validations.truora.com/v1/validations"

@upload_routes.route('/', methods=['POST'])
def upload_image():
    try:
        data = request.form['image']

        # Decodificar la imagen 
        _, imgstr = data.split(';base64,')
        imgdata = base64.b64decode(imgstr)
        filename = 'uploaded_image.jpg'
        filepath = os.path.join('static', filename)

        with open(filepath, 'wb') as f:
            f.write(imgdata)

        # Crear la validación
        validation_data = {
            'type': 'document-validation',
            'country': 'MX',
            'document_type': 'national-id',
            'user_authorized': True
        }
        headers = {
            'Truora-API-Key': TRUORA_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        print("Enviando solicitud de validación al servidor...")
        response = requests.post(TRUORA_VALIDATION_URL, headers=headers, data=validation_data)
        print(f"Respuesta del servidor - Código de estado: {response.status_code}")
        print(f"Respuesta del servidor: {response.text}")

        if response.status_code == 200:
            validation_response = response.json()
            front_url = validation_response.get('instructions', {}).get('front_url')
            reverse_url = validation_response.get('instructions', {}).get('reverse_url')
            validation_id = validation_response.get('validation_id')
            print(f"URL para subir imagen frontal: {front_url}")
            print(f"URL para subir imagen reversa: {reverse_url}")
        else:
            print("Error al crear la validación.")
            return jsonify({'status': 'error', 'message': 'Failed to create validation'}), response.status_code

        # Subir la imagen frontal al front_url endpoint
        if front_url:
            with open(filepath, 'rb') as img_file:
                headers = {
                    'Content-Type': 'image/jpeg'
                }
                print(f"Subiendo imagen frontal a la URL: {front_url}")
                response = requests.put(front_url, headers=headers, data=img_file)
                print(f"Respuesta del servidor al subir imagen frontal - Código de estado: {response.status_code}")
                print(f"Respuesta del servidor al subir imagen frontal: {response.text}")

            if response.status_code == 200:
                print("Imagen frontal subida exitosamente.")
                return jsonify({
                    'status': 'success',
                    'respuesta_del_servidor': response.json(),
                    'reverse_url': reverse_url,
                    'validation_id': validation_id
                }), 200
            else:
                print("Error al subir la imagen frontal al servidor.")
                return jsonify({'status': 'error', 'message': 'Failed to upload to server', 'respuesta_del_servidor': response.text}), response.status_code
        else:
            print("No se pudo obtener la URL para subir la imagen frontal.")
            return jsonify({'status': 'error', 'message': 'Failed to retrieve front_url from server response'}), 500

    except Exception as e:
        print(f"Exception occurred: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@upload_routes.route('/reverse', methods=['POST'])
def upload_reverse_image():
    try:
        data = request.form['image']
        reverse_url = request.form['reverse_url']

        # Decodificar la imagen base64 
        _, imgstr = data.split(';base64,')
        imgdata = base64.b64decode(imgstr)

        # Verificar que el formato sea correcto
        if not imgstr.startswith('/9j/'):
            return jsonify({'status': 'error', 'message': 'Invalid image format'}), 400

        filename = 'reverse_image.jpg'
        filepath = os.path.join('static', filename)

        with open(filepath, 'wb') as f:
            f.write(imgdata)

        # Subir la imagen del reverso a enpoin
        with open(filepath, 'rb') as img_file:
            headers = {
                'Content-Type': 'image/jpeg'
            }
            print(f"Subiendo imagen del reverso a la URL: {reverse_url}")
            response = requests.put(reverse_url, headers=headers, data=img_file)
            print(f"Respuesta del servidor al subir imagen del reverso - Código de estado: {response.status_code}")
            print(f"Respuesta del servidor al subir imagen del reverso: {response.text}")

        if response.status_code == 200:
            print("Imagen del reverso subida exitosamente.")
            return jsonify({'status': 'success', 'respuesta_del_servidor': response.json()}), 200
        else:
            print("Error al subir la imagen del reverso al servidor.")
            return jsonify({'status': 'error', 'message': 'Failed to upload reverse image', 'respuesta_del_servidor': response.text}), response.status_code

    except Exception as e:
        print(f"Exception occurred: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@upload_routes.route('/validate/<validation_id>', methods=['GET'])
def validate(validation_id):
    try:
        headers = {
            'Truora-API-Key': TRUORA_API_KEY,
            'Accept': 'application/json'
        }

        url = f"https://api.validations.truora.com/v1/validations/{validation_id}"
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            validation_result = response.json()
            print(f"Resultado de la validación: {validation_result}")  # Imprimir el resultado 
            return jsonify(validation_result), 200
        else:
            print("Error al validar los datos.")
            return jsonify({'status': 'error', 'message': 'Failed to validate data'}), response.status_code

    except Exception as e:
        print(f"Exception occurred: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
