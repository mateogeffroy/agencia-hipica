import subprocess 
import os
import platform

# Rutas absolutas
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
frontend_dir = os.path.join(base_dir, 'frontend')

def run_command_in_new_terminal(command, cwd):
    system = platform.system()

    if system == 'Windows':
        if command=='python app.py':
            subprocess.Popen(f'start cmd /K "cd /D {cwd} && venv\\Scripts\\activate && {command}"', shell=True)
        else:
            subprocess.Popen(f'start cmd /K "cd /D {cwd} && {command}"', shell=True)

    elif system == 'Darwin':  # macOS
        apple_script = f'''
        tell application "Terminal"
            do script "cd \\"{cwd}\\"; source venv/bin/activate; {command}"
            activate
        end tell
        '''
        subprocess.Popen(['osascript', '-e', apple_script])


def start_servers():
    system = platform.system()
    
    # Comando backend según el sistema operativo
    if system == 'Windows':
        backend_command = 'python app.py'
    elif system == 'Darwin':
        backend_command = 'python3 app.py'

    frontend_command = 'npm run dev -- --host'

    # Ejecutar backend
    run_command_in_new_terminal(backend_command, backend_dir)

    # Comando frontend (igual para ambos sistemas operativos)
    run_command_in_new_terminal(frontend_command, frontend_dir)

if __name__ == '__main__':
    start_servers()
