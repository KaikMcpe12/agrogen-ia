import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Schema do Login
const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormInputs) => {
    console.log('Fazendo login com:', data);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Login</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div>
          <label>E-mail</label>
          <input type="email" {...register('email')} />
          {errors.email && <p style={{ color: 'red', fontSize: '12px' }}>{errors.email.message}</p>}
        </div>

        <div>
          <label>Senha</label>
          <input type="password" {...register('password')} />
          {errors.password && <p style={{ color: 'red', fontSize: '12px' }}>{errors.password.message}</p>}
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}