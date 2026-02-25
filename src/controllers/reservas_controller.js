import Reservas from '../models/Reservas.js';
import Clientes from '../models/Cliente.js';
import Vehiculos from '../models/Vehiculos.js';
import mongoose from 'mongoose';
import { generarCodigoReserva } from '../helpers/generateCode.js';

//1. Crear reserva
const crearReserva = async(req,res) => {
    try {
        const { vehiculoId } = req.body;
        
        if (!vehiculoId) {
            return res.status(400).json({
                message: "El campo vehiculoId es obligatorio."
            });
        }

        // Obtener el clienteID del usuario autenticado (del token)
        const usuarioActual = req.usuarioHeader;
        const cliente = await Clientes.findOne({ usuario: usuarioActual._id });
        
        if (!cliente) {
            return res.status(404).json({
                message: "Cliente no encontrado para este usuario."
            });
        }

        const clienteId = cliente._id;

        // Verificar si el vehículo existe
        const vehiculo = await Vehiculos.findById(vehiculoId);
        if (!vehiculo) {
            return res.status(404).json({
                message: "No existe el vehículo con el ID proporcionado."
            });
        }

        //Verificar que el vehículo esté disponible
        if (vehiculo.estadoVehiculo === false) {
            return res.status(400).json({
                message: "No se puede reservar un vehículo deshabilitado."
            });
        }

        //Verificar que el cliente ya no tenga una reserva activa
        const reservaExistente = await Reservas.findOne({ 
            clienteID: clienteId, 
            estadoReserva: true
        });
        if (reservaExistente) {
            return res.status(400).json({
                message: "Ya tienes una reserva activa."
            });
        }

        const nuevaReserva = new Reservas({
            codigo: generarCodigoReserva(),
            clienteID: clienteId,
            vehiculoID: vehiculoId,
            estadoReserva: true
        });

        await nuevaReserva.save();

        // Poblar los datos del vehículo y cliente para devolver en la respuesta
        const reservaConDetalles = await Reservas.findById(nuevaReserva._id)
            .populate({
                path: 'clienteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('vehiculoID', 'marca modelo año estadoVehiculo');

        return res.status(201).json({
            message: "Reserva creada con éxito",
            reserva: {
                _id: reservaConDetalles._id,
                codigo: reservaConDetalles.codigo,
                fecha: reservaConDetalles.fechaReserva,
                cliente: {
                    _id: reservaConDetalles.clienteID._id,
                    cedula: reservaConDetalles.clienteID.cedula,
                    nombre: `${reservaConDetalles.clienteID.usuario.nombre} ${reservaConDetalles.clienteID.usuario.apellido}`
                },
                vehiculo: {
                    _id: reservaConDetalles.vehiculoID._id,
                    marca: reservaConDetalles.vehiculoID.marca,
                    modelo: reservaConDetalles.vehiculoID.modelo,
                    año: reservaConDetalles.vehiculoID.año
                }
            }
        });
    } catch (error) {
        console.error("Error al crear reserva:", error);
        return res.status(500).json({
            message: "Error al crear la reserva."
        });
    }   
}

//Listar reservas con detalles de cliente y vehículo
const listarReservas = async(req,res) => {
    try {
        const usuarioActual = req.usuarioHeader;
        let filtro = {};

        // Si es estudiante, solo ve sus propias reservas
        if (usuarioActual.rol === "Cliente") {
            const cliente = await Clientes.findOne({ usuario: usuarioActual._id });
            if (!cliente) {
                return res.status(404).json({
                    message: "Cliente no encontrado."
                });
            }
            filtro = { clienteID: cliente._id };
        }
        // Si es admin, ve todas las reservas

        const reservas = await Reservas.find(filtro)
            .populate({
                path: 'clienteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('vehiculoID', 'marca modelo año estadoVehiculo');
            
        res.status(200).json({
            message: "Reservas obtenidas con éxito.",
            total: reservas.length,
            reservas
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error en el servidor"});
    }
}

//Visualizar una reserva por ID
const detalleReserva = async(req,res) => {
    try {
        const { id } = req.params;
        const usuarioActual = req.usuarioHeader;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                message: `No existe la reserva ${id}`
            });
        }

        const reserva = await Reservas.findById(id)
            .populate({
                path: 'clienteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('vehiculoID', 'marca modelo año estadoVehiculo');     
        
        if (!reserva) {
            return res.status(404).json({
                message: `No existe la reserva ${id}`
            });
        }

        // Validar que el estudiante solo vea sus propias reservas
        if (usuarioActual.rol === "Estudiante") {
            const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
            if (!estudiante || reserva.clienteID._id.toString() !== estudiante._id.toString()) {
                return res.status(403).json({
                    message: "No tienes permiso para ver esta reserva."
                });
            }
        }

        return res.status(200).json({
            message: "Reserva obtenida con éxito.",
            reserva
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
}

/*
//Actualizar matrícula por id
const actualizarMatricula = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoMatricula } = req.body;
        const usuarioActual = req.usuarioHeader;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                message: `No existe la matrícula ${id}`
            });
        }

        const matricula = await Matriculas.findById(id);

        if (!matricula) {
            return res.status(404).json({ 
                message: "Matrícula no encontrada" 
            });
        }

        // Validar que el estudiante solo modifique sus propias matrículas
        if (usuarioActual.rol === "Estudiante") {
            const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
            if (!estudiante || matricula.estudianteID.toString() !== estudiante._id.toString()) {
                return res.status(403).json({
                    message: "No tienes permiso para modificar esta matrícula."
                });
            }
        }

        // Solo permitir cambiar el estado de la matrícula
        if (estadoMatricula !== undefined) {
            matricula.estadoMatricula = estadoMatricula;
        }

        await matricula.save();

        const matriculaActualizada = await Matriculas.findById(id)
            .populate({
                path: 'estudianteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('materiaID', 'nombre codigo creditos');

        res.status(200).json({
            message: "Matrícula actualizada con éxito.",
            matricula: matriculaActualizada
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};
*/

// Eliminar matrícula por id
const eliminarReserva = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, fecha } = req.body;
        const usuarioActual = req.usuarioHeader;

        // Validar que el campo fecha es obligatorio
        if (!fecha) {
            return res.status(400).json({
                message: "El campo fecha es obligatorio."
            });
        }

        if (typeof fecha === 'string' && fecha.trim() === "") {
            return res.status(400).json({
                message: "El campo fecha no puede estar vacío."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                message: `No existe la reserva ${id}`
            });
        }

        const reserva = await Reservas.findById(id);
        if (!reserva) {
            return res.status(404).json({ 
                message: "Reserva no encontrada" 
            });
        }

        // Validar que el estudiante solo elimine sus propias reservas
        if (usuarioActual.rol === "Cliente") {
            const cliente = await Clientes.findOne({ usuario: usuarioActual._id });
            if (!cliente || reserva.clienteID.toString() !== cliente._id.toString()) {
                return res.status(403).json({
                    message: "No tienes permiso para eliminar esta reserva."
                });
            }
        }

        await reserva.deleteOne();
        res.status(200).json({ 
            message: "Reserva eliminada correctamente" 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

export {
    crearReserva,
    listarReservas,
    detalleReserva,
    //actualizarReserva,
    eliminarReserva
}