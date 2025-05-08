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
        socketio.emit('nuevo_borrado', data)  # Emitir evento a los clientes conectados
        return jsonify({'mensaje': 'Borrado agregado'}), 201
        
    elif request.method == 'GET':
        return jsonify(borrados)
        
    elif request.method == 'DELETE':
        borrados = []  # Reiniciar la lista de borrados
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
        socketio.emit('horario_actualizado', horario_proxima)  # Emitir evento con el nuevo horario
        return jsonify({'mensaje': 'Horario actualizado', 'horario': horario_proxima}), 200
        
    elif request.method == 'GET':
        return jsonify({'horario': horario_proxima})
    
@app.route('/api/borrados/<carrera>', methods=['GET'])
def obtener_borrados_por_carrera(carrera):
    caballos = [item['caballo'] for item in borrados if item['carrera'] == carrera]
    return jsonify(caballos)

@app.route('/api/borrados/<carrera>/<caballo>', methods=['DELETE'])
def eliminar_caballo_de_carrera(carrera, caballo):
    global borrados
    original_len = len(borrados)
    borrados = [item for item in borrados if not (item['carrera'] == carrera and item['caballo'] == caballo)]

    if len(borrados) < original_len:
        socketio.emit('borrado_eliminado', {'carrera': carrera, 'caballo': caballo})  # Emitir evento de eliminación
        return jsonify({'mensaje': 'Caballo eliminado'}), 200
    else:
        return jsonify({'mensaje': 'Caballo no encontrado en la lista de borrados'}), 404

hipodromo_actual = ""
pista_actual = ""

@app.route('/api/hipodromo', methods=['POST'])
def set_hipodromo():
    global hipodromo_actual
    data = request.get_json()
    if not data or 'hipodromo' not in data:
        return jsonify({'error': 'Hipódromo no proporcionado'}), 400

    hipodromo_actual = data['hipodromo']
    socketio.emit('hipodromo_actualizado', hipodromo_actual)
    return jsonify({'mensaje': 'Hipódromo actualizado', 'hipodromo': hipodromo_actual}), 200

@app.route('/api/pista', methods=['POST'])
def set_pista():
    global pista_actual
    data = request.get_json()
    if not data or 'pista' not in data:
        return jsonify({'error': 'Tipo de pista no proporcionado'}), 400

    pista_actual = data['pista']
    socketio.emit('pista_actualizada', pista_actual)
    return jsonify({'mensaje': 'Tipo de pista actualizado', 'pista': pista_actual}), 200


# Manejador de eventos para conexiones de Socket.IO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado:', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado:', request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
