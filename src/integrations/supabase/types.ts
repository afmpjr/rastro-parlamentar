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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      coletas: {
        Row: {
          concluido_em: string | null
          fonte: string
          hash_sha256: string | null
          id: number
          iniciado_em: string
          mensagem: string | null
          registros: number
          status: string
          url: string
        }
        Insert: {
          concluido_em?: string | null
          fonte: string
          hash_sha256?: string | null
          id?: never
          iniciado_em?: string
          mensagem?: string | null
          registros?: number
          status: string
          url: string
        }
        Update: {
          concluido_em?: string | null
          fonte?: string
          hash_sha256?: string | null
          id?: never
          iniciado_em?: string
          mensagem?: string | null
          registros?: number
          status?: string
          url?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          ano: number
          casa: string
          categoria: string
          cnpj_cpf: string
          coleta_id: number
          data: string
          documento_url: string | null
          fornecedor: string
          linha_hash: string
          mes: number
          parlamentar_id: string
          valor: number
        }
        Insert: {
          ano: number
          casa: string
          categoria: string
          cnpj_cpf?: string
          coleta_id: number
          data?: string
          documento_url?: string | null
          fornecedor: string
          linha_hash: string
          mes: number
          parlamentar_id: string
          valor: number
        }
        Update: {
          ano?: number
          casa?: string
          categoria?: string
          cnpj_cpf?: string
          coleta_id?: number
          data?: string
          documento_url?: string | null
          fornecedor?: string
          linha_hash?: string
          mes?: number
          parlamentar_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
        ]
      }
      emendas: {
        Row: {
          ano: number
          autor: string
          empenhado: number
          funcao: string
          id: number
          municipio: string
          pago: number
          qtd: number
          tipo: string
          uf: string
        }
        Insert: {
          ano: number
          autor: string
          empenhado: number
          funcao: string
          id?: never
          municipio: string
          pago: number
          qtd: number
          tipo: string
          uf: string
        }
        Update: {
          ano?: number
          autor?: string
          empenhado?: number
          funcao?: string
          id?: never
          municipio?: string
          pago?: number
          qtd?: number
          tipo?: string
          uf?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          atualizado_em: string
          casa: string
          cnpj_cpf: string
          nome: string
        }
        Insert: {
          atualizado_em?: string
          casa: string
          cnpj_cpf: string
          nome: string
        }
        Update: {
          atualizado_em?: string
          casa?: string
          cnpj_cpf?: string
          nome?: string
        }
        Relationships: []
      }
      parlamentares: {
        Row: {
          atualizado_em: string
          casa: string
          foto: string
          id: string
          nome: string
          partido: string
          uf: string
        }
        Insert: {
          atualizado_em?: string
          casa: string
          foto?: string
          id: string
          nome: string
          partido: string
          uf: string
        }
        Update: {
          atualizado_em?: string
          casa?: string
          foto?: string
          id?: string
          nome?: string
          partido?: string
          uf?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resumo_emendas: {
        Args: {
          p_ano: number
          p_autor: string
          p_municipio: string
          p_uf: string
        }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
