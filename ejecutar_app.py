import subprocess
import os
import platform
import sys
import time
import socket

def limpiar_consola():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_base_dir():
    """Obtiene el directorio base de forma confiable para la app empaquetada"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    """Obtiene la IP local para acceso desde otros dispositivos"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('8.8.8.8', 80))
            return s.getsockname()[0]
    except:
        return '127.0.0.1'

def run_in_window(command, cwd, title):
    """Ejecuta un comando en una nueva ventana"""
    try:
        if platform.system() == 'Windows':
            # Crear archivo .bat temporal
            bat_content = f'@echo off\ntitle {title}\ncd /D "{cwd}"\n'
            
            if 'python' in command.lower():
                bat_content += 'call venv\\Scripts\\activate\n'
            
            bat_content += f'{command}\npause'
            
            bat_file = os.path.join(cwd, f'{title.replace(" ", "_")}.bat')
            with open(bat_file, 'w') as f:
                f.write(bat_content)
            
            subprocess.Popen(f'start cmd /k "{bat_file}"', shell=True)
            return True
            
        elif platform.system() == 'Darwin':  # macOS
            script = f'''
            tell application "Terminal"
                do script "cd \\"{cwd}\\" && {'source venv/bin/activate && ' if 'python' in command.lower() else ''}{command}"
                activate
            end tell
            '''
            subprocess.Popen(['osascript', '-e', script])
            return True
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    base_dir = get_base_dir()
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')
    
    # Verificar que existen los directorios
    if not os.path.exists(backend_dir) or not os.path.exists(frontend_dir):
        input("Error: No se encontraron los directorios backend o frontend\nPresione Enter para salir...")
        return
    print("="*52)
    print("Iniciando Aplicacion")
    print("="*52)
    # Configurar comandos según el sistema operativo
    backend_cmd = 'python app.py' if platform.system() == 'Windows' else 'python3 app.py'
    frontend_cmd = 'npm run dev -- --host'
    
    # Iniciar backend
    print("\nIniciando backend...")
    if run_in_window(backend_cmd, backend_dir, "Backend Server"):
        print("Backend iniciado correctamente")
        time.sleep(2)
    else:
        print("Error al iniciar backend")
        time.sleep(2)
    
    # Pequeña pausa para evitar conflictos
    time.sleep(2)
    
    # Iniciar frontend
    print("\nIniciando frontend...")
    if run_in_window(frontend_cmd, frontend_dir, "Frontend Server"):
        print("Frontend iniciado correctamente")
        time.sleep(2)
    else:
        print("Error al iniciar frontend")
        time.sleep(2)
    
    # Mostrar información de acceso
    ip = get_local_ip()
    limpiar_consola()
    print("="*52)
    print(f"Acceso desde otros dispositivos:")
    print("="*52)
    print(f"Telefono: http://{ip}:5173/admin")
    print(f"Televisor: http://{ip}:5173/televisor")
    input("\nNo cerrar esta ventana durante el uso del sistema.")

if __name__ == '__main__':
    main()