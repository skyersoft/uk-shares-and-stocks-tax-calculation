import React from 'react';
import { render } from '@testing-library/react';
import { CalculationProvider, useCalculation } from '../context/CalculationContext';

function Probe(){
  const { state } = useCalculation();
  return <div data-testid="status">{state.status}</div>;
}

test('context initializes with idle status', () => {
  const { getByTestId } = render(<CalculationProvider><Probe /></CalculationProvider>);
  expect(getByTestId('status').textContent).toBe('idle');
});
