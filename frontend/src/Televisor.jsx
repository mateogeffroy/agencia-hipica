import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import baseURL from './config'

const socket = io(`${baseURL}`)

function Televisor() {
  const [borrados, setBorrados] = useState([])
  const [horario, setHorario] = useState('')
  const [hipodromo, setHipodromo] = useState('San Isidro')
  const [pista, setPista] = useState('cesped')

  const obtenerDatos = async () => {
    try {
      const [borradosRes, horarioRes, hipodromoRes, pistaRes] = await Promise.all([
        axios.get(`${baseURL}/api/borrados`),
        axios.get(`${baseURL}/api/horario`),
        axios.get(`${baseURL}/api/hipodromo`).catch(() => ({ data: { hipodromo: 'San Isidro' } })),
        axios.get(`${baseURL}/api/pista`).catch(() => ({ data: { pista: 'cesped' } }))
      ])
      setBorrados(borradosRes.data)
      setHorario(horarioRes.data?.horario || '')
      setHipodromo(hipodromoRes.data?.hipodromo || 'San Isidro')
      setPista(pistaRes.data?.pista || 'cesped')
    } catch (error) {
      console.log('Error al obtener datos')
    }
  }

  useEffect(() => {
    obtenerDatos()

    socket.on('nuevo_borrado', (data) => {
      setBorrados((prev) => [...prev, data])
    })

    socket.on('borrado_eliminado', ({ carrera, caballo }) => {
      setBorrados((prev) =>
        prev.filter(item => !(item.carrera === carrera && item.caballo === caballo))
      )
    })

    socket.on('lista_reiniciada', () => {
      setBorrados([])
    })

    socket.on('horario_actualizado', (nuevoHorario) => {
      setHorario(nuevoHorario)
    })

    socket.on('hipodromo_actualizado', (nuevoHipodromo) => {
      setHipodromo(nuevoHipodromo)
    })

    socket.on('pista_actualizada', (nuevaPista) => {
      setPista(nuevaPista)
    })

    return () => {
      socket.off('nuevo_borrado')
      socket.off('borrado_eliminado')
      socket.off('lista_reiniciada')
      socket.off('horario_actualizado')
      socket.off('hipodromo_actualizado')
      socket.off('pista_actualizada')
    }
  }, [])

  const agrupadosPorCarrera = borrados.reduce((acc, item) => {
    const numCarrera = item.carrera
    if (!acc[numCarrera]) acc[numCarrera] = []
    if (!acc[numCarrera].includes(item.caballo)) {
      acc[numCarrera].push(item.caballo)
    }
    return acc
  }, {})

  // Función para renderizar caballos borrados con imágenes
  const renderCaballosBorrados = (carrera, caballos) => {
    if (!caballos || caballos.length === 0) {
      return <span className="text-4xl text-center font-semibold ml-2">Corren todos.</span>
    }
  
    return (
      <div className="flex items-center flex-wrap gap-3 ml-3">
        {caballos.map((caballo) => (
          <div key={caballo} className="relative h-20 w-20 overflow-hidden">
            <img
              src={`/${caballo}.png`}
              alt={`Caballo ${caballo}`}
              className="absolute h-full w-full object-cover scale-150" // Aumenta el zoom con scale-150
              style={{ objectPosition: 'center center' }} // Asegura que el centro sea el foco
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        ))}
      </div>
    )
  } 

  return (
    <div className='min-h-screen bg-[#0067A3] text-white flex flex-col'>
      {/* Header */}
      <header className='w-full bg-[#2CAF50] text-white py-4 px-4 shadow-md'>
        <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
          <img 
            src="/pngwing.com.png" 
            alt="Logo" 
            className='h-30 w-30 rounded-full object-contain' 
          />
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-center'>
              Hípica - Calle 13 esquina 520
            </h1>
            <p className='text-lg md:text-2xl mt-1'>
              Hipodromo: {hipodromo} - Pista de {pista}
            </p>
          </div>
        </div>
      </header>



      {/* Main content - fills remaining space */}
      <main className='flex-1 flex flex-col'>
        <h1 className='text-3xl md:text-5xl font-bold text-center mt-2 mb-1'>Caballos Borrados</h1>
        {/* Three equal-width columns container */}
        <div className='flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 p-4'>
          {/* Left column (races 1-6) */}
          <div className='flex flex-col gap-2 md:gap-4'>
            {[1, 2, 3, 4, 5, 6].map((carrera) => {
              const caballos = agrupadosPorCarrera[carrera]
              return (
                <div key={carrera} className='bg-gray-700 rounded-lg p-3 flex items-center border-4 border-black h-25'
>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-5xl">{carrera}</span>
                    {renderCaballosBorrados(carrera, caballos)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Center column (races 7-12) */}
          <div className='flex flex-col gap-2 md:gap-4 mt-2 md:mt-0'>
            {[7, 8, 9, 10, 11, 12].map((carrera) => {
              const caballos = agrupadosPorCarrera[carrera]
              return (
                <div key={carrera} className='bg-gray-700 rounded-lg p-3 flex items-center border-4 border-black h-25'
>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-5xl">{carrera}</span>
                    {renderCaballosBorrados(carrera, caballos)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column (races 13-18) */}
          <div className='flex flex-col gap-2 md:gap-4 mt-2 md:mt-0'>
            {[13, 14, 15, 16, 17, 18].map((carrera) => {
              const caballos = agrupadosPorCarrera[carrera]
              return (
                <div key={carrera} className='bg-gray-700 rounded-lg p-3 flex items-center border-4 border-black h-25'
>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-5xl">{carrera}</span>
                    {renderCaballosBorrados(carrera, caballos)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next race section at bottom */}
        {horario && (
          <div className='bg-[#2CAF50] rounded-lg p-3 mx-4 mb-4 text-center'>
            <h2 className='text-xl md:text-2xl font-semibold'>Próxima carrera</h2>
            <p className='text-2xl md:text-3xl font-bold'>{horario}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Televisor