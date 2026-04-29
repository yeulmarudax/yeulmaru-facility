export type Department = 'admin' | 'electric' | 'facility' | 'fire' | 'maintenance'

export interface User {
  id: string
  email: string
  name: string
  department: Department
  created_at: string
}

export interface WorkLog {
  id: string
  user_id: string
  department: Department
  date: string
  content: string
  created_at: string
  updated_at: string
}