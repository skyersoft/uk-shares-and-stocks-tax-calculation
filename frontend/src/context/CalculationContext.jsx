import React, { createContext, useContext, useReducer } from 'react';

const CalculationContext = createContext();

const initialState = {
  status: 'idle', // idle|submitting|success|error
  error: null,
  result: null,
  raw: null
};

function reducer(state, action) {
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
export function CalculationProvider({ children, initialState: initialOverride }) {
  const [state, dispatch] = useReducer(reducer, initialOverride || initialState);
  return (
    <CalculationContext.Provider value={{ state, dispatch }}>
      {children}
    </CalculationContext.Provider>
  );
}

export function useCalculation() {
  const ctx = useContext(CalculationContext);
  if (!ctx) throw new Error('useCalculation must be used within CalculationProvider');
  return ctx;
}
