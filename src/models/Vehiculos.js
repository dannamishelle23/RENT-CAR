import { Schema, model } from "mongoose";

const vehiculoSchema = new Schema({
  marca: {
    type: String,
    required: true,
    trim: true,
  },
  modelo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  anio_fabricacion: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  placa: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  tipo_vehiculo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  kilometraje: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  fechaEliminacionVehiculo: {
    type: Date,
    default: null,
  },
  estadoVehiculo: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

export default model("Vehículos", vehiculoSchema);