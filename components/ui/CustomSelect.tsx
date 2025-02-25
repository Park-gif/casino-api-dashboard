"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  icon?: React.ReactNode
}

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select option', 
  className = '',
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div ref={selectRef} className={`relative w-[160px] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full bg-white text-[13px] font-medium text-gray-700 pl-3 pr-2 h-8 rounded-md border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#18B69B]/20 transition-all"
      >
        {selectedOption?.icon && (
          <span className="flex-shrink-0 w-4 flex justify-center">{selectedOption.icon}</span>
        )}
        <span className="flex-1 text-left truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`flex-shrink-0 h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-[200px] mt-1 bg-white rounded-md border border-gray-200 shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 h-9 text-[13px] hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                value === option.value 
                  ? 'text-[#18B69B] bg-[#18B69B]/5 font-medium' 
                  : 'text-gray-700'
              }`}
            >
              {option.icon && <span className="flex-shrink-0 w-4 flex justify-center">{option.icon}</span>}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 
