import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md text-center">
      {/* Branding */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#D62828] rounded-lg flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <span className="text-xl font-semibold">Rent and Drive</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email icon */}
        <div className="mx-auto w-16 h-16 bg-[#D62828]/10 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-[#D62828]"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent you a verification link. Click the link in your email to activate your account.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <Link href="/signup" className="text-primary hover:underline">
              try again with a different email
            </Link>
          </p>
        </div>

        <Button asChild variant="outline" className="w-full h-11">
          <Link href="/login">
            Back to sign in
          </Link>
        </Button>
      </div>
    </div>
  )
}
