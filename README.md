# Proyecto de Validación de Documentos

Este proyecto es una aplicación web desarrollada en Flask para la validación de documentos a través de una API externa. La aplicación permite cargar imágenes de documentos, validarlos y recibir las respuestas del servidor desarrollada por mario arturo ramirez victoria como prueba tecnica,.

## Estructura del Proyecto

```plaintext
tuora/
│
├── routes/
│   ├── __init__.py
│   ├── main_routes.py
│   └── upload_routes.py
│
├── static/
│   ├── css/
│   │   ├── styles.css
│   │   └── tutorial.css
│   ├── images/
│   │   ├── logo.png
│   │   └── scan2.png
│   └── js/
│       ├── scripts.js
│       └── tutorial.js
│
├── templates/
│   └── index.html
│
├── .env
├── app.py
├── requirements.txt
└── README.md


Instalación
Prerrequisitos
Python 3.x instalado en tu sistema.
Pip (Python Package Installer) para manejar las dependencias.
ejecuta el comando  pip install -r requirements.txt
Crea un archivo .env en la raíz del proyecto y añade tus credenciales de API:
VALIDATION_API_KEY=tu_api_key

Finalmente, puedes ejecutar la aplicación Flask:

python app.py
La aplicación estará disponible en http://127.0.0.1:5000/.
