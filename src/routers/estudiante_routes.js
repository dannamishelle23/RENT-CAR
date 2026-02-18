import {Router} from 'express';
import { crearEstudiante, listarEstudiantes } from '../controllers/estudiante_controller.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = Router();

//CRUD de estudiantes por medio de un usuario (administrador)
//1. CREAR ESTUDIANTES
router.post('/estudiantes/crear-estudiante', verificarTokenJWT, crearEstudiante)
//2. VER/LISTAR ESTUDIANTES
router.get('/estudiantes/listar-estudiantes', verificarTokenJWT, listarEstudiantes)

export default router;