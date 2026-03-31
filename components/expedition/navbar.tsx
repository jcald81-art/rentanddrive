'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/vehicles', label: 'Browse Vehicles' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/renter/suite', label: 'Renter Suite' },
  { href: '/host/dashboard', label: 'Host Suite' },
]

export function ExpeditionNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-[#1C1F1A]/95 backdrop-blur-md' 
            : 'bg-transparent'
        )}
      >
        <nav className="mx-auto max-w-[1280px] px-6 lg:px-20">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image 
                src="/images/rad-brand-logo.png" 
                alt="Rent and Drive - Reno Sparks Lake Tahoe" 
                width={100}
                height={50}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium text-[#9A9589] hover:text-[#F5F2EC] transition-colors relative group',
                    pathname === link.href && 'text-[#F5F2EC]'
                  )}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#C4813A] transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/list-vehicle"
                className="text-sm font-medium text-[#C4813A] border border-[#C4813A] px-5 py-2.5 rounded-full hover:bg-[#C4813A] hover:text-[#1C1F1A] transition-colors"
              >
                Become a Host
              </Link>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[#9A9589] hover:text-[#F5F2EC] transition-colors"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#F5F2EC]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#1C1F1A] lg:hidden">
          <div className="flex flex-col h-full pt-24 px-6">
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'text-2xl font-serif text-[#9A9589] hover:text-[#F5F2EC] py-4 border-b border-[#F5F2EC]/10 transition-colors',
                    pathname === link.href && 'text-[#F5F2EC]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="mt-auto pb-12 flex flex-col gap-4">
              <Link
                href="/list-vehicle"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-lg font-medium text-[#1C1F1A] bg-[#C4813A] px-6 py-4 rounded-full"
              >
                Become a Host
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-lg font-medium text-[#9A9589] border border-[#9A9589] px-6 py-4 rounded-full"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
