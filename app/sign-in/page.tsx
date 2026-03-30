import { redirect } from 'next/navigation'

// Redirect /sign-in to /login for consistency
export default function SignInPage() {
  redirect('/login')
}
