import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Criamos o Schema de validação com o Zod
const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'], // O erro vai aparecer no campo confirmPassword
});

// 2. Extraímos a tipagem do Schema (ótimo se estiver usando TypeScript)
type RegisterFormInputs = z.infer<typeof registerSchema>;

export function RegisterScreen() {
  // 3. Inicializamos o useForm passando o resolver do Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  // 4. Função chamada quando o formulário é válido
  const onSubmit = (data: RegisterFormInputs) => {
    console.log('Dados validados e prontos para API:', data);
    // Aqui você faria o fetch/axios para o seu backend
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Cadastro</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Campo Nome */}
        <div>
          <label>Nome</label>
          <input type="text" {...register('name')} />
          {errors.name && <p style={{ color: 'red', fontSize: '12px' }}>{errors.name.message}</p>}
        </div>

        {/* Campo E-mail */}
        <div>
          <label>E-mail</label>
          <input type="email" {...register('email')} />
          {errors.email && <p style={{ color: 'red', fontSize: '12px' }}>{errors.email.message}</p>}
        </div>

        {/* Campo Senha */}
        <div>
          <label>Senha</label>
          <input type="password" {...register('password')} />
          {errors.password && <p style={{ color: 'red', fontSize: '12px' }}>{errors.password.message}</p>}
        </div>

        {/* Campo Confirmar Senha */}
        <div>
          <label>Confirmar Senha</label>
          <input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit">Criar Conta</button>
      </form>
    </div>
  );
}