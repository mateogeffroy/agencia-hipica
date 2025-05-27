import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import baseURL from './config';

const socket = io(`${baseURL}`);

function Televisor() {
  const [borrados, setBorrados] = useState([]);
  const [hipodromo, setHipodromo] = useState('San Isidro');
  const [pista, setPista] = useState('cesped');
  const [carreraBase, setCarreraBase] = useState(1);

  // ESTADOS para la sección "Ojo con este..."
  const [carreraOjo, setCarreraOjo] = useState(null);
  const [caballoOjo, setCaballoOjo] = useState(null);
  // Removed imagenCaballoOjoError state as it was not being fully utilized for conditional rendering
  // and would complicate the renderCaballos function without a significant refactor.

  const obtenerDatosIniciales = async () => {
    try {
      const [borradosRes, hipodromoRes, pistaRes, carreraBaseRes, ojoConEsteRes] = await Promise.all([
        axios.get(`${baseURL}/api/borrados`),
        axios.get(`${baseURL}/api/hipodromo`).catch(() => ({ data: { hipodromo: 'San Isidro' } })),
        axios.get(`${baseURL}/api/pista`).catch(() => ({ data: { pista: 'cesped' } })),
        axios.get(`${baseURL}/api/carrera_base`).catch(() => ({ data: { carrera_base: 1 } })),
        axios.get(`${baseURL}/api/ojo_con_este`).catch(() => ({ data: { carrera: null, caballo: null } }))
      ]);
      setBorrados(borradosRes.data);
      setHipodromo(hipodromoRes.data?.hipodromo || 'San Isidro');
      setPista(pistaRes.data?.pista || 'cesped');
      setCarreraBase(carreraBaseRes.data?.carrera_base || 1);
      setCarreraOjo(ojoConEsteRes.data?.carrera || null);
      setCaballoOjo(ojoConEsteRes.data?.caballo || null);
    } catch (error) {
      console.log('Error al obtener datos iniciales:', error);
    }
  };

  useEffect(() => {
    obtenerDatosIniciales();

    socket.on('nuevo_borrado', (data) => {
      setBorrados((prev) => {
        const exists = prev.some(item => item.carrera === data.carrera && item.caballo === data.caballo);
        return exists ? prev : [...prev, data];
      });
    });

    socket.on('borrado_eliminado', ({ carrera, caballo }) => {
      setBorrados((prev) =>
        prev.filter(item => !(item.carrera === carrera && item.caballo === caballo))
      );
    });

    socket.on('lista_reiniciada', () => {
      setBorrados([]);
    });

    socket.on('hipodromo_actualizado', (nuevoHipodromo) => {
      setHipodromo(nuevoHipodromo);
    });

    socket.on('pista_actualizada', (nuevaPista) => {
      setPista(nuevaPista);
    });

    socket.on('carrera_base_actualizada', (nuevaCarreraBase) => {
      console.log('Carrera base actualizada:', nuevaCarreraBase);
      setCarreraBase(nuevaCarreraBase);
    });

    // Evento de Socket.IO para "Ojo con este..."
    socket.on('ojo_con_este_actualizado', (data) => {
      console.log('"Ojo con este" actualizado desde socket:', data);
      setCarreraOjo(data.carrera || null);
      setCaballoOjo(data.caballo || null);
    });

    socket.on('borrados_iniciales', (initialBorrados) => {
      setBorrados(initialBorrados);
    });

    return () => {
      socket.off('nuevo_borrado');
      socket.off('borrado_eliminado');
      socket.off('lista_reiniciada');
      socket.off('hipodromo_actualizado');
      socket.off('pista_actualizada');
      socket.off('carrera_base_actualizada');
      socket.off('ojo_con_este_actualizado');
      socket.off('borrados_iniciales');
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const agrupadosPorCarrera = borrados.reduce((acc, item) => {
    const numCarrera = item.carrera;
    if (!acc[numCarrera]) acc[numCarrera] = [];
    if (!acc[numCarrera].includes(item.caballo)) {
      acc[numCarrera].push(item.caballo);
    }
    return acc;
  }, {});

  // **FUNCIÓN REUTILIZABLE PARA RENDERIZAR CABALLOS E IMAGENES (UNIFICADO)**
  // Ahora toma un prop `isOjoConEste` para aplicar estilos específicos si es el caballo destacado
  const renderCaballos = (caballos, isOjoConEste = false) => {
    if (!caballos || caballos.length === 0) {
      // Adjusted font size for "Corren todos" to use vmin for better responsiveness
      return <span className={`text-[2.5vmin] sm:text-[3vmin] md:text-[3.5vmin] lg:text-[4vmin] text-center font-semibold ml-2 ${isOjoConEste ? 'text-black' : 'text-white'}`}>Corren todos.</span>;
    }

    // REVERTED: Image sizes to original requested values for "Ojo con este" and kept proportional for others
    const imageSizeClasses = isOjoConEste ?
      'h-[12vmin] w-[12vmin] md:h-[10vmin] md:w-[10vmin] lg:h-[8vmin] lg:w-[8vmin] xl:h-[7vmin] xl:w-[7vmin]' :
      'h-[8vmin] w-[8vmin] md:h-[7vmin] md:w-[7vmin] lg:h-[6vmin] lg:w-[6vmin] xl:h-[5vmin] xl:w-[5vmin]';

    return (
      <div className="flex items-center flex-wrap gap-[1vmin] md:gap-[1.5vmin] ml-[1vmin] md:ml-[1.5vmin]">
        {caballos.map((caballo) => (
          <div
            key={caballo}
            // REVERTED: Removed 'rounded-full' for 'isOjoConEste' condition as it was not in your original
            className={'relative overflow-hidden h-13 w-13'}
          >
            <img
              src={`/${caballo}.png`}
              alt={`Caballo ${caballo}`}
              className={`absolute h-full w-full object-cover scale-150`}
              style={{ objectPosition: 'center center' }}
              onError={(e) => {
                console.warn(`Imagen no encontrada para el caballo: ${caballo}.png`);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const generateRaceRange = (start, count) => {
    return Array.from({ length: count }, (_, i) => start + i);
  };

  const firstColumnRaces = generateRaceRange(carreraBase, 6);
  const secondColumnRaces = generateRaceRange(carreraBase + 6, 6);
  const thirdColumnRaces = generateRaceRange(carreraBase + 12, 6);


  return (
    <div
      className='min-h-screen text-white flex flex-col relative overflow-hidden' // Asegurarse de que overflow-hidden para evitar scrollbars
      style={{
        backgroundImage: "url('/fondo-caballo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md brightness-75"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className='w-full bg-[#2CAF50] text-white py-[2vmin] px-[2vmin] sm:py-[1.5vmin] sm:px-[1.5vmin] shadow-md'>
          <div className='flex flex-row items-center justify-between w-full flex-wrap gap-[1vmin]'> {/* Added flex-wrap and gap */}

            {/* Hipódromo */}
            <div className='bg-[#0067A3] px-[2vmin] py-[1vmin] rounded-xl text-[2.2vmin] sm:text-[2.5vmin] md:text-[3vmin] font-bold flex items-center justify-center whitespace-nowrap'>
              Hipódromo: {hipodromo}
            </div>

            {/* Imagen + Título */}
            <div className='flex flex-row items-center gap-[1.5vmin] sm:gap-[2vmin] text-center flex-wrap justify-center'> {/* Added flex-wrap and justify-center */}
              <img
                src="/pngwing.com.png"
                alt="Logo"
                className='h-[8vmin] w-[8vmin] sm:h-[9vmin] sm:w-[9vmin] rounded-full object-contain'
              />
              <h1 className='text-[3.5vmin] sm:text-[4vmin] md:text-[4.5vmin] font-extrabold whitespace-nowrap'>
                Hípica - Calle 13 esquina 520
              </h1>
            </div>

            {/* Pista */}
            <div className='bg-[#0067A3] px-[2vmin] py-[1vmin] rounded-xl text-[2.2vmin] sm:text-[2.5vmin] md:text-[3vmin] font-bold flex items-center justify-center whitespace-nowrap'>
              Pista de {pista}
            </div>

          </div>
        </header>

        {/* Main content - Contenedor principal que se expande */}
        <main className='flex-1 flex flex-col'> {/* Padding con vmin */}

          {/* Adjusted padding for "Caballos Borrados" */}
          <h1 className='text-[5vmin] sm:text-[5.5vmin] md:text-[6vmin] font-extrabold text-center mt-[0.5vmin] mb-[0.5vmin] tracking-wide'>Caballos Borrados</h1>
          {/* Three equal-width columns container */}
          <div className='flex-1 grid grid-cols-1 md:grid-cols-3 gap-[1vmin] p-[1vmin]'> {/* Gap y padding con vmin */}
            {/* Columns (races 1-18) */}
            {[firstColumnRaces, secondColumnRaces, thirdColumnRaces].map((races, colIndex) => (
              <div key={colIndex} className='flex flex-col gap-[1vmin]'> {/* Gap con vmin */}
                {races.map((carrera) => {
                  const caballos = agrupadosPorCarrera[carrera];
                  return (
                    <div key={carrera} className='bg-gray-700 rounded-lg p-[1vmin] flex items-center border-[0.4vmin] border-black' style={{ minHeight: '10vmin' }}> {/* Borde y minHeight con vmin */}
                      <div className="flex items-center gap-[1.5vmin] w-full"> {/* Gap con vmin, w-full para distribución */}
                        <span className="font-bold text-[4.5vmin] sm:text-[5vmin] md:text-[4.5vmin]">{carrera}</span> {/* Tamaño de texto con vmin */}
                        {renderCaballos(caballos)} {/* Usar la función renderCaballos unificada */}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sección "Ojo con este..." (aparece solo si hay datos) */}
          {(carreraOjo && caballoOjo) && (
            <div className='bg-yellow-500/90 text-black
                            mx-auto mb-[2vmin] p-[2vmin] md:p-[3vmin]
                            rounded-lg shadow-xl h-15
                            flex flex-col md:flex-row items-center justify-center gap-[2vmin] md:gap-[3vmin]'>
              <p className='text-4xl font-extrabold text-center whitespace-nowrap leading-tight'>
                ¡Ojo con este!
              </p>
              <div className="flex items-center gap-[2vmin] md:gap-[2.5vmin]">
                <span className="text-4xl font-extrabold text-white bg-gray-700 rounded-lg p-1 flex items-center border-[0.4vmin] border-black">Carrera {carreraOjo}</span>
                {/* Ensure the 'Ojo con este' horse image is rendered with its specific sizing and NO rounded-full */}
                {renderCaballos([caballoOjo], true)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Televisor;