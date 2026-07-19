export interface Departamento {
  codigo_departamento: string;
  nombre_departamento: string;
}

export type DepartamentoCreatePayload = Departamento;
export interface DepartamentoUpdatePayload {
  nombre_departamento: string;
}

export interface Municipio {
  codigo_municipio: string;
  nombre_municipio: string;
  codigo_departamento: string;
}

export type MunicipioCreatePayload = Municipio;
export interface MunicipioUpdatePayload {
  nombre_municipio: string;
  codigo_departamento: string;
}

export interface Circuito {
  codigo_circuito: string;
  nombre_viajante: string | null;
  movil: string | null;
  correo_electronico: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface CircuitoCreatePayload {
  codigo_circuito: string;
  nombre_viajante: string;
  movil: string;
  correo_electronico: string;
}

export interface CircuitoUpdatePayload {
  nombre_viajante: string;
  movil: string;
  correo_electronico: string;
}

export interface Congregacion {
  codigo_congregacion: number;
  nombre_congregacion: string;
  codigo_municipio: string;
  codigo_departamento: string;
  codigo_circuito: string | null;
  correo_congregacion: string | null;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface CongregacionCreatePayload {
  codigo_congregacion: number;
  nombre_congregacion: string;
  codigo_municipio: string;
  codigo_departamento: string;
  codigo_circuito: string;
  correo_congregacion: string;
}

export interface CongregacionUpdatePayload {
  nombre_congregacion: string;
  codigo_municipio: string;
  codigo_departamento: string;
  codigo_circuito: string;
  correo_congregacion: string;
}

export type Rol = 'Administrador' | 'Coordinador';

export const ROLES: Rol[] = ['Administrador', 'Coordinador'];

export interface Usuario {
  login: string;
  rol: Rol | null;
  correo: string | null;
  movil: string | null;
}

export interface UsuarioCreatePayload {
  login: string;
  rol: Rol;
  password: string;
  correo: string;
  movil: string;
}

export interface UsuarioUpdatePayload {
  rol: Rol;
  password?: string;
  correo: string;
  movil: string;
}

export type PuntoEstado = 'Activo' | 'Inactivo';

export const PUNTO_ESTADOS: PuntoEstado[] = ['Activo', 'Inactivo'];

export type PuntoTipo = 'Punto PPAM' | 'Punto de entrenamiento';

export const PUNTO_TIPOS: PuntoTipo[] = ['Punto PPAM', 'Punto de entrenamiento'];

export interface Punto {
  codigo_punto: number;
  nombre_punto: string;
  tipo_punto: PuntoTipo;
  direccion: string | null;
  codigo_departamento: string;
  codigo_municipio: string;
  encargado: string | null;
  movil: string | null;
  estado: PuntoEstado;
  usuario_registra: string | null;
  fecha_registro: string | null;
  usuario_modifica: string | null;
  fecha_modificacion: string | null;
}

export interface PuntoCreatePayload {
  codigo_punto: number;
  nombre_punto: string;
  tipo_punto: PuntoTipo;
  direccion: string;
  codigo_departamento: string;
  codigo_municipio: string;
  encargado: string;
  movil: string;
  estado: PuntoEstado;
}

export interface PuntoUpdatePayload {
  nombre_punto: string;
  tipo_punto: PuntoTipo;
  direccion: string;
  codigo_departamento: string;
  codigo_municipio: string;
  encargado: string;
  movil: string;
  estado: PuntoEstado;
}
