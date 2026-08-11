'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Role } from '@/lib/roles'

type AdminContextValue = {
  role: Role
  email: string
  roleLabel: string
}

const Ctx = createContext<AdminContextValue | null>(null)

export function AdminProvider({ value, children }: { value: AdminContextValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdmin() {
  const c = useContext(Ctx)
  if (!c) return { role: 'admin' as Role, email: '', roleLabel: '' }
  return c
}
