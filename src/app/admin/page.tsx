import { redirect } from 'next/navigation'

/** /admin lleva al panel del Observatorio, que es hoy la única sección del backoffice. */
export default function AdminIndexPage() {
  redirect('/admin/observatorio')
}
