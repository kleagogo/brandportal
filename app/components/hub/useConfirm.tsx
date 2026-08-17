'use client'

import { useCallback, useRef, useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Styles the confirm button as a destructive action. */
  destructive?: boolean
}

/**
 * `window.confirm`, replaced with the app's own dialog.
 *
 * Returns a promise so a call site reads the way the native one did:
 *
 *   if (!(await confirm({ title: 'Delete this?' }))) return
 *
 * Render `confirmDialog` anywhere in the component that uses it.
 */
export function useConfirm() {
  const [open, setOpen] = useState(false)
  // Kept after closing so the dialog can animate out with its text intact.
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    // A second call while one is open answers the first with "no", so its
    // caller is never left waiting on a promise that can't resolve.
    resolver.current?.(false)
    setOptions(next)
    setOpen(true)
    return new Promise<boolean>(resolve => { resolver.current = resolve })
  }, [])

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOpen(false)
  }, [])

  const confirmDialog = (
    <AlertDialog open={open} onOpenChange={next => { if (!next) settle(false) }}>
      {options && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {options.cancelLabel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options.destructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {options.confirmLabel || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )

  return { confirm, confirmDialog }
}
