// src/Home.jsx
import React from 'react';

// Estilos simples en línea para la página de inicio
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0f2f5',
    color: '#333',
    padding: '20px',
    textAlign: 'center'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '30px',
    color: '#1a73e8'
  },
  linkContainer: {
    fontSize: '1.2rem',
  },
  link: {
    color: '#1a73e8',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
};

function Home() {
  // Obtiene la URL base automáticamente (ej: "https://agencia-hipica.vercel.app")
  const baseURL = window.location.origin;
  const tvURL = `${baseURL}/tv`;
  const celularURL = `${baseURL}/celular`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Panel de Hípica</h1>
        <div style={styles.linkContainer}>
          <p>Direccion de los televisores: <a href={tvURL} style={styles.link}>{tvURL}</a></p>
          <p>Direccion del celular: <a href={celularURL} style={styles.link}>{celularURL}</a></p>
        </div>
      </div>
    </div>
  );
}

export default Home;