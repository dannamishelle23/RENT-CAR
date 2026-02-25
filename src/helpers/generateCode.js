// Función para generar código aleatorio de 5 caracteres (números y letras)
const generarCodigoMatricula = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 5; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

export {
    generarCodigoMatricula
}
