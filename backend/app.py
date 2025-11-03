import eventlet
eventlet.monkey_patch()

import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

db_url = os.environ.get('DATABASE_URL')
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
FRONTEND_URL = "https://agencia-hipica.vercel.app" 

CORS(app, resources={
    r"/api/*": {"origins": FRONTEND_URL}
})

socketio = SocketIO(app, cors_allowed_origins=[FRONTEND_URL], ping_timeout=60)

class Borrados(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    carrera = db.Column(db.Integer, nullable=False)
    caballo = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {'carrera': self.carrera, 'caballo': self.caballo}

class EstadoApp(db.Model):
    id = db.Column(db.Integer, primary_key=True, default=1)
    horario_proxima = db.Column(db.String(100), default="")
    hipodromo_actual = db.Column(db.String(100), default="San Isidro")
    pista_actual = db.Column(db.String(100), default="cesped")
    carrera_base = db.Column(db.Integer, default=1)
    ojo_carrera = db.Column(db.Integer, nullable=True)
    ojo_caballo = db.Column(db.String(10), nullable=True)

def get_estado():
    estado = db.session.get(EstadoApp, 1)
    if not estado:
        estado = EstadoApp(id=1)
        db.session.add(estado)
        db.session.commit()
    return estado

@app.route('/api/borrados', methods=['GET', 'POST', 'DELETE'])
def manejar_borrados():
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'carrera' not in data or 'caballo' not in data:
            return jsonify({'error': 'Datos incompletos'}), 400
            
        carrera_num = int(data['carrera'])
        nuevo_borrado_db = Borrados(carrera=carrera_num, caballo=data['caballo'])
        db.session.add(nuevo_borrado_db)
        db.session.commit()
        
        socketio.emit('nuevo_borrado', data)
        return jsonify({'mensaje': 'Borrado agregado'}), 201
        
    elif request.method == 'GET':
        borrados_db = Borrados.query.all()
        borrados_lista = [b.to_dict() for b in borrados_db]
        return jsonify(borrados_lista)
        
    elif request.method == 'DELETE':
        try:
            db.session.query(Borrados).delete()
            db.session.commit()
            socketio.emit('lista_reiniciada', {'mensaje': 'Lista de borrados reiniciada'})
            return jsonify({'mensaje': 'Lista de borrados reiniciada'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/horario', methods=['GET', 'POST'])
def manejar_horario():
    estado = get_estado()
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'horario' not in data:
            return jsonify({'error': 'Horario no proporcionado'}), 400
            
        estado.horario_proxima = data['horario']
        db.session.commit()
        socketio.emit('horario_actualizado', estado.horario_proxima)
        return jsonify({'mensaje': 'Horario actualizado', 'horario': estado.horario_proxima}), 200
        
    elif request.method == 'GET':
        return jsonify({'horario': estado.horario_proxima})
    
@app.route('/api/borrados/<int:carrera>', methods=['GET'])
def obtener_borrados_por_carrera(carrera):
    borrados_db = Borrados.query.filter_by(carrera=carrera).all()
    caballos = [b.caballo for b in borrados_db]
    return jsonify(caballos)

@app.route('/api/borrados/<int:carrera>/<string:caballo>', methods=['DELETE'])
def eliminar_caballo_de_carrera(carrera, caballo):
    caballo_upper = caballo.upper()
    borrado_item = Borrados.query.filter_by(carrera=carrera, caballo=caballo_upper).first()

    if borrado_item:
        db.session.delete(borrado_item)
        db.session.commit()
        socketio.emit('borrado_eliminado', {'carrera': carrera, 'caballo': caballo_upper})
        return jsonify({'mensaje': 'Caballo eliminado'}), 200
    else:
        return jsonify({'mensaje': 'Caballo no encontrado'}), 404

@app.route('/api/hipodromo', methods=['GET', 'POST'])
def set_hipodromo():
    estado = get_estado()
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'hipodromo' not in data:
            return jsonify({'error': 'Hipódromo no proporcionado'}), 400

        estado.hipodromo_actual = data['hipodromo']
        db.session.commit()
        socketio.emit('hipodromo_actualizado', estado.hipodromo_actual)
        return jsonify({'mensaje': 'Hipódromo actualizado', 'hipodromo': estado.hipodromo_actual}), 200
    elif request.method == 'GET':
        return jsonify({'hipodromo': estado.hipodromo_actual})

@app.route('/api/pista', methods=['GET', 'POST'])
def set_pista():
    estado = get_estado()
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'pista' not in data:
            return jsonify({'error': 'Tipo de pista no proporcionado'}), 400

        estado.pista_actual = data['pista']
        db.session.commit()
        socketio.emit('pista_actualizada', estado.pista_actual)
        return jsonify({'mensaje': 'Tipo de pista actualizado', 'pista': estado.pista_actual}), 200
    elif request.method == 'GET':
        return jsonify({'pista': estado.pista_actual})

@app.route('/api/carrera_base', methods=['GET', 'POST'])
def manejar_carrera_base():
    estado = get_estado()
    if request.method == 'POST':
        data = request.get_json()
        if not data or 'carrera_base' not in data:
            return jsonify({'error': 'Número de carrera base no proporcionado'}), 400
        
        nueva_carrera_base = int(data['carrera_base'])
        if nueva_carrera_base < 1:
            return jsonify({'error': 'La carrera base no puede ser menor a 1'}), 400
            
        estado.carrera_base = nueva_carrera_base
        db.session.commit()
        socketio.emit('carrera_base_actualizada', estado.carrera_base)
        return jsonify({'mensaje': 'Carrera base actualizada', 'carrera_base': estado.carrera_base}), 200
    elif request.method == 'GET':
        return jsonify({'carrera_base': estado.carrera_base})

@app.route('/api/ojo_con_este', methods=['GET', 'POST', 'DELETE'])
def manejar_ojo_con_este():
    estado = get_estado()
    if request.method == 'POST':
        data = request.get_json()
        if data and data.get('carrera') == "" and data.get('caballo') == "":
            estado.ojo_carrera = None
            estado.ojo_caballo = None
        else:
            if not data or 'carrera' not in data or 'caballo' not in data:
                return jsonify({'error': 'Datos incompletos'}), 400
            try:
                estado.ojo_carrera = int(data['carrera'])
                if estado.ojo_carrera < 1:
                    return jsonify({'error': 'El número de carrera debe ser positivo'}), 400
            except ValueError:
                return jsonify({'error': 'Carrera debe ser un número válido'}), 400
            if not data['caballo'].strip():
                return jsonify({'error': 'El caballo no puede estar vacío'}), 400
            estado.ojo_caballo = data['caballo'].replace(' ', '').upper() 
        
        db.session.commit()
        socketio.emit('ojo_con_este_actualizado', {'carrera': estado.ojo_carrera, 'caballo': estado.ojo_caballo})
        return jsonify({'mensaje': '"Ojo con este" actualizado'}), 200
    
    elif request.method == 'GET':
        return jsonify({'carrera': estado.ojo_carrera, 'caballo': estado.ojo_caballo})

    elif request.method == 'DELETE':
        estado.ojo_carrera = None
        estado.ojo_caballo = None
        db.session.commit()
        socketio.emit('ojo_con_este_actualizado', {'carrera': None, 'caballo': None})
        return jsonify({'mensaje': 'Advertencia "Ojo con este" limpia'}), 200

@app.route('/api/master-reset', methods=['POST'])
def master_reset():
    try:
        db.session.query(Borrados).delete()
        
        estado = get_estado()
        estado.horario_proxima = ""
        estado.hipodromo_actual = ""
        estado.pista_actual = ""
        estado.carrera_base = 1
        estado.ojo_carrera = None
        estado.ojo_caballo = None
        
        db.session.commit()

        socketio.emit('lista_reiniciada', {'mensaje': 'Sistema reseteado'})
        socketio.emit('horario_actualizado', estado.horario_proxima)
        socketio.emit('hipodromo_actualizado', estado.hipodromo_actual)
        socketio.emit('pista_actualizada', estado.pista_actual)
        socketio.emit('carrera_base_actualizada', estado.carrera_base)
        socketio.emit('ojo_con_este_actualizado', {'carrera': None, 'caballo': None})

        print("¡¡¡ ALERTA: Se ejecutó un reseteo maestro de la BASE DE DATOS !!!")
        return jsonify({'mensaje': 'Sistema reseteado a valores por defecto'}), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error en master-reset: {e}")
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    print('Cliente conectado:', request.sid)
    estado = get_estado()
    borrados_db = Borrados.query.all()
    borrados_lista = [b.to_dict() for b in borrados_db]

    socketio.emit('carrera_base_actualizada', estado.carrera_base, to=request.sid)
    socketio.emit('hipodromo_actualizado', estado.hipodromo_actual, to=request.sid)
    socketio.emit('pista_actualizada', estado.pista_actual, to=request.sid)
    socketio.emit('horario_actualizado', estado.horario_proxima, to=request.sid)
    socketio.emit('borrados_iniciales', borrados_lista, to=request.sid)
    socketio.emit('ojo_con_este_actualizado', {'carrera': estado.ojo_carrera, 'caballo': estado.ojo_caballo}, to=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado:', request.sid)

with app.app_context():
    db.create_all()
    get_estado() 
    print("Base de datos y tablas inicializadas.")

if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")