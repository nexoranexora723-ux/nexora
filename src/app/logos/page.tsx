export default function LogosPage() {
  const logos = [
    { id: 1, name: 'Moderno y Geométrico', desc: 'Letra N con formas geométricas. Gradiente azul. Minimalista y corporativo.' },
    { id: 2, name: 'Premium y Elegante', desc: 'Letra N dorada con serif. Silueta de barco. Fondo azul marino. Lujo y sofisticación.' },
    { id: 3, name: 'Dinámico y Tech', desc: 'Letra N formada por flechas. Simboliza importación y entrega. Estilo startup.' },
    { id: 4, name: 'Global y Redondeado', desc: 'Letra N en cuadrado redondeado con mapa mundi. Gradiente azul a verde.' },
    { id: 5, name: 'Olas del Océano', desc: 'Letra N con líneas que fluyen como olas. Representa importación marítima.' },
  ]
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-2">Logos para NEXORA</h1>
        <p className="text-center text-muted-foreground mb-12">Elige el que más te guste. Dime el número.</p>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo) => (
            <div key={logo.id} className="rounded-2xl border-2 border-border overflow-hidden bg-card shadow-lg transition-all hover:shadow-xl hover:border-primary">
              <div className="bg-white p-8 flex items-center justify-center" style={{ minHeight: '250px' }}>
                <img 
                  src={`/logos/logo-v${logo.id}.png`} 
                  alt={`Logo opción ${logo.id}`}
                  className="max-w-full max-h-[250px] object-contain"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {logo.id}
                  </span>
                  <h2 className="font-semibold">{logo.name}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{logo.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
