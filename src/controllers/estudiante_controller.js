import Estudiante from '../models/Estudiante.js';
import Usuarios from '../models/Usuarios.js';
import mongoose from 'mongoose';
import {sendMailToNewStudent} from '../helpers/sendMail.js';

//CRUD de estudiantes por medio de un usuario (administrador)

//1. CREAR ESTUDIANTES
const crearEstudiante = async(req,res) => {
    try {
        const {nombre, apellido, email, cedula, fecha_nacimiento, ciudad, direccion, telefono} = req.body
        if (Object.values(req.body).includes("")) return res.status(400).json({message: "Todos los campos son obligatorios."})
        if (cedula.length < 7 || cedula.length > 10) return res.status(400).json({message: "La cédula debe tener entre 7 y 10 dígitos."})
        //1. Verificar si el email y la cédula existen en la BDD
        const [emailExistente, cedulaExistente] = await Promise.all([
            Usuarios.findOne({ email }),
            Estudiante.findOne({ cedula })
        ]);

        if (emailExistente || cedulaExistente) {
            return res.status(400).json({
                message: `El usuario ya se encuentra registrado con ese correo o cédula en el sistema. No puedes usar datos que ya pertenecen a otro usuario.`
            });
        }
        //2. Generar contraseña aleatoria corta
        const passwordGenerada = Math.random().toString(36).slice(2, 10);
        
        //3. Crear usuario con rol 'Estudiante'
        const nuevoUsuario = new Usuarios({
            nombre,apellido, email, password: passwordGenerada, rol: "Estudiante"
        });
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(passwordGenerada)
        
        let usuarioGuardado
        try {
            usuarioGuardado = await nuevoUsuario.save()
        } catch (errorGuardar) {
            // Si hay error al guardar (ej: email duplicado), rechazar
            if (errorGuardar.code === 11000) {
                return res.status(400).json({
                    message: "El email ya se encuentra registrado en el sistema."
                })
            }
            throw errorGuardar
        }
        
        //4. Crear estudiante asociado al usuario creado
        const nuevoEstudiante = new Estudiante({
            cedula,
            fecha_nacimiento,
            ciudad,
            direccion,
            telefono,
            usuario: usuarioGuardado._id,
            creadoPor: req.usuarioHeader._id
        })
        
        try {
            await nuevoEstudiante.save()
        } catch (errorEstudiante) {
            // Si hay error al guardar estudiante (ej: cédula duplicada), eliminar el usuario creado
            await Usuarios.findByIdAndDelete(usuarioGuardado._id)
            if (errorEstudiante.code === 11000) {
                return res.status(400).json({
                    message: "La cédula ya se encuentra registrada en el sistema."
                })
            }
            throw errorEstudiante
        }
        
        //5. Enviar correo con credenciales (sin bloquear la respuesta)
        sendMailToNewStudent(email, nombre, email, passwordGenerada).catch(err => {
            console.error("Error al enviar email al estudiante:", err)
        })
        
        res.status(201).json({
            message: "El estudiante ha sido creado con éxito.",
            credenciales: {
                idEstudiante: nuevoEstudiante._id,
                email: email,
                password: passwordGenerada,
                aviso: "Las credenciales han sido enviadas al correo del estudiante."
            }
        })
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

        // Validar cédula duplicada si se intenta cambiar
        if (cedula && cedula !== estudiante.cedula) {
            const cedulaDuplicada = await Estudiante.findOne({ cedula, _id: { $ne: id } });
            if (cedulaDuplicada) {
                return res.status(400).json({
                    msg: "La cédula ya está registrada en el sistema."
                });
            }
        }

        // Validar email duplicado si se intenta cambiar
        if (email) {
            const emailDuplicado = await Usuarios.findOne({ email, _id: { $ne: estudiante.usuario } });
            if (emailDuplicado) {
                return res.status(400).json({
                    msg: "El email ya está registrado en el sistema."
                });
            }
        }

        // Actualizar datos del estudiante
        if (cedula) estudiante.cedula = cedula;
        if (ciudad) estudiante.ciudad = ciudad;
        if (direccion) estudiante.direccion = direccion;
        if (telefono) estudiante.telefono = telefono;
        if (estadoEstudiante) estudiante.estadoEstudiante = estadoEstudiante;

        await estudiante.save();

        // Actualizar datos del usuario relacionado
        if (nombre || apellido || email) {
            await Usuarios.findByIdAndUpdate(
                estudiante.usuario,
                {
                    ...(nombre && { nombre }),
                    ...(apellido && { apellido }),
                    ...(email && { email })
                },
                { new: true, runValidators: true }
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