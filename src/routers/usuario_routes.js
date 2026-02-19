import {Router} from 'express';
import { recuperarPassword, comprobarTokenPassword, crearNuevoPassword, loginUsuario, perfilUsuario } from '../controllers/usuario_controller.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = Router();
/*
Ruta para registro en caso de que sea público
El registro de los usuarios es manual en la BDD
router.post('/usuario/registro', registroUsuarios)
*/

//Endpoint para recuperar contraseña
router.post('/usuario/recuperarpassword', recuperarPassword)
router.get('/usuario/recuperarpassword/:token', comprobarTokenPassword)
router.post('/usuario/crearnuevopassword/:token', crearNuevoPassword)
//Login de usuario
router.post('/usuario/login', loginUsuario)
//Perfil de usuario
router.get('/usuario/perfil', verificarTokenJWT, perfilUsuario)

export default router;
