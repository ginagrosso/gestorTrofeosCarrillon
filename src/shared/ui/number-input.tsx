import { useState } from 'react'
import { Input } from './input'

function parseNumberInput(text: string, allowDecimals: boolean): number | undefined {
  const normalizado = text.trim().replace(',', '.')
  if (normalizado === '' || normalizado === '-' || normalizado === '.' || normalizado === '-.') return undefined
  const parsed = Number(normalizado)
  if (!Number.isFinite(parsed)) return undefined
  return allowDecimals ? parsed : Math.trunc(parsed)
}

interface NumberInputProps {
  id?: string
  value: number | null | undefined
  onChange: (value: number | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  /** false para cantidades/enteros que no admiten decimales. Default: true. */
  allowDecimals?: boolean
}

// Input numérico genérico (cantidades, porcentajes, stock, contadores…).
// Usa type="text" + inputMode para evitar los quirks del <input type="number">
// nativo (spinner, cero pegado, ceros a la izquierda). Mientras se edita se
// guarda el texto crudo, por lo que el campo se puede vaciar por completo sin
// que "vuelva" al 0 por defecto. Emite `undefined` cuando queda vacío.
export function NumberInput({
  id,
  value,
  onChange,
  className,
  placeholder,
  disabled,
  allowDecimals = true,
}: NumberInputProps) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  const displayValue = focused
    ? text
    : value == null || Number.isNaN(value)
      ? ''
      : String(value)

  return (
    <Input
      id={id}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      value={displayValue}
      onFocus={() => {
        setFocused(true)
        setText(value == null || Number.isNaN(value) ? '' : String(value))
      }}
      onChange={(e) => {
        const raw = allowDecimals
          ? e.target.value.replace(/[^0-9.,-]/g, '')
          : e.target.value.replace(/[^0-9-]/g, '')
        setText(raw)
        onChange(parseNumberInput(raw, allowDecimals))
      }}
      onBlur={() => setFocused(false)}
    />
  )
}
