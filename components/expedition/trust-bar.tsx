export function TrustBar() {
  const stats = [
    { value: '10%', label: 'Host Commission' },
    { value: 'Eagle Eye', label: 'Tracking on Every Trip' },
    { value: 'CarFidelity', label: 'Certified Vehicles' },
    { value: '4 Markets', label: 'Reno - Tahoe - Moab - Bozeman' },
  ]

  return (
    <section className="bg-[#C4813A] py-6">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6 lg:gap-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="text-center lg:text-left">
                <p className="text-[#1C1F1A] font-medium text-lg">
                  {stat.value}
                </p>
                <p className="text-[#1C1F1A]/70 text-sm">
                  {stat.label}
                </p>
              </div>
              {index < stats.length - 1 && (
                <div className="hidden lg:block w-px h-10 bg-[#1C1F1A]/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
