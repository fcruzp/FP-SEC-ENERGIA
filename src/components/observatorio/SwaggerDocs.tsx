'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Documentación interactiva de /api/v1 con Swagger UI (cargado desde jsDelivr, versión fija).
 * Lee /api/v1/openapi.json; para probar un endpoint se pega la llave en "Authorize".
 */
const VERSION = '5.17.14'
const CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${VERSION}`

declare global {
  interface Window {
    SwaggerUIBundle?: ((options: Record<string, unknown>) => unknown) & { presets: { apis: unknown } }
  }
}

export default function SwaggerDocs() {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!document.querySelector(`link[data-swagger]`)) {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = `${CDN}/swagger-ui.css`
      css.dataset.swagger = 'true'
      document.head.appendChild(css)
    }
    const render = () => {
      if (!window.SwaggerUIBundle || !ref.current) return
      window.SwaggerUIBundle({
        domNode: ref.current,
        url: '/api/v1/openapi.json',
        presets: [window.SwaggerUIBundle.presets.apis],
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 0,
        displayRequestDuration: true,
        persistAuthorization: false,
        tryItOutEnabled: false,
      })
    }
    if (window.SwaggerUIBundle) {
      render()
      return
    }
    const script = document.createElement('script')
    script.src = `${CDN}/swagger-ui-bundle.js`
    script.async = true
    script.onload = render
    script.onerror = () => setError(true)
    document.body.appendChild(script)
  }, [])

  if (error) {
    return (
      <p className="text-sm text-red-700">
        No se pudo cargar el visor. El contrato está disponible en{' '}
        <a href="/api/v1/openapi.json" className="underline">/api/v1/openapi.json</a>.
      </p>
    )
  }
  return <div ref={ref} className="swagger-host" />
}
