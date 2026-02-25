import {Router} from 'express';
import { crearCliente, listarClientes, detalleCliente, actualizarCliente, eliminarCliente } from '../controllers/cliente_controller.js';
import { verificarTokenJWT, autorizarAdmin } from '../middlewares/JWT.js';

const router = Router();

//CRUD de clientes por medio de un usuario (administrador)
//1. CREAR CLIENTES
router.post('/clientes/crear-cliente', verificarTokenJWT, autorizarAdmin, crearCliente)
//2. VER/LISTAR CLIENTES
router.get('/clientes/listar-clientes', verificarTokenJWT, autorizarAdmin, listarClientes)
//Ver el registro de un cliente
router.get('/clientes/detalle-cliente/:id', verificarTokenJWT, autorizarAdmin, detalleCliente)
//3. ACTUALIZAR INFO CLIENTES
router.put('/clientes/actualizar-cliente/:id', verificarTokenJWT, autorizarAdmin, actualizarCliente)
//4. ELIMINAR CLIENTES (ESTADO INACTIVO)
router.delete('/clientes/eliminar-cliente/:id', verificarTokenJWT, autorizarAdmin, eliminarCliente)

export default router;