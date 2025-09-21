import React, { createContext, useContext, useReducer } from 'react';

interface CalculationState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  error: string | null;
  result: any | null;
  raw: any | null;
}

interface CalculationAction {
  type: 'SUBMIT_START' | 'SUBMIT_SUCCESS' | 'SUBMIT_ERROR';
  payload?: any;
}

interface CalculationContextType {
  state: CalculationState;
  dispatch: React.Dispatch<CalculationAction>;
}

interface CalculationProviderProps {
  children: React.ReactNode;
  initialState?: CalculationState;
}

const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

const initialState: CalculationState = {
  status: 'idle', // idle|submitting|success|error
  error: null,
  result: null,
  raw: null
};

function reducer(state: CalculationState, action: CalculationAction): CalculationState {
  switch (action.type) {
    case 'SUBMIT_START':
      return { ...state, status: 'submitting', error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'success', result: action.payload.normalized, raw: action.payload.raw };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'error', error: action.payload };
    default:
      return state;
  }
}

// Accept an optional initialState override for testing (TDD support without exposing internal context)
export const CalculationProvider: React.FC<CalculationProviderProps> = ({ children, initialState: initialOverride }) => {
  const [state, dispatch] = useReducer(reducer, initialOverride || initialState);
  return (
    <CalculationContext.Provider value={{ state, dispatch }}>
      {children}
    </CalculationContext.Provider>
  );
}

export function useCalculation(): CalculationContextType {
  const ctx = useContext(CalculationContext);
  if (!ctx) throw new Error('useCalculation must be used within CalculationProvider');
  return ctx;
}
