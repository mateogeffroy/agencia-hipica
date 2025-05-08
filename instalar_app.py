import subprocess
import os
import platform
import time
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
frontend_dir = os.path.join(base_dir, 'frontend')

def run_process(command, cwd=None):
    """Ejecuta un proceso y espera a que termine"""
    print(f"Ejecutando: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Mostrar salida en tiempo real
    for line in process.stdout:
        print(line.strip())
    
    # Esperar a que termine el proceso
    process.wait()
    return process.returncode

def install_dependencies_backend(cwd):
    system = platform.system()
    print("\n--- Instalando dependencias del backend ---")
    
    try:
        if system == 'Windows':
            # Crear entorno virtual e instalar dependencias
            run_process(f"pip install virtualenv", cwd=cwd)
            run_process(f"python -m venv venv", cwd=cwd)
            run_process(f"venv\\Scripts\\activate && pip install -r requirements.txt", cwd=cwd)
            return True
            
        elif system == 'Darwin' or system == 'Linux':  # macOS o Linux
            # Crear venv, activarlo e instalar dependencias
            run_process(f"python3 -m venv venv", cwd=cwd)
            run_process(f"source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt", cwd=cwd)
            return True
            
        else:
            print("Sistema no compatible. Solo se admite Windows, macOS y Linux.")
            return False
            
    except Exception as e:
        print(f"Error instalando dependencias del backend: {e}")
        return False

def install_dependencies_frontend(cwd):
    system = platform.system()
    print("\n--- Instalando dependencias del frontend ---")
    
    try:
        # npm install funciona igual en todos los sistemas
        result = run_process("npm install", cwd=cwd)
        return result == 0
        
    except Exception as e:
        print(f"Error instalando dependencias del frontend: {e}")
        return False

def install_dependencies():
    print("Iniciando instalación de dependencias...")
    
    # Verificar que existan los directorios
    if not os.path.exists(backend_dir):
        print(f"Error: No se encontró el directorio backend en {backend_dir}")
        return False
        
    if not os.path.exists(frontend_dir):
        print(f"Error: No se encontró el directorio frontend en {frontend_dir}")
        return False
    
    # Instalar dependencias
    backend_success = install_dependencies_backend(backend_dir)
    frontend_success = install_dependencies_frontend(frontend_dir)
    
    # Verificar resultado
    if backend_success and frontend_success:
        print("\n" + "="*50)
        print("¡PROYECTO INSTALADO CON ÉXITO!")
        print("="*50)
        return True
    else:
        print("\n" + "="*50)
        print("Error en la instalación. Revise los mensajes anteriores.")
        print("="*50)
        return False

if __name__ == '__main__':
    install_dependencies()
    # Esperar 3 segundos antes de cerrar para que se pueda leer el mensaje final
    time.sleep(3)