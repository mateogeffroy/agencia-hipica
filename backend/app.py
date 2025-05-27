from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import re # Importar el módulo re para expresiones regulares

app = Flask(__name__)
CORS(app)

# Configuración de SocketIO
# Se aumenta el ping_timeout para dar más tiempo al cliente para responder
# antes de que el servidor lo considere desconectado.
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=60) # Valor por defecto es 5 segundos

# Datos en memoria (variables globales para almacenar el estado de la aplicación)
borrados = []
horario_proxima = ""
hipodromo_actual = "San Isidro"
pista_actual = "cesped"
carrera_base = 1

# NUEVAS VARIABLES GLOBALES para la sección "Ojo con este..."
ojo_carrera = None  # Almacena el número de carrera
ojo_caballo = None  # Almacena el número/nombre del caballo

@app.route('/api/borrados', methods=['GET', 'POST', 'DELETE'])
def manejar_borrados():
    global borrados
    
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'carrera' not in data or 'caballo' not in data:
            return jsonify({'error': 'Datos incompletos'}), 400
            
        data['carrera'] = int(data['carrera'])
        borrados.append(data)
        # Emitir el evento a todos los clientes conectados
        socketio.emit('nuevo_borrado', data)
        return jsonify({'mensaje': 'Borrado agregado'}), 201
        
    elif request.method == 'GET':
        # Devolver la lista actual de borrados
        return jsonify(borrados)
        
    elif request.method == 'DELETE':
        # Reiniciar la lista de borrados
        borrados = []
        # Emitir el evento de reinicio a todos los clientes
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
        # Emitir el horario actualizado a todos los clientes
        socketio.emit('horario_actualizado', horario_proxima)
        return jsonify({'mensaje': 'Horario actualizado', 'horario': horario_proxima}), 200
        
    elif request.method == 'GET':
        # Devolver el horario actual
        return jsonify({'horario': horario_proxima})
    
@app.route('/api/borrados/<int:carrera>', methods=['GET'])
def obtener_borrados_por_carrera(carrera):
    # Filtrar caballos borrados por número de carrera
    caballos = [item['caballo'] for item in borrados if item['carrera'] == carrera]
    return jsonify(caballos)

@app.route('/api/borrados/<int:carrera>/<string:caballo>', methods=['DELETE'])
def eliminar_caballo_de_carrera(carrera, caballo):
    global borrados
    original_len = len(borrados)
    caballo_upper = caballo.upper() # Convertir a mayúsculas para comparación consistente
    # Filtrar la lista de borrados para eliminar el caballo específico
    borrados = [item for item in borrados if not (item['carrera'] == carrera and item['caballo'] == caballo_upper)]

    if len(borrados) < original_len:
        # Si se eliminó un elemento, emitir el evento
        socketio.emit('borrado_eliminado', {'carrera': carrera, 'caballo': caballo_upper})
        return jsonify({'mensaje': 'Caballo eliminado'}), 200
    else:
        return jsonify({'mensaje': 'Caballo no encontrado en la lista de borrados'}), 404

@app.route('/api/hipodromo', methods=['GET', 'POST'])
def set_hipodromo():
    global hipodromo_actual
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'hipodromo' not in data:
            return jsonify({'error': 'Hipódromo no proporcionado'}), 400

        hipodromo_actual = data['hipodromo']
        # Emitir el hipódromo actualizado a todos los clientes
        socketio.emit('hipodromo_actualizado', hipodromo_actual)
        return jsonify({'mensaje': 'Hipódromo actualizado', 'hipodromo': hipodromo_actual}), 200
    elif request.method == 'GET':
        # Devolver el hipódromo actual
        return jsonify({'hipodromo': hipodromo_actual})


@app.route('/api/pista', methods=['GET', 'POST'])
def set_pista():
    global pista_actual
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'pista' not in data:
            return jsonify({'error': 'Tipo de pista no proporcionado'}), 400

        pista_actual = data['pista']
        # Emitir la pista actualizada a todos los clientes
        socketio.emit('pista_actualizada', pista_actual)
        return jsonify({'mensaje': 'Tipo de pista actualizado', 'pista': pista_actual}), 200
    elif request.method == 'GET':
        # Devolver la pista actual
        return jsonify({'pista': pista_actual})


