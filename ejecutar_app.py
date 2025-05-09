import subprocess 
import os
import platform
import sys

def get_base_dir():
    """Obtiene el directorio base de forma confiable"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

base_dir = get_base_dir()
backend_dir = os.path.join(base_dir, 'backend')
frontend_dir = os.path.join(base_dir, 'frontend')

def run_command_in_new_terminal(command, cwd):
    system = platform.system()
    normalized_cwd = os.path.normpath(cwd)
    
    try:
        if system == 'Windows':
            if 'python' in command:
                # Backend: activar venv primero
                activate_path = os.path.join(normalized_cwd, 'venv', 'Scripts', 'activate')
                full_cmd = f'cmd /k "cd /D "{normalized_cwd}" && call "{activate_path}" && {command}"'
            else:
                # Frontend
                full_cmd = f'cmd /k "cd /D "{normalized_cwd}" && {command}"'
            
            subprocess.Popen(full_cmd, shell=True)
            
        elif system == 'Darwin':  # macOS
            if 'python' in command:
                # Backend: activar venv primero
                activate_path = os.path.join(normalized_cwd, 'venv', 'bin', 'activate')
                full_cmd = f'cd "{normalized_cwd}"; source "{activate_path}"; {command}'
            else:
                # Frontend
                full_cmd = f'cd "{normalized_cwd}"; {command}'
            
            apple_script = f'''
            tell application "Terminal"
                do script "{full_cmd}"
                activate
            end tell
            '''
            subprocess.Popen(['osascript', '-e', apple_script])
            
        elif system == 'Linux':
            # Similar a macOS pero podrías usar xterm o gnome-terminal
            print("Linux support needs to be implemented")
            return False
            
    except Exception as e:
        print(f"Error al ejecutar comando en nueva terminal: {e}")
        return False
    
    return True

def start_servers():
    system = platform.system()
    
    # Comandos según el sistema operativo
    backend_command = 'python app.py' if system == 'Windows' else 'python3 app.py'
    frontend_command = 'npm run dev -- --host'
    
    # Verificar que los directorios existen
    if not os.path.exists(backend_dir) or not os.path.exists(frontend_dir):
        print("Error: No se encontraron los directorios backend o frontend")
        return False
    
    # Ejecutar backend
    if not run_command_in_new_terminal(backend_command, backend_dir):
        print("Error al iniciar el backend")
        return False
    
    # Ejecutar frontend
    if not run_command_in_new_terminal(frontend_command, frontend_dir):
        print("Error al iniciar el frontend")
        return False
    
    print("Servidores iniciados correctamente")
    return True

if __name__ == '__main__':
    start_servers()