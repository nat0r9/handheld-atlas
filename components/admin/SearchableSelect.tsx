"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface SearchableSelectOption {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  emptyText?: string;
  maxResults?: number;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function sortOptions(
  options: SearchableSelectOption[],
  query: string,
) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return options;
  }

  return [...options]
    .filter((option) =>
      normalize(option.name).includes(normalizedQuery),
    )
    .sort((first, second) => {
      const firstName = normalize(first.name);
      const secondName = normalize(second.name);
      const firstStarts = firstName.startsWith(normalizedQuery);
      const secondStarts = secondName.startsWith(normalizedQuery);

      if (firstStarts !== secondStarts) {
        return firstStarts ? -1 : 1;
      }

      const firstIndex = firstName.indexOf(normalizedQuery);
      const secondIndex = secondName.indexOf(normalizedQuery);

      if (firstIndex !== secondIndex) {
        return firstIndex - secondIndex;
      }

      return first.name.localeCompare(second.name);
    });
}

export default function SearchableSelect({
  label,
  name,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  emptyText = "No results found",
  maxResults = 10,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = `${name}-searchable-listbox`;
  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );
  const [query, setQuery] = useState(selectedOption?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const searchQuery = isOpen
    ? query
    : selectedOption?.name ?? query;

  const visibleOptions = useMemo(
    () => sortOptions(options, searchQuery).slice(0, maxResults),
    [maxResults, options, searchQuery],
  );

  function selectOption(option: SearchableSelectOption) {
    onChange(option.id);
    setQuery(option.name);
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={`${name}-search`}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <input type="hidden" name={name} value={value} />

      <div className="relative">
        <input
          ref={inputRef}
          id={`${name}-search`}
          type="text"
          value={searchQuery}
          onFocus={() => {
            setQuery(selectedOption?.name ?? "");
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setActiveIndex(0);
            setIsOpen(true);

            if (
              selectedOption &&
              nextQuery !== selectedOption.name
            ) {
              onChange("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((currentIndex) =>
                Math.min(currentIndex + 1, visibleOptions.length - 1),
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((currentIndex) =>
                Math.max(currentIndex - 1, 0),
              );
            }

            if (event.key === "Enter") {
              if (isOpen && visibleOptions[activeIndex]) {
                event.preventDefault();
                selectOption(visibleOptions[activeIndex]);
              }
            }

            if (event.key === "Escape") {
              setIsOpen(false);
              setQuery(selectedOption?.name ?? "");
            }
          }}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label={`Clear ${label}`}
              className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-800 hover:text-white"
            >
              ×
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);
              window.setTimeout(() => inputRef.current?.focus(), 0);
            }}
            aria-label={`Open ${label} options`}
            className="rounded-lg px-2 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-800 hover:text-cyan-300"
          >
            ⌄
          </button>
        </div>
      </div>

      {required && !value && query.trim().length > 0 && (
        <p className="mt-2 text-xs text-orange-300">
          Pick an item from the list to save this field.
        </p>
      )}

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
        >
          {visibleOptions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              {emptyText}
            </p>
          ) : (
            visibleOptions.map((option, index) => {
              const isSelected = option.id === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                    isSelected
                      ? "bg-cyan-500/15 text-cyan-300"
                      : isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.name}</span>

                  {isSelected && (
                    <span className="shrink-0 text-cyan-300">✓</span>
                  )}
                </button>
              );
            })
          )}

          {sortOptions(options, searchQuery).length > maxResults && (
            <p className="px-3 py-2 text-xs text-slate-600">
              Keep typing to narrow the list.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
