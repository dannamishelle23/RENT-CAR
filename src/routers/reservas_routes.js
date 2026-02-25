import { crearReserva, listarReservas, detalleReserva, eliminarReserva } from "../controllers/reservas_controller.js";
import { Router } from 'express';
import { verificarTokenJWT, autorizarCliente, autorizarAdminOCliente } from "../middlewares/JWT.js";

const router = Router();

//CRUD de reservas (lo hace el cliente)
//1. CREAR RESERVA - Solo clientes
router.post('/reservas/crear-reserva', verificarTokenJWT, autorizarCliente, crearReserva)
//2. Listar todas las reservas - Admin y Cliente
router.get('/reservas/listar-reservas', verificarTokenJWT, autorizarAdminOCliente, listarReservas)
//3. Visualizar el detalle de una reserva por ID - Admin y Cliente
router.get('/reservas/detalle-reserva/:id', verificarTokenJWT, autorizarAdminOCliente, detalleReserva)
//4. Editar una reserva por ID - Solo clientes
//router.put('/reservas/editar-reserva/:id', verificarTokenJWT, autorizarCliente, actualizarReserva)
//5. Eliminar reservas definitivamente - Solo clientes
router.delete('/reservas/eliminar-reserva/:id', verificarTokenJWT, autorizarCliente, eliminarReserva)

export default router;