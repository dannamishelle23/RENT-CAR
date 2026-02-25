//Requerir módulos
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routerUsuarios from './routers/usuario_routes.js';
import routerClientes from './routers/cliente_routes.js';
import routerVehiculos from './routers/vehiculo_routes.js';
import routerReservas from './routers/reservas_routes.js';

//Inicializaciones
const app = express();
dotenv.config();

//Configuraciones

//Middlewares
app.use(express.json());
app.use(cors());

//Variables globales
app.set('port', process.env.PORT || 3000);

//Ruta principal
app.get('/', (req, res) => res.send('Server on'));

// Ruta para usuarios 
app.use('/api', routerUsuarios);

//Rutas para clientes
app.use('/api', routerClientes);

//Rutas para vehiculos
app.use('/api', routerVehiculos);

//Rutas para reservas
app.use('/api', routerReservas);

//Manejo de una ruta que no sea encontrada
app.use((req, res) => {
    res.status(404).send("Error 404: Endpoint no encontrado.")
})

//Exportar la instancia 
export default app