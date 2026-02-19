import Usuarios from '../models/Usuarios.js';
import {sendMailToRecoveryPassword} from '../helpers/sendMail.js';
import {crearTokenJWT} from '../middlewares/JWT.js';

/*
//Registro de usuarios
const registroUsuarios = async(req,res) => {
  try {
    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json({message: "Todos los campos son obligatorios."})
    const verificarEmailBDD = await Usuarios.findOne({email})
    if (verificarEmailBDD) return res.status(400).json({message: "El correo electrónico ya se encuentra registrado."})
    const nuevoUsuario = new Usuarios(req.body)
    nuevoUsuario.password = await nuevoUsuario.encryptPassword(password)
    await nuevoUsuario.save()
    res.status(200).json({message: "Usuario registrado con éxito."})
  } catch (error) {
    res.status(500).json({message: `Error al procesar la solicitud - ${error}`})
  }
}*/

//Recuperar contraseña en caso de olvido
const recuperarPassword = async(req,res) => {
  try {
    const {email} = req.body
    // Validar que el email sea ingresado
    if (!email) return res.status(400).json({message: "El correo electrónico es requerido."})
    // Buscar el usuario en la BDD
    const usuarioBDD = await Usuarios.findOne({email})
    // Validar que el usuario exista
    if (!usuarioBDD) return res.status(404).json({message: "El usuario no se encuentra registrado."})
    // Generar un token de recuperación
    const token = usuarioBDD.createToken()
    // Guardar el token en la BDD
    usuarioBDD.token = token
    await usuarioBDD.save()
    console.log("Token guardado: ", usuarioBDD.token)
    //Enviar el email de recuperación de contraseña
    await sendMailToRecoveryPassword(email, token)
    res.status(200).json({message: "Se ha enviado un correo electrónico con las instrucciones para restablecer su contraseña."})
  } catch (error) {
    console.error(error);
    res.status(500).json({message: `Error al procesar la solicitud - ${error}`})
    }
}

//Comprobar el token para recuperar contraseña
const comprobarTokenPassword = async(req,res) => {
    try {
        const {token} = req.params
        const usuarioBDD = await Usuarios.findOne({token})
        if(usuarioBDD?.token !== token) return res.status(404).json({message: "Lo sentimos, no se puede validar la cuenta. El token es inválido o ha expirado."})
        res.status(200).json({message: "Token válido, ya puedes restablecer tu contraseña."})
    } catch (error) {
        console.error(error);
        res.status(500).json({message: `Error al procesar la solicitud - ${error}`})
    }
}

//Crear nueva contraseña
const crearNuevoPassword = async (req,res) => {
    try {
        const{password,confirmPassword} = req.body
        const {token} = req.params
        if (Object.values(req.body).includes("")) return res.status(400).json({message: "Todos los campos son obligatorios."})
        if (password !== confirmPassword) return res.status(400).json({message: "Las contraseñas no coinciden."})
        const usuarioBDD = await Usuarios.findOne({token})
        if (!usuarioBDD) return res.status(404).json({message: "Lo sentimos, no se puede validar la cuenta. El token es inválido o ha expirado."})
        usuarioBDD.token = null
        usuarioBDD.password = await usuarioBDD.encryptPassword(password)
        await usuarioBDD.save()
        res.status(200).json({message: "Contraseña reestablecida con éxito. Ya puedes iniciar sesión."})
    } catch (error) {
        console.error(error);
        res.status(500).json({message: `Error al procesar la solicitud - ${error}`})
    }
}

//Inicio de sesion
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ message: "Todos los campos son obligatorios." })

    const usuarioBDD = await Usuarios
      .findOne({ email })
      .select("-status -__v -token -updatedAt")

    //Validar que el usuario exista
    if (!usuarioBDD)
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." })

    const verificarPassword = await usuarioBDD.matchPassword(password)

    //Validar que la contraseña sea correcta
    if (!verificarPassword)
      return res.status(400).json({ message: "Usuario o contraseña incorrectos." })

    const { nombre, apellido, rol } = usuarioBDD
    const token = crearTokenJWT(usuarioBDD._id, usuarioBDD.rol)

    //Devolver los siguientes campos al usuario en caso de que el login sea exitoso
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      usuario: {
        token,
        nombre,
        apellido,
        email: usuarioBDD.email,
        rol
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: `Error al procesar la solicitud - ${error}`
    })
  }
}

//Visualizar el perfil
const perfilUsuario = (req,res) => {
  //Enviar solo los siguientes campos al frontend
  const {_id, nombre, apellido, email, rol} = req.usuarioHeader
  res.status(200).json({
    message: "Perfil del usuario", 
    datosPerfil: {_id, nombre, apellido, email, rol}
  });
}

export {
    //registroUsuarios,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    loginUsuario,
    perfilUsuario
}