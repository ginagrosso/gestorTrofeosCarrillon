import { useState } from 'react'
import { formatMoney } from '@/shared/lib/money'
import { Input } from './input'

function parseMoneyInput(text: string): number {
  const normalizado = text.trim().replace(',', '.')
  const parsed = Number(normalizado)
  return Number.isFinite(parsed) ? parsed : 0
}

interface MoneyInputProps {
  id?: string
  value: number
  onChange: (value: number) => void
  className?: string
  /** false para precios que no admiten decimales (el cliente no trabaja con centavos). Default: true. */
  allowDecimals?: boolean
}

// Input de dinero: punto para miles y coma para decimales (ej: "101.019").
// Mientras se edita se muestra el número sin separador de miles (coma como
// decimal); al salir del campo se reformatea con formatMoney.
export function MoneyInput({ id, value, onChange, className, allowDecimals = true }: MoneyInputProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <Input
      id={id}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      className={className}
      value={focused ? text : formatMoney(value)}
      onFocus={() => {
        setFocused(true)
        setText(allowDecimals ? String(value).replace('.', ',') : String(Math.trunc(value)))
      }}
      onChange={(e) => {
        const raw = allowDecimals ? e.target.value : e.target.value.replace(/[.,]/g, '')
        setText(raw)
        onChange(allowDecimals ? parseMoneyInput(raw) : Math.trunc(parseMoneyInput(raw)))
      }}
      onBlur={() => setFocused(false)}
    />
  )
}
