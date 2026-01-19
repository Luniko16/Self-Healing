import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: Array<{
    id: string;
    label: string;
    type: 'select' | 'text' | 'checkbox';
    options?: FilterOption[];
    value?: string | string[];
    placeholder?: string;
  }>;
  onFilterChange: (filterId: string, value: any) => void;
  onReset?: () => void;
  compact?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  compact = false
}) => {
  const activeFilters = filters.filter((f) => f.value && f.value !== '' && (!Array.isArray(f.value) || f.value.length > 0));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Filter className="w-5 h-5" />
          <span className="font-medium text-sm">Filters</span>
        </div>

        <div className={`flex flex-wrap gap-3 flex-1 ${compact ? '' : 'flex-col lg:flex-row'}`}>
          {filters.map((filter) => {
            if (filter.type === 'select') {
              return (
                <select
                  key={filter.id}
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options?.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              );
            }

            if (filter.type === 'text') {
              return (
                <input
                  key={filter.id}
                  type="text"
                  placeholder={filter.placeholder || filter.label}
                  value={filter.value || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              );
            }

            if (filter.type === 'checkbox') {
              return (
                <label
                  key={filter.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(filter.value)}
                    onChange={(e) => onFilterChange(filter.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{filter.label}</span>
                </label>
              );
            }

            return null;
          })}
        </div>

        {activeFilters.length > 0 && onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center space-x-2"
            >
              <span>
                {filter.label}: {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
              </span>
              <button
                onClick={() =>
                  onFilterChange(
                    filter.id,
                    filter.type === 'checkbox' ? false : ''
                  )
                }
                className="hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
