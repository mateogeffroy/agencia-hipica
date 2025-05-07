import { useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import baseURL from './config'


// Configuración del socket para recibir actualizaciones
const socket = io(`${baseURL}`)

function Admin() {
  const [carrera, setCarrera] = useState('')
  const [caballo, setCaballo] = useState('')
  const [horario, setHorario] = useState('')
  const [estado, setEstado] = useState('') // Para feedback visual

  const enviarBorrado = async () => {
    if (!carrera || !caballo) {
      setEstado('Debe completar ambos campos')
      setTimeout(() => setEstado(''), 3000)
      return
    }

    try {
      await axios.post(`${baseURL}/api/borrados`, {
        carrera,
        caballo
      })
      setCaballo('')
      setEstado('Borrado enviado correctamente')
      setTimeout(() => setEstado(''), 3000)
    } catch (error) {
      setEstado('Error al enviar datos')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  const resetearLista = async () => {
    try {
      await axios.delete(`${baseURL}/api/borrados`)
      setEstado('Lista reiniciada - Verifique pantalla TV')
      setTimeout(() => setEstado(''), 3000)
    } catch (error) {
      setEstado('Error al reiniciar lista')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  const actualizarHorario = async () => {
    if (!horario) {
      setEstado('Ingrese un horario válido')
      setTimeout(() => setEstado(''), 3000)
      return
    }

    try {
      await axios.post(`${baseURL}/api/horario`, { horario })
      setEstado('Horario actualizado - Verifique pantalla TV')
      setTimeout(() => setEstado(''), 3000)
    } catch (error) {
      setEstado('Error al actualizar horario')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Encabezado */}
        <div className="bg-blue-600 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-blue-100">Gestor de caballos borrados</p>
        </div>

        {/* Feedback de estado */}
        {estado && (
          <div className="bg-blue-100 text-blue-800 p-3 text-center">
            {estado}
          </div>
        )}

        {/* Formulario principal */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Número de carrera</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 1"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Caballo borrado</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 5"
                value={caballo}
                onChange={(e) => setCaballo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={enviarBorrado}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-200 flex-1"
            >
              Enviar borrado
            </button>

            <button
              onClick={resetearLista}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-200 flex-1"
            >
              Reiniciar lista completa
            </button>
          </div>
        </div>

        {/* Sección de horario */}
        <div className="bg-gray-50 p-4 md:p-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Configuración de horarios</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Horario próxima carrera</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 14:30"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
            </div>
            <button
              onClick={actualizarHorario}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 self-end md:self-auto mt-2 md:mt-0"
            >
              Actualizar horario
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin