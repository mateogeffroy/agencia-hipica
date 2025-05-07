import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import baseURL from './config'

const socket = io(`${baseURL}`)

function Televisor() {
  const [borrados, setBorrados] = useState([])
  const [horario, setHorario] = useState('')

  const obtenerDatos = async () => {
    try {
      const [borradosRes, horarioRes] = await Promise.all([
        axios.get(`${baseURL}/api/borrados`),
        axios.get(`${baseURL}/api/horario`)
      ])
      setBorrados(borradosRes.data)
      setHorario(horarioRes.data?.horario || '')
    } catch (error) {
      console.log('Error al obtener datos')
    }
  }

  useEffect(() => {
    obtenerDatos()

    socket.on('nuevo_borrado', (data) => {
      setBorrados((prev) => [...prev, data])
    })

    socket.on('horario_actualizado', (nuevoHorario) => {
      setHorario(nuevoHorario)
    })

    return () => {
      socket.off('nuevo_borrado')
      socket.off('horario_actualizado')
    }
  }, [])

  const agrupadosPorCarrera = borrados.reduce((acc, item) => {
    const numCarrera = item.carrera
    if (!acc[numCarrera]) {
      acc[numCarrera] = []
    }
    if (!acc[numCarrera].includes(item.caballo)) {
      acc[numCarrera].push(item.caballo)
    }
    return acc
  }, {})

  return (
    <div className='min-h-screen bg-[#0067A3] text-white'>
      <header className='w-full bg-[#2CAF50] text-white py-4 px-4 shadow-md'>
        <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
          <img src="../public/logo.png" alt="Logo" className='h-16 md:h-20' />
          <div className='text-center'>
            <b><p className='text-sm md:text-base mt-1'>Agencia Hípica - Av. 520 y Av. Centenario.</p></b>
            <h1 className='text-3xl md:text-5xl font-bold'>Caballos Borrados</h1>
          </div>
        </div>
      </header>

      <main className='mt-6 md:mt-10 px-4'>
        {/* Lista de caballos borrados */}
        <div className='max-w-2xl mx-auto'>
          {Object.entries(agrupadosPorCarrera).length > 0 ? (
            Object.entries(agrupadosPorCarrera).map(([carrera, caballos]) => (
              <div key={carrera} className='bg-white/10 rounded-lg p-4 mb-4 text-center'>
                <p className='text-2xl md:text-3xl font-bold'>
                  {carrera}) <span className='font-normal'>{caballos.join(' - ')}</span>
                </p>
              </div>
            ))
          ) : (
            <div className='bg-white/10 rounded-lg p-8 text-center'>
              <p className='text-xl md:text-2xl'>No hay caballos borrados en las carreras de hoy.</p>
            </div>
          )}
        </div>
      </main>
        {/* Sección de horario */}
        {horario && (
          <div className='max-w-2xl mx-auto bg-[#2CAF50] rounded-lg p-3 mb-6 text-center'>
            <h2 className='text-xl md:text-2xl font-semibold'>Próxima carrera</h2>
            <p className='text-2xl md:text-3xl font-bold'>{horario}</p>
          </div>
        )}
    </div>
  )
}

export default Televisor