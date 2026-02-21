import Materias from '../models/Materias.js';
import mongoose from 'mongoose';

//1. CREAR MATERIA (LO HACE EL USUARIO)

const crearMateria = async (req, res) => {
    try {
        let { nombre, codigo, descripcion, creditos } = req.body;

        if (!nombre || !codigo || !creditos) {
            return res.status(400).json({
                message: "Los campos nombre, código y créditos son obligatorios."
            });
        }

        codigo = codigo.trim().toUpperCase();

        const materiaExistente = await Materias.findOne({ codigo });

        // Si ya existe la materia
        if (materiaExistente) {

            // Si está inactiva → reactivar
            if (materiaExistente.estadoMateria === false) {

                materiaExistente.nombre = nombre;
                materiaExistente.descripcion = descripcion;
                materiaExistente.creditos = creditos;
                materiaExistente.estadoMateria = true;
                materiaExistente.fechaEliminacionMateria = null;

                await materiaExistente.save();

                return res.status(200).json({
                    message: "Materia reactivada correctamente.",
                    materia: materiaExistente
                });
            }

            // Si está activa → error
            return res.status(400).json({
                message: "Ya existe una materia activa con ese código."
            });
        }

        // Si no existe → crear nueva
        const nuevaMateria = new Materias({
            nombre,
            codigo,
            descripcion,
            creditos,
            estadoMateria: true
        });

        await nuevaMateria.save();

        return res.status(201).json({
            message: "Materia creada con éxito.",
            materia: nuevaMateria
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "El código ya existe."
            });
        }

        console.log(error);
        return res.status(500).json({
            message: "Error al agregar materia"
        });
    }
};

// Listar todas las materias
const listarMaterias = async (req, res) => {
  try {
    const materias = await Materias.find();
    res.status(200).json(materias);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

//Visualizar una materia por ID
const detalleMateria = async (req, res) => {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ 
                msg: `No existe la materia ${id}` 
            });
        }

        const materia = await Materias.findById(id);

        if (!materia) {
            return res.status(404).json({
                msg: "Materia no encontrada"
            });
        }

        //Formatear la respuesta
        const resultado = {
            _id: materia._id,
            nombre: materia.nombre,
            codigo: materia.codigo,
            descripcion: materia.descripcion,
            creditos: materia.creditos,
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

const actualizarMateria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, codigo, descripcion, creditos } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ 
                msg: `No existe la materia ${id}` 
            });
        }

        // Verificar que la materia exista
        const materia = await Materias.findById(id);
        if (!materia) {
            return res.status(404).json({
                msg: "Materia no encontrada"
            });
        }

        //Validar que no se dupliquen codigos de materias en la BDD
        if (codigo) {
            const codigoExiste = await Materias.findOne({codigo,_id: { $ne: id } });

            if (codigoExiste) {
                return res.status(400).json({
                    msg: "El código ya pertenece a otra materia"
                });
            }
        }

        let materiaActualizada
        try {
            materiaActualizada = await Materias.findByIdAndUpdate(
                id,
                { nombre, codigo, descripcion, creditos },
                { new: true, runValidators: true }
            );
        } catch (errorActualizar) {
            if (errorActualizar.code === 11000) {
                return res.status(400).json({
                    message: "El código ya está registrado en otra materia."
                });
            }
            throw errorActualizar;
        }

        res.status(200).json({
            message: "Materia actualizada con éxito.",
            materiaActualizada
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: `Error al actualizar materia - ${error}`
        });
    }
};

//Dar de baja varias materias
const eliminarMaterias = async (req, res) => {
    try {
        const { codigo, fechaEliminacionMateria } = req.body;

        if (!codigo || !fechaEliminacionMateria) {
            return res.status(400).json({
                msg: "Debes enviar código y fecha de eliminación"
            });
        }

        const materia = await Materias.findOne({ codigo });

        if (!materia) {
            return res.status(404).json({
                msg: "No se encontró una materia con ese código"
            });
        }

        //Verificar si la materia tiene matriculas activas
        const matriculasActivas = await Matriculas.findOne({ 
            materiaID: materia._id,
            estadoMatricula: true
        });

        //No eliminar la materia si tiene estudiantes matriculados
        if (matriculasActivas) {
            return res.status(400).json({
                msg: "No se puede eliminar la materia porque tiene estudiantes matriculados."
            });
        }

        //Dar de baja la materia
        materia.estadoMateria = false;
        materia.fechaEliminacionMateria = new Date(fechaEliminacionMateria);

        await materia.save();

        return res.status(200).json({
            msg: "Materia dada de baja correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Error al deshabilitar materia"
        });
    }
};

export {
    crearMateria,
    listarMaterias,
    detalleMateria,
    actualizarMateria,
    eliminarMaterias
}