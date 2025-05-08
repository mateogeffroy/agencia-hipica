import subprocess
import os
import platform

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
frontend_dir = os.path.join(base_dir, 'frontend')

def install_dependencies_backend(cwd):
    system = platform.system()

    if system == 'Windows':
        subprocess.Popen(
            f'start cmd /K "cd /D {cwd} && pip install virtualenv && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements.txt"',
            shell=True
        )
    elif system == 'Darwin':  # macOS
        # Crear venv, activarlo e instalar dependencias
        subprocess.Popen(
            f"""
            cd {cwd} && 
            python3 -m venv venv && 
            source venv/bin/activate && 
            pip install --upgrade pip && 
            pip install -r requirements.txt
            """,
            shell=True,
            executable='/bin/zsh'  # Usa '/bin/bash' si es necesario
        )
    else:
        print("Sistema no compatible. Solo se admite Windows y macOS.")

def install_dependencies_frontend(cwd):
    system = platform.system()

    if system == 'Windows':
        subprocess.Popen(
            f'start cmd /K "cd /D {cwd} && npm install"',
            shell=True
        )
    elif system == 'Darwin':  # macOS
        # Instalar dependencias de frontend con npm
        subprocess.Popen(
            f"cd {cwd} && npm install",
            shell=True,
            executable='/bin/zsh'  # Usa '/bin/bash' si es necesario
        )
    else:
        print("Sistema no compatible. Solo se admite Windows y macOS.")

def install_dependencies():
    install_dependencies_backend(backend_dir)
    install_dependencies_frontend(frontend_dir)

if __name__ == '__main__':
    install_dependencies()