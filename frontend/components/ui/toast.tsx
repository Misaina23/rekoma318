'use client'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { type ReactNode } from 'react'

const SweetAlert = withReactContent(Swal)

export function ToastProvider({ children }: { children: ReactNode }) {
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
