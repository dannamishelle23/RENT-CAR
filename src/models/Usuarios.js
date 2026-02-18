import {Schema, model} from 'mongoose';
import bcrypt from 'bcryptjs';

const UsuarioSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        default: null
    },
    rol: {
        type: String,
        enum : ['Admin', 'Estudiante'],
        default: 'Admin',
    }
}, {
    timestamps: true
})

//Metodo para cifrar el password
UsuarioSchema.methods.encryptPassword = async function(password){
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(password, salt);
    return passwordEncrypted;
}

//Verificar si el password es el mismo de la BDD
UsuarioSchema.methods.matchPassword = async function(password){
    const response = await bcrypt.compare(password, this.password);
    return response;
}

//Metodo para generar un token de autenticacion
UsuarioSchema.methods.createToken = function(){
    const tokenGenerado = Math.random().toString(36).slice(2);
    this.token = tokenGenerado;
    return tokenGenerado;
}

export default model('Usuarios', UsuarioSchema);