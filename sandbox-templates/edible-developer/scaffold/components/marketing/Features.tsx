const features = [
  {
    title: 'Instant Booking',
    description: 'Book your stay in seconds with real-time availability and pricing.',
  },
  {
    title: 'Verified Properties',
    description: 'Every listing is verified for quality, accuracy, and guest safety.',
  },
  {
    title: 'Flexible Cancellation',
    description: 'Plans change. Most properties offer free cancellation up to 48 hours before check-in.',
  },
]

export function Features() {
  return (
    <section className="py-16 px-4 bg-card">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-center mb-10">Why book with us</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center space-y-3">
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
