export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      circuitos: {
        Row: {
          codigo_circuito: string
          correo_electronico: string | null
          fecha_modificacion: string | null
          fecha_registro: string | null
          movil: string | null
          nombre_viajante: string | null
          usuario_modifica: string | null
          usuario_registra: string | null
        }
        Insert: {
          codigo_circuito: string
          correo_electronico?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          movil?: string | null
          nombre_viajante?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Update: {
          codigo_circuito?: string
          correo_electronico?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          movil?: string | null
          nombre_viajante?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Relationships: []
      }
      congregaciones: {
        Row: {
          codigo_circuito: string | null
          codigo_congregacion: number
          codigo_departamento: string
          codigo_municipio: string
          correo_congregacion: string | null
          fecha_modificacion: string | null
          fecha_registro: string | null
          nombre_congregacion: string
          usuario_modifica: string | null
          usuario_registra: string | null
        }
        Insert: {
          codigo_circuito?: string | null
          codigo_congregacion: number
          codigo_departamento: string
          codigo_municipio: string
          correo_congregacion?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          nombre_congregacion: string
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Update: {
          codigo_circuito?: string | null
          codigo_congregacion?: number
          codigo_departamento?: string
          codigo_municipio?: string
          correo_congregacion?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          nombre_congregacion?: string
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congregaciones_codigo_circuito_fkey"
            columns: ["codigo_circuito"]
            isOneToOne: false
            referencedRelation: "circuitos"
            referencedColumns: ["codigo_circuito"]
          },
          {
            foreignKeyName: "congregaciones_codigo_departamento_fkey"
            columns: ["codigo_departamento"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["codigo_departamento"]
          },
          {
            foreignKeyName: "congregaciones_codigo_municipio_fkey"
            columns: ["codigo_municipio"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_municipio"]
          },
        ]
      }
      departamentos: {
        Row: {
          codigo_departamento: string
          nombre_departamento: string
        }
        Insert: {
          codigo_departamento: string
          nombre_departamento: string
        }
        Update: {
          codigo_departamento?: string
          nombre_departamento?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          adjunto_asociado: string | null
          fecha_modificacion: string | null
          fecha_registro: string | null
          id: string
          mensaje: string | null
          tipo: string | null
          usuario_modifica: string | null
          usuario_registra: string | null
        }
        Insert: {
          adjunto_asociado?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          id?: string
          mensaje?: string | null
          tipo?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Update: {
          adjunto_asociado?: string | null
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          id?: string
          mensaje?: string | null
          tipo?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Relationships: []
      }
      municipios: {
        Row: {
          codigo_departamento: string
          codigo_municipio: string
          nombre_municipio: string
        }
        Insert: {
          codigo_departamento: string
          codigo_municipio: string
          nombre_municipio: string
        }
        Update: {
          codigo_departamento?: string
          codigo_municipio?: string
          nombre_municipio?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipios_codigo_departamento_fkey"
            columns: ["codigo_departamento"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["codigo_departamento"]
          },
        ]
      }
      publicadores: {
        Row: {
          apellido_casada: string | null
          codigo_congregacion: number | null
          codigo_departamento: string | null
          codigo_municipio: string | null
          correo_electronico: string | null
          direccion: string | null
          entrenamiento_requerido: string | null
          estado: string | null
          estado_civil: string | null
          existe_bd_anterior: string | null
          fecha_aprobacion: string | null
          fecha_bautismo: string | null
          fecha_cumple_requisitos: string | null
          fecha_modificacion: string | null
          fecha_nacimiento: string | null
          fecha_primer_entrenamiento: string | null
          fecha_primera_capacitacion: string | null
          fecha_registro: string | null
          fecha_segunda_capacitacion: string | null
          fecha_segundo_entrenamiento: string | null
          fecha_solicitud: string | null
          id: string
          login: string | null
          lugar_primer_entrenamiento: string | null
          lugar_primera_capacitacion: number | null
          lugar_segunda_capacitacion: number | null
          lugar_segundo_entrenamiento: string | null
          mensaje_primer_entrenamiento: string | null
          mensaje_segundo_entrenamiento: string | null
          movil: string | null
          nombre_conyuge: string | null
          participo_antes: string | null
          primer_apellido: string | null
          primer_nombre: string | null
          privilegio_min: string | null
          privilegio_ser: string | null
          segundo_apellido: string | null
          segundo_nombre: string | null
          sexo: string | null
          usuario_modifica: string | null
          usuario_registra: string | null
        }
        Insert: {
          apellido_casada?: string | null
          codigo_congregacion?: number | null
          codigo_departamento?: string | null
          codigo_municipio?: string | null
          correo_electronico?: string | null
          direccion?: string | null
          entrenamiento_requerido?: string | null
          estado?: string | null
          estado_civil?: string | null
          existe_bd_anterior?: string | null
          fecha_aprobacion?: string | null
          fecha_bautismo?: string | null
          fecha_cumple_requisitos?: string | null
          fecha_modificacion?: string | null
          fecha_nacimiento?: string | null
          fecha_primer_entrenamiento?: string | null
          fecha_primera_capacitacion?: string | null
          fecha_registro?: string | null
          fecha_segunda_capacitacion?: string | null
          fecha_segundo_entrenamiento?: string | null
          fecha_solicitud?: string | null
          id?: string
          login?: string | null
          lugar_primer_entrenamiento?: string | null
          lugar_primera_capacitacion?: number | null
          lugar_segunda_capacitacion?: number | null
          lugar_segundo_entrenamiento?: string | null
          mensaje_primer_entrenamiento?: string | null
          mensaje_segundo_entrenamiento?: string | null
          movil?: string | null
          nombre_conyuge?: string | null
          participo_antes?: string | null
          primer_apellido?: string | null
          primer_nombre?: string | null
          privilegio_min?: string | null
          privilegio_ser?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          sexo?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Update: {
          apellido_casada?: string | null
          codigo_congregacion?: number | null
          codigo_departamento?: string | null
          codigo_municipio?: string | null
          correo_electronico?: string | null
          direccion?: string | null
          entrenamiento_requerido?: string | null
          estado?: string | null
          estado_civil?: string | null
          existe_bd_anterior?: string | null
          fecha_aprobacion?: string | null
          fecha_bautismo?: string | null
          fecha_cumple_requisitos?: string | null
          fecha_modificacion?: string | null
          fecha_nacimiento?: string | null
          fecha_primer_entrenamiento?: string | null
          fecha_primera_capacitacion?: string | null
          fecha_registro?: string | null
          fecha_segunda_capacitacion?: string | null
          fecha_segundo_entrenamiento?: string | null
          fecha_solicitud?: string | null
          id?: string
          login?: string | null
          lugar_primer_entrenamiento?: string | null
          lugar_primera_capacitacion?: number | null
          lugar_segunda_capacitacion?: number | null
          lugar_segundo_entrenamiento?: string | null
          mensaje_primer_entrenamiento?: string | null
          mensaje_segundo_entrenamiento?: string | null
          movil?: string | null
          nombre_conyuge?: string | null
          participo_antes?: string | null
          primer_apellido?: string | null
          primer_nombre?: string | null
          privilegio_min?: string | null
          privilegio_ser?: string | null
          segundo_apellido?: string | null
          segundo_nombre?: string | null
          sexo?: string | null
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicadores_codigo_congregacion_fkey"
            columns: ["codigo_congregacion"]
            isOneToOne: false
            referencedRelation: "congregaciones"
            referencedColumns: ["codigo_congregacion"]
          },
          {
            foreignKeyName: "publicadores_codigo_departamento_fkey"
            columns: ["codigo_departamento"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["codigo_departamento"]
          },
          {
            foreignKeyName: "publicadores_codigo_municipio_fkey"
            columns: ["codigo_municipio"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_municipio"]
          },
        ]
      }
      puntos: {
        Row: {
          codigo_departamento: string
          codigo_municipio: string
          codigo_punto: number
          direccion: string | null
          encargado: string | null
          estado: string
          fecha_modificacion: string | null
          fecha_registro: string | null
          movil: string | null
          nombre_punto: string
          tipo_punto: string
          usuario_modifica: string | null
          usuario_registra: string | null
        }
        Insert: {
          codigo_departamento: string
          codigo_municipio: string
          codigo_punto: number
          direccion?: string | null
          encargado?: string | null
          estado?: string
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          movil?: string | null
          nombre_punto: string
          tipo_punto: string
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Update: {
          codigo_departamento?: string
          codigo_municipio?: string
          codigo_punto?: number
          direccion?: string | null
          encargado?: string | null
          estado?: string
          fecha_modificacion?: string | null
          fecha_registro?: string | null
          movil?: string | null
          nombre_punto?: string
          tipo_punto?: string
          usuario_modifica?: string | null
          usuario_registra?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_codigo_departamento_fkey"
            columns: ["codigo_departamento"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["codigo_departamento"]
          },
          {
            foreignKeyName: "puntos_codigo_municipio_fkey"
            columns: ["codigo_municipio"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_municipio"]
          },
        ]
      }
      usuarios: {
        Row: {
          correo: string | null
          login: string
          movil: string | null
          password_hash: string
          rol: string | null
        }
        Insert: {
          correo?: string | null
          login: string
          movil?: string | null
          password_hash: string
          rol?: string | null
        }
        Update: {
          correo?: string | null
          login?: string
          movil?: string | null
          password_hash?: string
          rol?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
