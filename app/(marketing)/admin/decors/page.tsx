import { DecorAdminClient } from './DecorAdminClient'

export const metadata = {
  title: 'DecorViz | Decor Manager',
  description: 'Create, update, and delete decor entries.',
}

export default function DecorAdminPage() {
  return <DecorAdminClient />
}
