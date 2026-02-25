import Matriculas from '../models/Matriculas.js';
import Estudiantes from '../models/Cliente.js';
import Materias from '../models/Materias.js';
import mongoose from 'mongoose';
import { generarCodigoMatricula } from '../helpers/generateCode.js';

//1. Crear matricula (lo hace el estudiante)
const crearMatricula = async(req,res) => {
    try {
        const { materiaId } = req.body;
        
        if (!materiaId) {
            return res.status(400).json({
                message: "El campo materiaId es obligatorio."
            });
        }

        // Obtener el estudianteID del usuario autenticado (del token)
        const usuarioActual = req.usuarioHeader;
        const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
        
        if (!estudiante) {
            return res.status(404).json({
                message: "Estudiante no encontrado para este usuario."
            });
        }

        const estudianteId = estudiante._id;

        // Verificar si la materia existe
        const materia = await Materias.findById(materiaId);
        if (!materia) {
            return res.status(404).json({
                message: "No existe la materia con el ID proporcionado."
            });
        }

        //Verificar que el estudiante pueda matricularse en una materia activa
        if (materia.estadoMateria === false) {
            return res.status(400).json({
                message: "No se puede matricular en una materia deshabilitada."
            });
        }

        //Verificar que el estudiante ya está matriculado en esa materia
        const matriculaExistente = await Matriculas.findOne({ 
            estudianteID: estudianteId, 
            materiaID: materiaId,
            estadoMatricula: true
        });
        if (matriculaExistente) {
            return res.status(400).json({
                message: "Ya estás matriculado en esta materia."
            });
        }

        const nuevaMatricula = new Matriculas({
            codigo: generarCodigoMatricula(),
            estudianteID: estudianteId,
            materiaID: materiaId,
            estadoMatricula: true
        });

        await nuevaMatricula.save();

        // Poblar los datos de la materia y estudiante para devolver en la respuesta
        const matriculaConDetalles = await Matriculas.findById(nuevaMatricula._id)
            .populate({
                path: 'estudianteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('materiaID', 'nombre codigo creditos');

        return res.status(201).json({
            message: "Matrícula creada con éxito",
            matricula: {
                _id: matriculaConDetalles._id,
                codigo: matriculaConDetalles.codigoMatricula,
                fecha: matriculaConDetalles.fechaMatricula,
                estudiante: {
                    _id: matriculaConDetalles.estudianteID._id,
                    cedula: matriculaConDetalles.estudianteID.cedula,
                    nombre: `${matriculaConDetalles.estudianteID.usuario.nombre} ${matriculaConDetalles.estudianteID.usuario.apellido}`
                },
                materia: {
                    _id: matriculaConDetalles.materiaID._id,
                    nombre: matriculaConDetalles.materiaID.nombre,
                    codigo: matriculaConDetalles.materiaID.codigo,
                    creditos: matriculaConDetalles.materiaID.creditos
                }
            }
        });
    } catch (error) {
        console.error("Error al crear matrícula:", error);
        return res.status(500).json({
            message: "Error al crear la matrícula."
        });
    }   
}

//Listar matriculas con detalles de estudiante y materia
const listarMatriculas = async(req,res) => {
    try {
        const usuarioActual = req.usuarioHeader;
        let filtro = {};

        // Si es estudiante, solo ve sus propias matrículas
        if (usuarioActual.rol === "Estudiante") {
            const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
            if (!estudiante) {
                return res.status(404).json({
                    message: "Estudiante no encontrado."
                });
            }
            filtro = { estudianteID: estudiante._id };
        }
        // Si es admin, ve todas las matrículas

        const matriculas = await Matriculas.find(filtro)
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
            message: "Matrículas obtenidas con éxito.",
            total: matriculas.length,
            matriculas
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error en el servidor"});
    }
}

//Visualizar una matricula por ID
const detalleMatricula = async(req,res) => {
    try {
        const { id } = req.params;
        const usuarioActual = req.usuarioHeader;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                message: `No existe la matrícula ${id}`
            });
        }

        const matricula = await Matriculas.findById(id)
            .populate({
                path: 'estudianteID',
                select: 'cedula usuario',
                populate: {
                    path: 'usuario',
                    select: 'nombre apellido'
                }
            })
            .populate('materiaID', 'nombre codigo creditos');     
        
        if (!matricula) {
            return res.status(404).json({
                message: `No existe la matrícula ${id}`
            });
        }

        // Validar que el estudiante solo vea sus propias matrículas
        if (usuarioActual.rol === "Estudiante") {
            const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
            if (!estudiante || matricula.estudianteID._id.toString() !== estudiante._id.toString()) {
                return res.status(403).json({
                    message: "No tienes permiso para ver esta matrícula."
                });
            }
        }

        return res.status(200).json({
            message: "Matrícula obtenida con éxito.",
            matricula
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
const eliminarMatricula = async (req, res) => {
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
                message: `No existe la matrícula ${id}`
            });
        }

        const matricula = await Matriculas.findById(id);
        if (!matricula) {
            return res.status(404).json({ 
                message: "Matrícula no encontrada" 
            });
        }

        // Validar que el estudiante solo elimine sus propias matrículas
        if (usuarioActual.rol === "Estudiante") {
            const estudiante = await Estudiantes.findOne({ usuario: usuarioActual._id });
            if (!estudiante || matricula.estudianteID.toString() !== estudiante._id.toString()) {
                return res.status(403).json({
                    message: "No tienes permiso para eliminar esta matrícula."
                });
            }
        }

        await matricula.deleteOne();
        res.status(200).json({ 
            message: "Matrícula eliminada correctamente" 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

export {
    crearMatricula,
    listarMatriculas,
    detalleMatricula,
    //actualizarMatricula,
    eliminarMatricula
}