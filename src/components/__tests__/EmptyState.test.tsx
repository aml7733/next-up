import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import EmptyState from '../EmptyState';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('EmptyState', () => {
  it('renders with default props', () => {
    const { getByText } = renderWithTheme(<EmptyState />);
    
    expect(getByText('No items found')).toBeTruthy();
    expect(getByText('There are no items to display at the moment.')).toBeTruthy();
  });

  it('renders with custom title and message', () => {
    const customTitle = 'No shows yet';
    const customMessage = 'Start tracking your favorite shows';
    
    const { getByText } = renderWithTheme(
      <EmptyState title={customTitle} message={customMessage} />
    );
    
    expect(getByText(customTitle)).toBeTruthy();
    expect(getByText(customMessage)).toBeTruthy();
  });

  it('renders with custom icon', () => {
    const customIcon = 'heart';
    const { getByTestId } = renderWithTheme(
      <EmptyState icon={customIcon} testID="empty-state" />
    );
    
    expect(getByTestId('empty-state-icon')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const actionText = 'Browse Shows';
    const onActionPress = jest.fn();
    
    const { getByText } = renderWithTheme(
      <EmptyState 
        actionText={actionText}
        onActionPress={onActionPress}
      />
    );
    
    expect(getByText(actionText)).toBeTruthy();
  });

  it('calls onActionPress when action button is pressed', () => {
    const onActionPress = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState 
        actionText="Browse Shows"
        onActionPress={onActionPress}
      />
    );
    
    const actionButton = getByText('Browse Shows');
    actionButton.props.onPress();
    
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it('applies custom style', () => {
    const customStyle = { backgroundColor: 'blue' };
    const { getByTestId } = renderWithTheme(
      <EmptyState style={customStyle} testID="empty-container" />
    );
    
    const container = getByTestId('empty-container');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = renderWithTheme(
      <EmptyState testID="empty-state" />
    );
    
    const container = getByTestId('empty-state');
    expect(container.props.accessibilityRole).toBe('text');
    expect(container.props.accessibilityLabel).toContain('No items found');
  });
});
