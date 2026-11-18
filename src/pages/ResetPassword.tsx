import { useAuth } from '../lib/auth'
import PasswordForm from '../components/PasswordForm'

/** Exibida quando a pessoa chega pelo link "esqueci minha senha" do e-mail. */
export default function ResetPassword() {
  const { clearRecovery } = useAuth()
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-center text-2xl font-semibold">Criar nova senha</h1>
      <p className="mb-6 text-center text-sm text-muted">Escolha uma senha nova para entrar no NoRitmo.</p>
      <div className="card p-4"><PasswordForm onDone={clearRecovery} /></div>
    </div>
  )
}
