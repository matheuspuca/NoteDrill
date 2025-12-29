import { z } from 'zod';

// Schema para Login
// Foco: Autenticação rápida e segura para acesso ao painel de operações.
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, { message: 'O campo e-mail é obrigatório para identificação do operador.' })
        .email({ message: 'Formato de credencial inválido. Insira um e-mail corporativo válido.' }),
    password: z
        .string()
        .min(1, { message: 'A chave de acesso (senha) é obrigatória.' }),
});

// Schema para Cadastro (Signup)
// Foco: Garantia de que quem entra tem o perfil técnico adequado.
export const signupSchema = z.object({
    full_name: z
        .string()
        .min(4, { message: 'Identificação incompleta. Informe o nome e sobrenome do responsável.' })
        .regex(/^[a-zA-Z\s]+$/, { message: 'O nome deve conter apenas caracteres alfabéticos conforme registro profissional.' }),

    email: z
        .string()
        .email({ message: 'E-mail inválido. Utilize o endereço cadastrado na ordem de serviço ou corporativo.' }),

    password: z
        .string()
        .min(8, { message: 'Protocolo de segurança: A senha deve conter no mínimo 8 caracteres.' })
        .regex(/[A-Z]/, { message: 'Segurança fraca: Exige-se ao menos uma letra maiúscula.' })
        .regex(/[0-9]/, { message: 'Segurança fraca: Exige-se ao menos um caractere numérico.' }),

    // Campo Opcional (apenas confirmação de entendimento do contexto)
    company_name: z
        .string()
        .optional(),
});

// Exportação dos Tipos inferidos automaticamente (Single Source of Truth)
export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