@app.route('/api/carrera_base', methods=['GET', 'POST'])
def manejar_carrera_base():
    global carrera_base
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'carrera_base' not in data:
            return jsonify({'error': 'Número de carrera base no proporcionado'}), 400
        
        nueva_carrera_base = int(data['carrera_base'])
        if nueva_carrera_base < 1:
            return jsonify({'error': 'La carrera base no puede ser menor a 1'}), 400
            
        carrera_base = nueva_carrera_base
        # Emitir la carrera base actualizada a todos los clientes
        socketio.emit('carrera_base_actualizada', carrera_base)
        return jsonify({'mensaje': 'Carrera base actualizada', 'carrera_base': carrera_base}), 200
    elif request.method == 'GET':
        # Devolver la carrera base actual
        return jsonify({'carrera_base': carrera_base})

# NUEVO ENDPOINT para la sección "Ojo con este..."
@app.route('/api/ojo_con_este', methods=['GET', 'POST', 'DELETE'])
def manejar_ojo_con_este():
    global ojo_carrera, ojo_caballo

    if request.method == 'POST':
        data = request.get_json()
        # Permitir que los campos estén vacíos para "limpiar" la advertencia
        if data and data.get('carrera') == "" and data.get('caballo') == "":
            ojo_carrera = None
            ojo_caballo = None
            # Emitir la actualización para limpiar la advertencia
            socketio.emit('ojo_con_este_actualizado', {'carrera': ojo_carrera, 'caballo': ojo_caballo})
            return jsonify({'mensaje': 'Advertencia "Ojo con este" limpia'}), 200

        if not data or 'carrera' not in data or 'caballo' not in data:
            return jsonify({'error': 'Datos de "Ojo con este" incompletos'}), 400
        
        # Validar que carrera sea un número y caballo no esté vacío
        try:
            num_carrera = int(data['carrera'])
            if num_carrera < 1:
                return jsonify({'error': 'El número de carrera "Ojo con este" debe ser positivo'}), 400
        except ValueError:
            return jsonify({'error': 'Carrera "Ojo con este" debe ser un número válido'}), 400

        if not data['caballo'].strip():
            return jsonify({'error': 'El caballo "Ojo con este" no puede estar vacío'}), 400

        ojo_carrera = num_carrera
        # Normalizar el caballo (quitar espacios y convertir a mayúsculas)
        ojo_caballo = data['caballo'].replace(' ', '').upper() 
        
        # Emitir la actualización de "Ojo con este" a todos los clientes
        socketio.emit('ojo_con_este_actualizado', {'carrera': ojo_carrera, 'caballo': ojo_caballo})
        return jsonify({'mensaje': '"Ojo con este" actualizado', 'carrera': ojo_carrera, 'caballo': ojo_caballo}), 200
    
    elif request.method == 'GET':
        # Devolver el estado actual de "Ojo con este"
        return jsonify({'carrera': ojo_carrera, 'caballo': ojo_caballo})

    elif request.method == 'DELETE': # Opción para limpiar explícitamente la advertencia
        ojo_carrera = None
        ojo_caballo = None
        # Emitir la actualización para limpiar la advertencia
        socketio.emit('ojo_con_este_actualizado', {'carrera': ojo_carrera, 'caballo': ojo_caballo})
        return jsonify({'mensaje': 'Advertencia "Ojo con este" limpia'}), 200


# Manejador de eventos para conexiones de Socket.IO
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado:', request.sid)
    # Al conectarse, enviar el estado actual de todas las variables globales
    socketio.emit('carrera_base_actualizada', carrera_base)
    socketio.emit('hipodromo_actualizado', hipodromo_actual)
    socketio.emit('pista_actualizada', pista_actual)
    socketio.emit('horario_actualizado', horario_proxima)
    socketio.emit('borrados_iniciales', borrados)
    # Enviar el estado inicial de "Ojo con este..."
    socketio.emit('ojo_con_este_actualizado', {'carrera': ojo_carrera, 'caballo': ojo_caballo})

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado:', request.sid)

if __name__ == '__main__':
    # Se añade un bloque try-except para manejar posibles errores al iniciar el servidor
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")
