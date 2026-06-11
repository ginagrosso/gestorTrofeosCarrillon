import { LoginForm } from '@/features/auth'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-brand-brown">
          Trofeos Carrillon
        </h1>
        <LoginForm />
      </div>
    </div>
  )
}
