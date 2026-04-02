const vehicle = (Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle) as { id: string; make: string; model: string; year: number; thumbnail_url: string | null } | null
const renter = (Array.isArray(b.renter) ? b.renter[0] : b.renter) as { id: string; full_name: string; email: string; avatar_url: string | null } | null
const host = (Array.isArray(b.host) ? b.host[0] : b.host) as { id: string; full_name: string; email: string; avatar_url: string | null } | null
