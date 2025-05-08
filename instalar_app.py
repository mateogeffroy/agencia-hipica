import subprocess
import os
import platform
import time
import ctypes  # Para el message box en Windows
from tkinter import messagebox  # Para el message box en macOS/Linux

base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'backend')
frontend_dir = os.path.join(base_dir, 'frontend')

def show_success_message():
    """Muestra un mensaje emergente de éxito"""
    if platform.system() == 'Windows':
        ctypes.windll.user32.MessageBoxW(0, "Proyecto instalado con éxito", "Éxito", 0x40)
    else:
        try:
            messagebox.showinfo("Éxito", "Proyecto instalado con éxito")
        except:
            print("\nProyecto instalado con éxito\n")

def install_dependencies_backend(cwd):
    system = platform.system()

    if system == 'Windows':
        # Usamos /C para que la consola se cierre después
        subprocess.Popen(
            f'cmd /C "cd /D {cwd} && pip install virtualenv && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements.txt"',
            shell=True
        )
    elif system == 'Darwin':  # macOS
        # Comando que se ejecuta y termina
        subprocess.Popen(
            f"""
            cd {cwd} && 
            python3 -m venv venv && 
            source venv/bin/activate && 
            pip install --upgrade pip && 
            pip install -r requirements.txt
            """,
            shell=True,
            executable='/bin/zsh'
        )
    else:
        print("Sistema no compatible. Solo se admite Windows y macOS.")

def install_dependencies_frontend(cwd):
    system = platform.system()

    if system == 'Windows':
        # Usamos /C para que la consola se cierre después
        subprocess.Popen(
            f'cmd /C "cd /D {cwd} && npm install"',
            shell=True
        )
    elif system == 'Darwin':  # macOS
        # Comando que se ejecuta y termina
        subprocess.Popen(
            f"cd {cwd} && npm install",
            shell=True,
            executable='/bin/zsh'
        )
    else:
        print("Sistema no compatible. Solo se admite Windows y macOS.")

def install_dependencies():
    # Instalar dependencias
    install_dependencies_backend(backend_dir)
    install_dependencies_frontend(frontend_dir)
    
    # Esperar un tiempo razonable para que se completen las instalaciones
    time.sleep(10)
    
    # Mostrar mensaje de éxito
    show_success_message()

if __name__ == '__main__':
    install_dependencies()