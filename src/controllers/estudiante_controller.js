import Estudiante from '../models/Estudiante.js';
import Usuarios from '../models/Usuarios.js';
import mongoose from 'mongoose';

//CRUD de estudiantes por medio de un usuario (administrador)

//1. CREAR ESTUDIANTES
const crearEstudiante = async(req,res) => {
    try {
        const {nombre, apellido, email, password, cedula, fecha_nacimiento, ciudad, direccion, telefono} = req.body
        if (Object.values(req.body).includes("")) return res.status(400).json({message: "Todos los campos son obligatorios."})
        if (cedula.length < 7 || cedula.length > 10) return res.status(400).json({message: "La cédula debe tener entre 7 y 10 dígitos."})
        //1. Verificar si el email y la cédula existen en la BDD
        const datosExistentes = await Usuarios.findOne({email, cedula})
        if (datosExistentes) return res.status(400).json({message: `El estudiante ya se encuentra registrado con las siguientes credenciales: email - ${datosExistentes.email}, cédula - ${datosExistentes.cedula}.`})
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

//2. Ver/listar estudiantes.
const listarEstudiantes = async (req, res) => {
    try {

        const estudiantes = await Estudiante.find({
            estadoEstudiante: "Activo",
            creadoPor: req.usuarioHeader._id
        })
        .populate("usuario", "nombre apellido email rol")
        .populate("creadoPor", "nombre apellido email rol");

        //Transformar la respuesta
        const resultado = estudiantes.map(est => ({
            nombre: est.usuario?.nombre,
            apellido: est.usuario?.apellido,
            cedula: est.cedula,
            fecha_nacimiento: est.fecha_nacimiento,
            direccion: est.ciudad, 
            telefono: est.telefono,
            email: est.usuario?.email,
            rol: est.usuario?.rol,
            estadoEstudiante: est.estadoEstudiante,
            creadoPor: {
                nombre: est.creadoPor?.nombre,
                apellido: est.creadoPor?.apellido,
                email: est.creadoPor?.email,
                rol: est.creadoPor?.rol
            }
        }));

        res.status(200).json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al procesar la solicitud."
        });
    }
};

//Visualizar el detalle de un registro en particular
const detalleEstudiante = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ 
                msg: `No existe el estudiante ${id}` 
            });
        }

        const estudiante = await Estudiante.findById(id)
            .populate("usuario", "nombre apellido email rol")
            .populate("creadoPor", "nombre apellido email rol");

        if (!estudiante) {
            return res.status(404).json({
                msg: "Estudiante no encontrado"
            });
        }

        //Formatear la respuesta
        const resultado = {
            _id: estudiante._id,
            nombre: estudiante.usuario?.nombre,
            apellido: estudiante.usuario?.apellido,
            cedula: estudiante.cedula,
            fecha_nacimiento: estudiante.fecha_nacimiento,
            direccion: estudiante.direccion,
            ciudad: estudiante.ciudad,
            telefono: estudiante.telefono,
            email: estudiante.usuario?.email,
            rol: estudiante.usuario?.rol,
            estadoEstudiante: estudiante.estadoEstudiante,
            creadoPor: {
                id: estudiante.creadoPor?._id,
                nombre: estudiante.creadoPor?.nombre,
                apellido: estudiante.creadoPor?.apellido,
                email: estudiante.creadoPor?.email,
                rol: estudiante.creadoPor?.rol
            }
        };

        res.status(200).json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            msg: `Error al procesar solicitud - ${error}` 
        });
    }
};

//3. Actualizar la información de un estudiante 
const actualizarEstudiante = async (req, res) => {
    try {

        const { id } = req.params;

        //Verificar que el usuario exista en la BDD
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                msg: `No existe el estudiante ${id}`
            });
        }

        const estudiante = await Estudiante.findById(id);

        if (!estudiante) {
            return res.status(404).json({
                msg: "Estudiante no encontrado"
            });
        }

        // Campos permitidos del estudiante
        const {nombre,apellido,cedula,ciudad,direccion, telefono, estadoEstudiante,email} = req.body;

        // Actualizar datos del estudiante
        if (cedula) estudiante.cedula = cedula;
        if (ciudad) estudiante.ciudad = ciudad;
        if (direccion) estudiante.direccion = direccion;
        if (telefono) estudiante.telefono = telefono;
        if (estadoEstudiante) estudiante.estadoEstudiante = estadoEstudiante;

        await estudiante.save();

        // Actualizar datos del usuario relacionado
        if (nombre || apellido || email) {
            await Usuario.findByIdAndUpdate(
                estudiante.usuario,
                {
                    ...(nombre && { nombre }),
                    ...(apellido && { apellido }),
                    ...(email && { email })
                },
                { new: true }
            );
        }

        res.status(200).json({
            msg: "Datos del estudiante actualizados correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: `Error al actualizar - ${error}`
        });
    }
};

const eliminarEstudiante = async (req,res)=>{

    try {
        const {id} = req.params
        const {salidaEstudiante} = req.body
        if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Debes llenar todos los campos"})
        if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`No existe el estudiante ${id}`})
        await Estudiante.findByIdAndUpdate(id,{salidaEstudiante:Date.parse(salidaEstudiante),estadoEstudiante:false})
        res.status(200).json({msg:"Fecha de salida registrada. El estudiante ha sido deshabilitado con éxito."})

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `Error al deshabilitar estudiante - ${error}` })
    }
}

export {
    crearEstudiante,
    listarEstudiantes,
    detalleEstudiante,
    actualizarEstudiante,
    eliminarEstudiante
}