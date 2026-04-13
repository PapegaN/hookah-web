export interface DashboardMetric {
  id: string
  label: string
  value: string
  hint: string
}

export interface DashboardTask {
  id: string
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'ready'
}
