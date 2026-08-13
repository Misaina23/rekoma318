'use client'

import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { type ReactNode } from 'react'
import { useTheme } from 'next-themes'

const SweetAlert = withReactContent(Swal)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [resolved, setResolved] = useState(theme)

  useEffect(() => {
    if (theme) setResolved(theme)
  }, [theme])

  useEffect(() => {
    const isDark = resolved === 'dark'
    const bg = isDark ? '#1f2937' : '#ffffff'
    const color = isDark ? '#f9fafb' : '#111827'
    const border = isDark ? '#374151' : '#e5e7eb'

    const style = document.createElement('style')
    style.id = 'sweetalert-theme'
    style.innerHTML = `
      .swal2-popup {
        background: ${bg} !important;
        color: ${color} !important;
        border: 1px solid ${border} !important;
      }
      .swal2-title {
        color: ${color} !important;
      }
      .swal2-html-container {
        color: ${color} !important;
      }
      .swal2-confirm {
        background: var(--tw-bg-primary, #2563eb) !important;
      }
      .swal2-cancel {
        background: ${isDark ? '#374151' : '#f3f4f6'} !important;
        color: ${color} !important;
      }
    `
    const existing = document.getElementById('sweetalert-theme')
    if (existing) existing.remove()
    document.head.appendChild(style)

    return () => {
      const el = document.getElementById('sweetalert-theme')
      if (el) el.remove()
    }
  }, [resolved])

  return <>{children}</>
}

export function useToast() {
  return async (message: string, type: 'success' | 'error' = 'success') => {
    await SweetAlert.fire({
      title: type === 'success' ? 'Succès' : 'Erreur',
      text: message,
      icon: type,
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-3xl',
      },
    })
  }
}

export async function confirmDialog(message: string, title = 'Confirmer') {
  const result = await SweetAlert.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui',
    cancelButtonText: 'Non',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-3xl',
    },
  })

  return result.isConfirmed
}
