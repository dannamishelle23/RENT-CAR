import { crearVehiculos, listarVehiculos, detalleVehiculo, actualizarVehiculo, eliminarVehiculos } from "../controllers/vehiculos_controller.js";
import { Router } from 'express';
import { verificarTokenJWT, autorizarAdmin, autorizarAdminOClienteLectura } from "../middlewares/JWT.js";

const router = Router();

//CRUD de materias por medio de un usuario (administrador)
//1. Crear vehículo - Solo un usuario con rol admin
router.post('/vehiculos/crear-vehiculo', verificarTokenJWT, autorizarAdmin, crearVehiculos)
//2. Listar todos los vehiculos creados - Admin y Cliente (lectura)
router.get('/vehiculos/listar-vehiculos', verificarTokenJWT, autorizarAdminOClienteLectura, listarVehiculos)
//3. Visualizar el detalle de una materia por ID - Admin y Cliente (lectura)
router.get('/vehiculos/detalle-vehiculo/:id', verificarTokenJWT, autorizarAdminOClienteLectura, detalleVehiculo)
//4. Editar una materia por ID - Solo Admin
router.put('/vehiculos/editar-vehiculo/:id', verificarTokenJWT, autorizarAdmin, actualizarVehiculo)
//5. Eliminar materias y pasar a inactivas por auditoria - Solo Admin
router.delete('/vehiculos/eliminar-vehiculos', verificarTokenJWT, autorizarAdmin, eliminarVehiculos)

export default router;