import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import baseURL from './config';

const socket = io(`${baseURL}`);

function Admin() {
  const [carrera, setCarrera] = useState('');
  const [caballo, setCaballo] = useState('');
  const [estado, setEstado] = useState('');
  const [hipodromo, setHipodromo] = useState('San Isidro');
  const [pista, setPista] = useState('cesped');
  const [carreraBase, setCarreraBase] = useState(1);
  
  // NUEVOS ESTADOS para la sección "Ojo con este..."
  const [carreraOjo, setCarreraOjo] = useState('');
  const [caballoOjo, setCaballoOjo] = useState('');

  const obtenerDatosIniciales = async () => {
    try {
      const [hipodromoRes, pistaRes, carreraBaseRes, ojoConEsteRes] = await Promise.all([ // Añadir ojoConEsteRes
        axios.get(`${baseURL}/api/hipodromo`).catch(() => ({ data: { hipodromo: 'San Isidro' } })),
        axios.get(`${baseURL}/api/pista`).catch(() => ({ data: { pista: 'cesped' } })),
        axios.get(`${baseURL}/api/carrera_base`).catch(() => ({ data: { carrera_base: 1 } })),
        axios.get(`${baseURL}/api/ojo_con_este`).catch(() => ({ data: { carrera: '', caballo: '' } })) // Obtener datos de "Ojo con este"
      ]);
      setHipodromo(hipodromoRes.data?.hipodromo || 'San Isidro');
      setPista(pistaRes.data?.pista || 'cesped');
      setCarreraBase(carreraBaseRes.data?.carrera_base || 1);
      // Establecer estados de "Ojo con este"
      setCarreraOjo(ojoConEsteRes.data?.carrera ? String(ojoConEsteRes.data.carrera) : '');
      setCaballoOjo(ojoConEsteRes.data?.caballo || '');

    } catch (error) {
      console.log('Error al obtener datos iniciales del administrador:', error);
    }
  };

  useEffect(() => {
    obtenerDatosIniciales();

    socket.on('carrera_base_actualizada', (nuevaCarreraBase) => {
      console.log('Carrera base actualizada desde socket:', nuevaCarreraBase);
      setCarreraBase(nuevaCarreraBase);
    });

    socket.on('hipodromo_actualizado', (nuevoHipodromo) => {
      setHipodromo(nuevoHipodromo);
    });

    socket.on('pista_actualizada', (nuevaPista) => {
      setPista(nuevaPista);
    });

    // NUEVO EVENTO: Escuchar actualizaciones de "Ojo con este..."
    socket.on('ojo_con_este_actualizado', (data) => {
      console.log('"Ojo con este" actualizado desde socket:', data);
      setCarreraOjo(data.carrera ? String(data.carrera) : '');
      setCaballoOjo(data.caballo || '');
    });

    return () => {
      socket.off('carrera_base_actualizada');
      socket.off('hipodromo_actualizado');
      socket.off('pista_actualizada');
      socket.off('ojo_con_este_actualizado'); // Limpiar el nuevo evento
    };
  }, []);

  const enviarBorrado = async () => {
    if (!carrera || !caballo) {
      setEstado('Debe completar ambos campos de borrado.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }
    const numCarrera = parseInt(carrera);
    if (isNaN(numCarrera) || numCarrera < 1) {
      setEstado('El número de carrera debe ser un número entero positivo.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }
    if (!/^\d{1,2}\s*[a-dA-D]?$/.test(caballo.trim())) {
      setEstado('El formato del caballo debe ser un número (1-18) o número seguido de A-D (ej: 7, 7A).');
      setTimeout(() => setEstado(''), 3000);
      return;
    }

    const caballoFormateado = caballo.replace(/\s+/g, '').toUpperCase();

    try {
      await axios.post(`${baseURL}/api/borrados`, {
        carrera: numCarrera,
        caballo: caballoFormateado,
      });
      setCaballo('');
      setEstado('Borrado enviado correctamente.');
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      setEstado('Error al enviar datos de borrado.');
      setTimeout(() => setEstado(''), 3000);
    }
  };

  const handleMasterReset = async () => {
    const
  confirmado = window.confirm(
      "¿ESTÁS SEGURO?\n\nEsto borrará TODOS los caballos, el hipódromo y la pista. La acción no se puede deshacer."
    );

    if (confirmado) {
      try {
        await axios.post(`${baseURL}/api/master-reset`);
        setEstado('¡SISTEMA RESETEADO CORRECTAMENTE!');

        // También reseteamos los inputs locales del admin
        setCarrera('');
        setCaballo('');
        setCarreraOjo('');
        setCaballoOjo('');

        setTimeout(() => setEstado(''), 4000);
      } catch (error) {
        setEstado('Error al intentar resetear el sistema.');
        setTimeout(() => setEstado(''), 3000);
      }
    }
  };

  const buscarYEliminarCaballo = async () => {
    if (!carrera || !caballo) {
      setEstado('Debe completar ambos campos de borrado.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }
    const numCarrera = parseInt(carrera);
    if (isNaN(numCarrera) || numCarrera < 1) {
      setEstado('El número de carrera debe ser un número entero positivo.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }
    if (!/^\d{1,2}\s*[a-dA-D]?$/.test(caballo.trim())) {
      setEstado('El formato del caballo debe ser un número (1-18) o número seguido de A-D (ej: 7, 7A).');
      setTimeout(() => setEstado(''), 3000);
      return;
    }

    const caballoFormateado = caballo.replace(/\s+/g, '').toUpperCase();

    try {
      const res = await axios.delete(`${baseURL}/api/borrados/${numCarrera}/${caballoFormateado}`);
      setEstado(res.data.mensaje);
      setCaballo('');
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.mensaje) {
        setEstado(error.response.data.mensaje);
      } else {
        setEstado('Error al buscar o eliminar el caballo.');
      }
      setTimeout(() => setEstado(''), 3000);
    }
  };

  const enviarHipodromo = async () => {
    try {
      await axios.post(`${baseURL}/api/hipodromo`, { hipodromo });
      setEstado(`Hipódromo "${hipodromo}" enviado correctamente.`);
      setTimeout(() => setEstado(''), 3000);
    } catch {
      setEstado('Error al enviar hipódromo.');
      setTimeout(() => setEstado(''), 3000);
    }
  };

  const enviarPista = async () => {
    try {
      await axios.post(`${baseURL}/api/pista`, { pista });
      setEstado(`Tipo de pista "${pista}" enviado correctamente.`);
      setTimeout(() => setEstado(''), 3000);
    } catch {
      setEstado('Error al enviar tipo de pista.');
      setTimeout(() => setEstado(''), 3000);
    }
  };

  const avanzarCarrera = async () => {
    try {
      const nuevaCarreraBase = carreraBase + 1;
      await axios.post(`${baseURL}/api/carrera_base`, { carrera_base: nuevaCarreraBase });
      setEstado(`Carrera avanzada a: ${nuevaCarreraBase}.`);
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      setEstado('Error al avanzar la carrera.');
      setTimeout(() => setEstado(''), 3000);
    }
  };

  const retrocederCarrera = async () => {
    if (carreraBase <= 1) {
      setEstado('No se puede retroceder más allá de la carrera 1.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }
    try {
      const nuevaCarreraBase = carreraBase - 1;
      await axios.post(`${baseURL}/api/carrera_base`, { carrera_base: nuevaCarreraBase });
      setEstado(`Carrera retrocedida a: ${nuevaCarreraBase}.`);
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      setEstado('Error al retroceder la carrera.');
      setTimeout(() => setEstado(''), 3000);
    }
  };

  // NUEVA FUNCIÓN: Enviar datos de "Ojo con este..."
  const enviarOjoConEste = async () => {
    // Validar que ambos campos estén completos si se intenta enviar
    if (!carreraOjo || !caballoOjo) {
      setEstado('Debe completar ambos campos para "Ojo con este".');
      setTimeout(() => setEstado(''), 3000);
      return;
    }

    const numCarreraOjo = parseInt(carreraOjo);
    if (isNaN(numCarreraOjo) || numCarreraOjo < 1) {
      setEstado('El número de carrera para "Ojo con este" debe ser un entero positivo.');
      setTimeout(() => setEstado(''), 3000);
      return;
    }

    const caballoFormateadoOjo = caballoOjo.replace(/\s+/g, '').toUpperCase();

    try {
      await axios.post(`${baseURL}/api/ojo_con_este`, {
        carrera: numCarreraOjo,
        caballo: caballoFormateadoOjo,
      });
      setEstado(`"Ojo con este" actualizado: Carrera ${numCarreraOjo}, Caballo ${caballoFormateadoOjo}.`);
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setEstado(`Error: ${error.response.data.error}`);
      } else {
        setEstado('Error al enviar "Ojo con este".');
      }
      setTimeout(() => setEstado(''), 3000);
    }
  };

  // NUEVA FUNCIÓN: Limpiar "Ojo con este..."
  const limpiarOjoConEste = async () => {
    try {
      // Enviamos campos vacíos para indicar al backend que limpie los valores
      await axios.post(`${baseURL}/api/ojo_con_este`, { carrera: "", caballo: "" });
      setEstado('"Ojo con este" limpiado.');
      setCarreraOjo(''); // Limpiar los inputs en el frontend
      setCaballoOjo('');
      setTimeout(() => setEstado(''), 3000);
    } catch (error) {
      setEstado('Error al limpiar "Ojo con este".');
      setTimeout(() => setEstado(''), 3000);
    }
  };


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

        <div className="p-4 md:p-6 space-y-8">

          {/* Sección de Caballos Borrados */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sección de Caballos Borrados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Número de carrera</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={carrera}
                  onChange={(e) => setCarrera(e.target.value)}
                  placeholder="Ej: 1, 10, 25"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Número de caballo (1-18 o A-D)</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={caballo}
                  onChange={(e) => setCaballo(e.target.value)}
                  placeholder="Ej: 7, 7A, 12B"
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
          </div>

          {/* Sección "Ojo con este..." */}
          <div className="border border-yellow-500 rounded-lg p-4 bg-yellow-50 shadow-sm">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Sección "Ojo con este..."</h2>
            <p className="text-yellow-700 mb-4 text-sm">Destaca una carrera y caballo en la pantalla principal. Deja los campos vacíos y presiona "Limpiar" para quitar el aviso.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-yellow-700 mb-2">Número de carrera</label>
                <input
                  type="text"
                  className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  value={carreraOjo}
                  onChange={(e) => setCarreraOjo(e.target.value)}
                  placeholder="Ej: 5"
                />
              </div>
              <div>
                <label className="block text-yellow-700 mb-2">Número de caballo</label>
                <input
                  type="text"
                  className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  value={caballoOjo}
                  onChange={(e) => setCaballoOjo(e.target.value)}
                  placeholder="Ej: 3, 10A"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={enviarOjoConEste}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition duration-200 flex-1"
              >
                Enviar "Ojo con este"
              </button>
              <button
                onClick={limpiarOjoConEste}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200 flex-1"
              >
                Limpiar "Ojo con este"
              </button>
            </div>
          </div>


          {/* Sección de Selección de Hipódromo y Tipo de Pista */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sección de Selección de Hipódromo y Tipo de Pista</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-2">Hipódromo</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={hipodromo}
                  onChange={(e) => setHipodromo(e.target.value)}
                >
                  <option>San Isidro</option>
                  <option>Palermo</option>
                  <option>La Plata</option>
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <button
                  onClick={enviarHipodromo}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition duration-200 w-full"
                >
                  Enviar Hipódromo
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-2">Tipo de Pista</label>
                <select
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  value={pista}
                  onChange={(e) => setPista(e.target.value)}
                >
                  <option>cesped</option>
                  <option>arena</option>
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <button
                  onClick={enviarPista}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition duration-200 w-full"
                >
                  Enviar Tipo de Pista
                </button>
              </div>
            </div>
          </div>

          {/* Sección de Iteración de Carreras */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sección de Iteración de Carreras</h2>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="text-gray-700 text-lg font-medium flex-1">Carrera actual visible (base): {carreraBase}</span>
              <button
                onClick={retrocederCarrera}
                className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition duration-200 w-full md:w-auto"
              >
                Retroceder Carrera (-1)
              </button>
              <button
                onClick={avanzarCarrera}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition duration-200 w-full md:w-auto"
              >
                Avanzar Carrera (+1)
              </button>
            </div>
          </div>
          <div className="border border-red-600 rounded-lg p-4 bg-red-50 shadow-sm">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Zona de Peligro</h2>
            <p className="text-red-700 mb-4 text-sm">
              Este botón reseteará todos los datos. Todos los borrados se eliminarán
              y el hipódromo y la pista se pondrán en blanco.
            </p>
            <button
              onClick={handleMasterReset}
              className="bg-red-600 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-md transition duration-200 w-full"
            >
              RESETEAR
            </button>
          </div>
          {/* --- FIN DE LA NUEVA SECCIÓN --- */}

        </div>
      </div>
    </div>
    );
    }

export default Admin;