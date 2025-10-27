
import React from 'react';
import { LanguageOption } from '../types';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguage: LanguageOption;
  onLanguageChange: (language: LanguageOption) => void;
  disabled: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange, disabled }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = LANGUAGES.find(lang => lang.code === event.target.value);
    if (selectedLang) {
      onLanguageChange(selectedLang);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <label htmlFor="language-select" className="mb-2 text-sm font-medium text-slate-400">
        I want to practice...
      </label>
      <select
        id="language-select"
        value={selectedLanguage.code}
        onChange={handleChange}
        disabled={disabled}
        className="w-full max-w-xs px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
