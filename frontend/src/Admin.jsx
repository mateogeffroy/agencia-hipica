import { useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import baseURL from './config'

const socket = io(`${baseURL}`)

function Admin() {
  const [carrera, setCarrera] = useState('')
  const [caballo, setCaballo] = useState('')
  const [estado, setEstado] = useState('')
  const [hipodromo, setHipodromo] = useState('San Isidro')
  const [pista, setPista] = useState('cesped')

  const enviarBorrado = async () => {
    if (!carrera || !caballo) {
      setEstado('Debe completar ambos campos')
      setTimeout(() => setEstado(''), 3000)
      return
    } else if (isNaN(carrera) || carrera < 1 || carrera > 18) {
      setEstado('El número de carrera debe ser entre 1 y 18')
      setTimeout(() => setEstado(''), 3000)
      return
    } else if (!/^\d{1,2}\s*[a-dA-D]?$/.test(caballo.trim())) {
      setEstado('El formato del caballo debe ser un número (1-18) o número seguido de A-D (ej: 7, 7A)')
      setTimeout(() => setEstado(''), 3000)
      return
    }

    const caballoFormateado = caballo.replace(/\s+/g, '').toUpperCase()

    try {
      await axios.post(`${baseURL}/api/borrados`, {
        carrera,
        caballo: caballoFormateado,
      })
      setCaballo('')
      setEstado('Borrado enviado correctamente')
      setTimeout(() => setEstado(''), 3000)
    } catch (error) {
      setEstado('Error al enviar datos')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  const buscarYEliminarCaballo = async () => {
    if (!carrera || !caballo) {
      setEstado('Debe completar ambos campos')
      setTimeout(() => setEstado(''), 3000)
      return
    } else if (isNaN(carrera) || carrera < 1 || carrera > 18) {
      setEstado('El número de carrera debe ser entre 1 y 18')
      setTimeout(() => setEstado(''), 3000)
      return
    } else if (!/^\d{1,2}\s*[a-dA-D]?$/.test(caballo.trim())) {
      setEstado('El formato del caballo debe ser un número (1-18) o número seguido de A-D (ej: 7, 7A)')
      setTimeout(() => setEstado(''), 3000)
      return
    }

    const caballoFormateado = caballo.replace(/\s+/g, '').toUpperCase()

    try {
      const res = await axios.get(`${baseURL}/api/borrados/${carrera}`)
      const caballosEnCarrera = res.data.map(String)

      if (caballosEnCarrera.includes(caballo)) {
        await axios.delete(`${baseURL}/api/borrados/${carrera}/${caballoFormateado}`)
        setEstado(`Caballo ${caballoFormateado} eliminado de la carrera ${carrera}`)
      } else {
        setEstado(`El caballo ${caballoFormateado} no está en la lista de borrados para la carrera ${carrera}`)
      }

      setCaballo('')
      setTimeout(() => setEstado(''), 3000)
    } catch (error) {
      setEstado('Error al buscar o eliminar el caballo')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  const enviarHipodromo = async () => {
    try {
      await axios.post(`${baseURL}/api/hipodromo`, { hipodromo })
      setEstado(`Hipódromo "${hipodromo}" enviado correctamente`)
      setTimeout(() => setEstado(''), 3000)
    } catch {
      setEstado('Error al enviar hipódromo')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  const enviarPista = async () => {
    try {
      await axios.post(`${baseURL}/api/pista`, { pista })
      setEstado(`Tipo de pista "${pista}" enviado correctamente`)
      setTimeout(() => setEstado(''), 3000)
    } catch {
      setEstado('Error al enviar tipo de pista')
      setTimeout(() => setEstado(''), 3000)
    }
  }

  return (
    <div 
      className="min-h-screen p-4 md:p-8 relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fondo-caballo.jpg')" }}
    >
      {/* Capa de superposición con difuminado */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Contenido principal */}
      <div className="relative z-10 max-w-4xl mx-auto bg-white/90 rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Panel de Administración</h1>
        </div>

        {estado && (
          <div className="bg-blue-100 text-blue-800 p-3 text-center">
            {estado}
          </div>
        )}

        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Número de carrera (1-18)</label>
              <input
                type="number"
                min="1"
                max="18"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Número de caballo (1-18)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              Cargar caballo borrado
            </button>

            <button
              onClick={buscarYEliminarCaballo}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-200 flex-1"
            >
              Eliminar caballo borrado
            </button>
          </div>

          <div className="flex items-center gap-4">
            <select
              className="p-2 border rounded"
              value={hipodromo}
              onChange={(e) => setHipodromo(e.target.value)}
            >
              <option>San Isidro</option>
              <option>Palermo</option>
              <option>La Plata</option>
            </select>
            <button
              onClick={enviarHipodromo}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Enviar Hipódromo
            </button>
          </div>

          <div className="flex items-center gap-4">
            <select
              className="p-2 border rounded"
              value={pista}
              onChange={(e) => setPista(e.target.value)}
            >
              <option>cesped</option>
              <option>arena</option>
            </select>
            <button
              onClick={enviarPista}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
            >
              Enviar Tipo de Pista
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin