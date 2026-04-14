import React, { ReactNode } from 'react';

type ButtonWithIconAndTextVerticalProps = {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  testid: string;
  isActive?: boolean;
  compact?: boolean;
};

const ButtonWithIconAndTextVertical: React.FC<
  ButtonWithIconAndTextVerticalProps
> = ({ icon, text, onClick, testid, isActive = false, compact = false }) => {
  return (
    <div data-testid={testid}>
      <button
        type='button'
        className={`
          relative w-full rounded-lg text-xs font-medium
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          ${compact ? 'p-1.5' : 'p-2.5'}
          ${
            isActive
              ? compact
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-600 text-white shadow-md scale-105'
              : compact
              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:scale-105'
          }
        `}
        onClick={onClick}
      >
        <div className={`flex items-center justify-center flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
          {icon && (
            <span className={`transition-transform duration-200 ${
              isActive && !compact ? 'scale-110' : ''
            }`}>
              {icon}
            </span>
          )}
          <span
            className={`text-center break-words ${
              compact ? 'text-[9px] leading-[1.05rem]' : 'text-[10px] leading-tight'
            }`}
          >
            {text}
          </span>
        </div>
        {isActive && (
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-blue-600 rounded-r-full ${
              compact ? 'h-6' : 'h-8'
            }`}
          />
        )}
      </button>
    </div>
  );
};

export default ButtonWithIconAndTextVertical;
