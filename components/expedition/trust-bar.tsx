export function TrustBar() {
  const stats = [
    { value: '10%', label: 'Host Commission' },
    { value: 'RAD Fleet', label: 'Tracking on Every Trip' },
    { value: 'Inspektlabs', label: 'Certified Vehicles' },
    { value: '3 Markets', label: 'Reno - Sparks - Tahoe' },
  ]

  return (
    <section className="bg-accent py-6">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6 lg:gap-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="text-center lg:text-left">
                <p className="text-accent-foreground font-medium text-lg">
                  {stat.value}
                </p>
                <p className="text-accent-foreground/70 text-sm">
                  {stat.label}
                </p>
              </div>
              {index < stats.length - 1 && (
                <div className="hidden lg:block w-px h-10 bg-accent-foreground/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
