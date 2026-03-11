import React from 'react';
import Select, { StylesConfig } from 'react-select';
import { GOOGLE_FONTS } from '../constants/fonts';

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

const FontPicker: React.FC<FontPickerProps> = ({ value, onChange }) => {
  const options = GOOGLE_FONTS.map(font => ({
    value: font,
    label: font,
  }));

  const customStyles: StylesConfig<{ value: string; label: string }, false> = {
    control: (base) => ({
      ...base,
      backgroundColor: '#09090b', // zinc-950
      borderColor: '#27272a', // zinc-800
      borderRadius: '0.75rem', // rounded-xl
      padding: '2px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3f3f46', // zinc-700
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#09090b',
      border: '1px solid #27272a',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#18181b' : 'transparent',
      color: state.isSelected ? '#10b981' : '#e4e4e7',
      fontFamily: state.data.value,
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#27272a',
      }
    }),
    singleValue: (base, state) => ({
      ...base,
      color: '#e4e4e7',
      fontFamily: state.data.value,
    }),
    input: (base) => ({
      ...base,
      color: '#e4e4e7',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#71717a',
    }),
  };

  return (
    <div className="w-full">
      {/* Load the font preview for the current selection and some popular ones */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${value.replace(/ /g, '+')}&display=swap`}
      />
      <Select
        options={options}
        value={options.find(opt => opt.value === value)}
        onChange={(opt) => opt && onChange(opt.value)}
        styles={customStyles}
        placeholder="Seleccionar fuente..."
        isSearchable
      />
    </div>
  );
};

export default FontPicker;
