import {Schema, model} from 'mongoose';


const reservaSchema = new Schema(
  {
    codigo: { type: String, required: true, unique: true },
    descripcion: { type: String, trim: true },
    clienteID: { type: Schema.Types.ObjectId, ref: "Clientes", required: true },
    vehiculoID: { type: Schema.Types.ObjectId, ref: "Vehiculos", required: true },
    estadoReserva: { type: Boolean, default: true },
    fechaReserva: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model("Reserva", reservaSchema);