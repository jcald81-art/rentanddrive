const formattedVehicles = vehicles?.map(v => {
  const host = (Array.isArray(v.host) ? v.host[0] : v.host) as { full_name: string } | null
  return {
    ...v,
    host_name: host?.full_name || 'Unknown',
  }
}) || []
