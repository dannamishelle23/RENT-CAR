import Vehiculos from '../models/Vehiculos.js';
import mongoose from 'mongoose';

//1. CREAR VEHICULO (LO HACE EL USUARIO)

const crearVehiculos = async (req, res) => {
    try {
        let { marca, modelo, anio_fabricacion, placa, color, tipo_vehiculo, kilometraje } = req.body;

        if (!marca || !modelo || !anio_fabricacion || !placa || !color || !tipo_vehiculo || !kilometraje) {
            return res.status(400).json({
                message: "Los campos marca, modelo, año de fabricación, placa, color, tipo de vehículo y kilometraje son obligatorios."
            });
        }

        placa = placa.trim().toUpperCase();

        const vehiculoExistente = await Vehiculos.findOne({ placa });

        // Si ya existe el carro
        if (vehiculoExistente) {

            // Si está inactivo → reactivar
            if (vehiculoExistente.estadoVehiculo === false) {

                vehiculoExistente.marca = marca;
                vehiculoExistente.modelo = modelo;
                vehiculoExistente.anio_fabricacion = anio_fabricacion;
                vehiculoExistente.color = color;
                vehiculoExistente.tipo_vehiculo = tipo_vehiculo;
                vehiculoExistente.kilometraje = kilometraje;
                vehiculoExistente.estadoVehiculo = true;
                vehiculoExistente.fechaEliminacionVehiculo = null;

                await vehiculoExistente.save();

                return res.status(200).json({
                    message: "Vehículo reactivado correctamente.",
                    vehiculo: vehiculoExistente
                });
            }

            // Si está activa → error
            return res.status(400).json({
                message: "Ya existe un vehículo activo con esa placa."
            });
        }

        // Si no existe → crear nueva
        const nuevaMateria = new Materias({
            marca,
            modelo,
            anio_fabricacion,
            placa,
            color,
            tipo_vehiculo,
            kilometraje,
            estadoVehiculo: true
        });

        await nuevaMateria.save();

        return res.status(201).json({
            message: "Vehículo creado con éxito.",
            vehiculo: nuevaMateria
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "La placa ya existe."
            });
        }

        console.log(error);
        return res.status(500).json({
            message: "Error al agregar vehículo"
        });
    }
};

// Listar todas las materias
const listarVehiculos = async (req, res) => {
  try {
    const vehiculos = await Materias.find();
    res.status(200).json(vehiculos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

//Visualizar una materia por ID
const detalleVehiculo = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ 
                msg: `No existe el vehículo ${id}` 
            });
        }

        const vehiculo = await Materias.findById(id);

        if (!vehiculo) {
            return res.status(404).json({
                msg: "Vehículo no encontrado"
            });
        }

        //Formatear la respuesta
        const resultado = {
            _id: vehiculo._id,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio_fabricacion: vehiculo.anio_fabricacion,
            placa: vehiculo.placa,
            color: vehiculo.color,
            tipo_vehiculo: vehiculo.tipo_vehiculo,
            kilometraje: vehiculo.kilometraje,
            estadoMateria: materia.estadoMateria
        }
        return res.status(200).json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            msg: `Error al procesar solicitud - ${error}` 
        });
    }
};

const actualizarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { marca, modelo, anio_fabricacion, placa, color, tipo_vehiculo, kilometraje } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ 
                msg: `No existe el vehículo ${id}` 
            });
        }

        // Verificar que el vehículo exista
        const vehiculo = await Materias.findById(id);
        if (!vehiculo) {
            return res.status(404).json({
                msg: "Vehículo no encontrado"
            });
        }

        //Validar que no se dupliquen placa de vehículos en la BDD
        if (placa) {
            const placaExistente = await Materias.findOne({placa,_id: { $ne: id } });

            if (placaExistente) {
                return res.status(400).json({
                    msg: "La placa ya pertenece a otro vehículo"
                });
            }
        }

        let vehiculoActualizado
        try {
            vehiculoActualizado = await Materias.findByIdAndUpdate(
                id,
                { marca, modelo, anio_fabricacion, placa, color, tipo_vehiculo, kilometraje },
                { new: true, runValidators: true }
            );
        } catch (errorActualizar) {
            if (errorActualizar.code === 11000) {
                return res.status(400).json({
                    message: "La placa ya está registrada en otro vehículo."
                });
            }
            throw errorActualizar;
        }

        res.status(200).json({
            message: "Vehículo actualizado con éxito.",
            vehiculoActualizado
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Error al actualizar vehículo - ${error}`
        });
    }
};

//Dar de baja varios vehiculos por placa
const eliminarVehiculos = async (req, res) => {
    try {
        const { placa, fechaEliminacionVehiculo } = req.body;

        if (!placa || !fechaEliminacionVehiculo) {
            return res.status(400).json({
                msg: "Debes enviar placa y fecha de eliminación"
            });
        }

        const vehiculo = await Materias.findOne({ placa });

        if (!vehiculo) {
            return res.status(404).json({
                msg: "No se encontró un vehículo con esa placa"
            });
        }

        //Verificar si la materia tiene vehiculos activos
        const vehiculosActivos = await Vehiculos.findOne({ 
            materiaID: vehiculo._id,
            estadoVehiculo: true
        });

        //No eliminar la materia si tiene vehiculos activos
        if (vehiculosActivos) {
            return res.status(400).json({
                msg: "No se puede eliminar el vehículo porque tiene reservas activas."
            });
        }

        //Dar de baja el vehículo
        vehiculo.estadoVehiculo = false;
        vehiculo.fechaEliminacionVehiculo = new Date(fechaEliminacionVehiculo);

        await vehiculo.save();

        return res.status(200).json({
            msg: "Vehículo dado de baja correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Error al deshabilitar vehículo"
        });
    }
};

export {
    crearVehiculos,
    listarVehiculos,
    detalleVehiculo,
    actualizarVehiculo,
    eliminarVehiculos
}