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
}

// Input de dinero: punto para miles y coma para decimales (ej: "101.019").
// Mientras se edita se muestra el número sin separador de miles (coma como
// decimal); al salir del campo se reformatea con formatMoney.
export function MoneyInput({ id, value, onChange, className }: MoneyInputProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      value={focused ? text : formatMoney(value)}
      onFocus={() => {
        setFocused(true)
        setText(String(value).replace('.', ','))
      }}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parseMoneyInput(e.target.value))
      }}
      onBlur={() => setFocused(false)}
    />
  )
}
