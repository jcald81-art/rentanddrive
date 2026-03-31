import Link from 'next/link'

const FOOTER_LINKS = {
  renters: {
    title: 'RAD Renters',
    links: [
      { href: '/vehicles', label: 'Browse Vehicles' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/help', label: 'RAD Support' },
      { href: '/trailside-assist', label: 'Trailside Assist' },
    ],
  },
  hosts: {
    title: 'RAD Hosts',
    links: [
      { href: '/list-vehicle', label: 'Become a RAD Host' },
      { href: '/host/dashboard', label: 'Command Center' },
      { href: '/hostslab/eagle-eye', label: 'Fleet Tracker' },
      { href: '/carfidelity', label: 'CarFidelity' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/blog', label: 'Blog' },
      { href: '/p2pcr', label: 'P2PCR' },
      { href: '/contact', label: 'Contact' },
    ],
  },
}

export function ExpeditionFooter() {
  return (
    <footer className="bg-sidebar pt-20 pb-8">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        {/* Main Footer */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-sidebar-border">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="font-serif text-2xl text-sidebar-foreground">
                Rent and Drive
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Rent and Drive LLC<br />
              Reno, Nevada
            </p>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com/rentanddrive" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-sidebar-foreground transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com/rentanddrive" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-sidebar-foreground transition-colors"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-sm font-medium text-sidebar-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            2026 Rent and Drive LLC. rentanddrive.net
          </p>
          <p className="text-sm text-muted-foreground">
            Built for adventure travel.
          </p>
        </div>
      </div>
    </footer>
  )
}
