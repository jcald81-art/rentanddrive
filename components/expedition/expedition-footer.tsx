import Link from 'next/link'
import { Car, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react'

const footerLinks = {
  rent: [
    { label: 'Browse Vehicles', href: '/vehicles' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Insurance & Protection', href: '/protection' },
    { label: 'FAQs', href: '/faq' },
  ],
  host: [
    { label: 'Become a Host', href: '/host/register' },
    { label: 'Host Dashboard', href: '/host/dashboard' },
    { label: 'Hosting Guide', href: '/host/guide' },
    { label: 'Host FAQs', href: '/host/faq' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
}

export function ExpeditionFooter() {
  return (
    <footer className="bg-[#0D0D0D] pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Main Footer Grid */}
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CC0000]">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Rent & Drive</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-white/60">
              Premium peer-to-peer car rental in Reno and Lake Tahoe. 
              Book direct, save 10%, and support local hosts.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/rentanddrive" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/rentanddrive" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/rentanddrive" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Rent Column */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Rent a Car</h4>
            <ul className="space-y-2">
              {footerLinks.rent.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Host Column */}
          <div>
            <h4 className="mb-4 font-semibold text-white">For Hosts</h4>
            <ul className="space-y-2">
              {footerLinks.host.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-6 rounded-xl bg-white/5 px-6 py-4">
          <a href="mailto:admin@rentanddrive.net" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <Mail className="h-4 w-4" />
            admin@rentanddrive.net
          </a>
          <a href="tel:+13187368723" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <Phone className="h-4 w-4" />
            (318) RENT-RAD
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Rent and Drive LLC. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-white/40 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
