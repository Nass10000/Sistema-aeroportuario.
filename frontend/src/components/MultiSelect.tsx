import React from 'react';
import Select from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: Option[];
  onChange: (selected: Option[]) => void;
  placeholder?: string;
  isMulti?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  isMulti = true,
  className = "",
  label,
  required = false
}) => {
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#1f2937',
      borderColor: state.isFocused ? '#3b82f6' : '#374151',
      color: '#ffffff',
      minHeight: '42px',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#374151'
        : '#1f2937',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#374151',
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#374151',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#ffffff',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      '&:hover': {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#ffffff',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#ffffff',
    }),
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <Select
        isMulti={isMulti}
        options={options}
        value={value}
        onChange={(selected) => onChange(selected as Option[])}
        placeholder={placeholder}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        noOptionsMessage={() => "No hay opciones disponibles"}
        loadingMessage={() => "Cargando..."}
      />
    </div>
  );
};

export default MultiSelect;
