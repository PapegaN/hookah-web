const formatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatDateTime(value?: string) {
  if (!value) {
    return '—'
  }

  return formatter.format(new Date(value))
}
