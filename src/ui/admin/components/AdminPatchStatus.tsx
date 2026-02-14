interface AdminPatchStatusProps {
  dirty: boolean
  updatedAt: string
}

export function AdminPatchStatus({ dirty, updatedAt }: AdminPatchStatusProps) {
  return (
    <div className="admin-status">
      <span className={dirty ? 'dirty' : 'clean'}>{dirty ? 'Ungespeicherte Aenderungen' : 'Gespeichert'}</span>
      <span>Patch: {updatedAt}</span>
    </div>
  )
}
