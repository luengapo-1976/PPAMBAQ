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
  nombre_viajante: string | null;
  movil: string | null;
  correo_electronico: string | null;
}

export interface CircuitoUpdatePayload {
  nombre_viajante: string | null;
  movil: string | null;
  correo_electronico: string | null;
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
  codigo_circuito: string | null;
  correo_congregacion: string | null;
}

export interface CongregacionUpdatePayload {
  nombre_congregacion: string;
  codigo_municipio: string;
  codigo_departamento: string;
  codigo_circuito: string | null;
  correo_congregacion: string | null;
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
  correo: string | null;
  movil: string | null;
}

export interface UsuarioUpdatePayload {
  rol: Rol;
  password?: string;
  correo: string | null;
  movil: string | null;
}
