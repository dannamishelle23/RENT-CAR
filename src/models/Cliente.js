import {Schema, model} from 'mongoose';

const ClienteSchema = new Schema({
    cedula: {
        type: String,
        required: true,
        trim: true,
        unique: true 
    },
    fecha_nacimiento: {
        type: Date,
        required: true
    },
    ciudad: {
        type: String,
        required: true,
        trim: true
    },
    direccion: {
        type: String,
        required: true,
        trim: true
    },
    telefono: {
        type: String,
        required: true,
        trim: true
    },
    fechaIngresoEstudiante:{
        type:Date,
        required:true,
        default:Date.now
    },
    fechaEliminacionCliente:{
        type:Date,
        default:null
    },
    estadoCliente:{
        type:String,
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: true
    },
    creadoPor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuarios',
        required: true
    },
}, {
    timestamps: true
})

export default model('Clientes', ClienteSchema);