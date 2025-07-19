import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void
}

const Select = ({ children, onValueChange, value, ...props }: SelectProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </select>
  )
}

const SelectContent = ({ children }: { children: React.ReactNode }) => children
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)
const SelectTrigger = ({ children }: { children: React.ReactNode }) => children
const SelectValue = () => null

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }