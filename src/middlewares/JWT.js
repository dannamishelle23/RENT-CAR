import jwt from "jsonwebtoken"
import Usuarios from "../models/Usuarios.js"

const crearTokenJWT = (id,rol) => {
  return jwt.sign({id,rol}, process.env.JWT_SECRET, {expiresIn: "1d"})
}

const verificarTokenJWT = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization)
    return res.status(401).json({
      message: "Acceso denegado. Token inválido o expirado."
    })

  try {
    let token = authorization
    
    // Si viene con formato "Bearer <token>", extrae el token
    if (authorization.includes(" ")) {
      token = authorization.split(" ")[1]
    }

    // Validar que el token exista y no esté vacío
    if (!token || token === "undefined") {
      return res.status(401).json({
        message: "Token no encontrado o malformado."
      })
    }

    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)

    const usuarioBDD = await Usuarios
      .findById(id)
      .select("-password")

    if (!usuarioBDD)
      return res.status(401).json({
        message: "Acceso denegado. Usuario no encontrado."
      })

    req.usuarioHeader = usuarioBDD

    // Validar que el rol sea válido
    if (rol !== "Admin" && rol !== "Estudiante") {
      return res.status(403).json({
        message: "Acceso denegado. No tienes permisos."
      })
    }

    next()

  } catch (error) {
    console.log(error)
    return res.status(401).json({
      message: "Acceso denegado. Token inválido o expirado."
    })
  }
}

// Middleware para validar que el usuario sea Admin
const autorizarAdmin = (req, res, next) => {
  if (req.usuarioHeader.rol !== "Admin") {
    return res.status(403).json({
      message: "Acceso denegado. Solo administradores pueden realizar esta acción."
    })
  }
  next()
}

// Middleware para validar que el usuario sea Cliente
const autorizarCliente = (req, res, next) => {
  if (req.usuarioHeader.rol !== "Cliente") {
    return res.status(403).json({
      message: "Acceso denegado. Solo clientes pueden realizar esta acción."
    })
  }
  next()
}

// Middleware para validar que el admin o cliente vean las matrículas 
const autorizarAdminOCliente = (req, res, next) => {
  if (req.usuarioHeader.rol !== "Admin" && req.usuarioHeader.rol !== "Cliente") {
    return res.status(403).json({
      message: "Acceso denegado. Debes tener un rol válido."
    })
  }
  next()
}

// Middleware para que Admin y Cliente puedan leer materias, solo el admin puede modificar
const autorizarAdminOClienteLectura = (req, res, next) => {
  if (req.usuarioHeader.rol !== "Admin" && req.usuarioHeader.rol !== "Cliente") {
    return res.status(403).json({
      message: "Acceso denegado. Debes tener un rol válido para consultar materias."
    })
  }
  next()
}

export {
    crearTokenJWT,
    verificarTokenJWT,
    autorizarAdmin,
    autorizarCliente,
    autorizarAdminOCliente,
    autorizarAdminOClienteLectura
}