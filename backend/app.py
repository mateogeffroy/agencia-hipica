from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)

# Configuración de SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Datos en memoria
borrados = []
horario_proxima = ""

@app.route('/api/borrados', methods=['GET', 'POST', 'DELETE'])
def manejar_borrados():
    global borrados
    
    if request.method == 'POST':
        data = request.get_json()
        # Validación básica de datos
        if not data or 'carrera' not in data or 'caballo' not in data:
            return jsonify({'error': 'Datos incompletos'}), 400
            
        borrados.append(data)
        socketio.emit('nuevo_borrado', data)
        return jsonify({'mensaje': 'Borrado agregado'}), 201
        
    elif request.method == 'GET':
        return jsonify(borrados)
        
    elif request.method == 'DELETE':
        borrados = []
        socketio.emit('lista_reiniciada', {'mensaje': 'Lista de borrados reiniciada'})
        return jsonify({'mensaje': 'Lista de borrados reiniciada'}), 200

@app.route('/api/horario', methods=['GET', 'POST'])
def manejar_horario():
    global horario_proxima
    
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'horario' not in data:
            return jsonify({'error': 'Horario no proporcionado'}), 400
            
        horario_proxima = data['horario']
        socketio.emit('horario_actualizado', horario_proxima)
        return jsonify({'mensaje': 'Horario actualizado', 'horario': horario_proxima}), 200
        
    elif request.method == 'GET':
        return jsonify({'horario': horario_proxima})

# Manejador de eventos para conexiones de Socket.IO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado:', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado:', request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)