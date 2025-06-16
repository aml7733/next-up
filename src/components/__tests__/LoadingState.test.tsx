import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import LoadingState from '../LoadingState';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('LoadingState', () => {
  it('renders with default props', () => {
    const { getByText, getByTestId } = renderWithTheme(<LoadingState />);
    
    expect(getByText('Loading...')).toBeTruthy();
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const customMessage = 'Fetching your shows...';
    const { getByText } = renderWithTheme(<LoadingState message={customMessage} />);
    
    expect(getByText(customMessage)).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = renderWithTheme(
      <LoadingState style={customStyle} testID="loading-container" />
    );
    
    const container = getByTestId('loading-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = renderWithTheme(<LoadingState testID="loading-state" />);
    
    const container = getByTestId('loading-state');
    expect(container.props.accessibilityRole).toBe('progressbar');
    expect(container.props.accessibilityLabel).toBe('Loading content');
  });
});
