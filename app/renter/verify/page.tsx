import { Suspense } from "react"
import VerifyContent from "./verify-content"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
}
