"use client";

import { useState, useRef, useEffect, FC } from "react";
import {
  Language,
  searchLanguages,
  getLanguageByCode,
  POPULAR_LANGUAGES,
} from "../data/languages";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  placeholder?: string;
}

export const LanguageSelector: FC<LanguageSelectorProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Search language...",
}: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = getLanguageByCode(value);

  useEffect(() => {
    const languages = searchLanguages(searchQuery);

    if (searchQuery.trim()) {
      setFilteredLanguages(languages);
      return;
    }

    const popular = languages.filter((lang) =>
      POPULAR_LANGUAGES.includes(lang.code)
    );

    const others = languages.filter(
      (lang) => !POPULAR_LANGUAGES.includes(lang.code)
    );

    setFilteredLanguages([...popular, ...others]);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    onChange(language.code);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    } else if (e.key === "Enter" && filteredLanguages.length > 0) {
      handleLanguageSelect(filteredLanguages[0]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <div
        className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer transition-colors ${
          disabled
            ? "border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
        onClick={handleInputClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedLanguage && (
              <>
                <span className="text-xl">{selectedLanguage.flag}</span>
                <span className="font-medium">{selectedLanguage.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({selectedLanguage.nativeName})
                </span>
              </>
            )}
            {!selectedLanguage && (
              <span className="text-gray-500 dark:text-gray-400">
                Select language...
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="overflow-y-auto max-h-64">
            {filteredLanguages.length > 0 ? (
              <>
                {!searchQuery.trim() && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-600">
                    Popular languages
                  </div>
                )}

                {filteredLanguages.map((language, index) => {
                  const isPopular = POPULAR_LANGUAGES.includes(language.code);
                  const showDivider =
                    !searchQuery.trim() &&
                    index > 0 &&
                    isPopular !==
                      POPULAR_LANGUAGES.includes(
                        filteredLanguages[index - 1].code
                      );

                  return (
                    <div key={language.code}>
                      {showDivider && (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-600">
                          Other languages
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          value === language.code
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                        onClick={() => handleLanguageSelect(language)}
                        data-umami-event="select-language"
                        data-umami-event-language={language.code}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{language.flag}</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {language.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {language.nativeName}
                            </div>
                          </div>
                          {value === language.code && (
                            <svg
                              className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-auto"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                No languages found matching &quot;{searchQuery}
                &quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
