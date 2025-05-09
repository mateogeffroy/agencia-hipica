import subprocess
import os
import platform
import sys
import tempfile
import time

def get_base_dir():
    """Obtiene el directorio base de forma confiable"""
    if getattr(sys, '_MEIPASS', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def run_process(command, cwd=None):
    """Ejecuta un proceso y muestra la salida"""
    try:
        process = subprocess.Popen(
            command,
            cwd=cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        return process.returncode
    except Exception as e:
        print(f"Error: {e}")
        return 1

def install_backend():
    """Instala dependencias del backend"""
    print("\nInstalando backend...")
    backend_dir = os.path.join(get_base_dir(), 'backend')
    
    if not os.path.exists(os.path.join(backend_dir, 'requirements.txt')):
        print("Error: No se encontró requirements.txt")
        return False
    
    if platform.system() == 'Windows':
        commands = [
            'python -m pip install --upgrade pip',
            'python -m venv venv',
            f'call venv\\Scripts\\activate && pip install -r requirements.txt'
        ]
    else:
        commands = [
            'python3 -m pip install --upgrade pip',
            'python3 -m venv venv',
            f'source venv/bin/activate && pip install -r requirements.txt'
        ]
    
    for cmd in commands:
        if run_process(cmd, backend_dir) != 0:
            return False
    return True

def install_frontend():
    """Instala dependencias del frontend"""
    print("\nInstalando frontend...")
    frontend_dir = os.path.join(get_base_dir(), 'frontend')
    
    if not os.path.exists(os.path.join(frontend_dir, 'package.json')):
        print("Error: No se encontró package.json")
        return False
    
    return run_process('npm install', frontend_dir) == 0

def main():
    print("=== Instalador de Dependencias ===")
    
    # Instalar backend y frontend
    backend_ok = install_backend()
    frontend_ok = install_frontend()
    
    if backend_ok and frontend_ok:
        print("\n✅ Instalación completada con éxito!")
    else:
        print("\n❌ Hubo errores durante la instalación")
    
    input("\nPresione Enter para salir...")

if __name__ == '__main__':
    main()