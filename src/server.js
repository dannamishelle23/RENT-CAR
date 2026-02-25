//Requerir módulos
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routerUsuarios from './routers/usuario_routes.js';
import routerEstudiantes from './routers/cliente_routes.js';
import routerMaterias from './routers/materia_routes.js';
import routerMatriculas from './routers/matriculas_routes.js';

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

// Ruta para usuarios (administradores)
app.use('/api', routerUsuarios);

//Rutas para estudiantes
app.use('/api', routerEstudiantes);

//Rutas para materias 
app.use('/api', routerMaterias);

//Rutas para matriculas
app.use('/api', routerMatriculas);

//Manejo de una ruta que no sea encontrada
app.use((req, res) => {
    res.status(404).send("Error 404: Endpoint no encontrado.")
})

//Exportar la instancia 
export default app