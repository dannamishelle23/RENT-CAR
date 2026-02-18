import Estudiante from '../models/Estudiante.js';
import Usuarios from '../models/Usuarios.js';

//CRUD de estudiantes por medio de un usuario (administrador)

//1. CREAR ESTUDIANTES
const crearEstudiante = async(req,res) => {
    try {
        const {nombre, apellido, email, password, cedula, fecha_nacimiento, ciudad, direccion, telefono} = req.body
        if (Object.values(req.body).includes("")) return res.status(400).json({message: "Todos los campos son obligatorios."})
        //1. Verificar si el email ya existe en la tabla 'Usuarios'
        const emailExistente = await Usuarios.findOne({email})
        if (emailExistente) return res.status(400).json({message: "El correo electrónico ya se encuentra registrado."})
        //2. Crear usuario con rol 'Estudiante'
        const nuevoUsuario = new Usuarios({
            nombre,apellido, email, password, rol: "Estudiante"
        });
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password)
        const usuarioGuardado = await nuevoUsuario.save()
        //3. Crear estudiante asociado al usuario creado
        const nuevoEstudiante = new Estudiante({
            cedula,
            fecha_nacimiento,
            ciudad,
            direccion,
            telefono,
            usuario: usuarioGuardado._id,
            creadoPor: req.usuarioHeader._id
        })
        await nuevoEstudiante.save()
        res.status(201).json({message: "El estudiante ha sido creado con éxito."})
    } catch (error) {
        console.error(error);
        res.status(500).json({message: `Error al procesar la solicitud - ${error}`})
    }
}

//2. Ver/Listar estudiantes asociados a un usuario (administrador)
const listarEstudiantes = async (req, res) => {
    try {

        const estudiantes = await Estudiante.find({
            estadoEstudiante: "Activo",
            creadoPor: req.usuarioHeader._id
        })
        .select("cedula ciudad telefono fechaIngresoEstudiante estadoEstudiante usuario")
        .populate("creadoPor", "nombre apellido email");

        res.status(200).json(estudiantes);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al procesar la solicitud."
        });
    }
};


export {
    crearEstudiante,
    listarEstudiantes
}