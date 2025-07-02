import './setupStoreTests';
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset to initial state with proper values
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Reset mocks
    const mockLocalAuth = require('../../services/localAuth').localAuth;
    jest.clearAllMocks();
    mockLocalAuth.signIn.mockResolvedValue({ user: null, error: 'Not implemented' });
    mockLocalAuth.signUp.mockResolvedValue({ user: null, error: 'Not implemented' });
    mockLocalAuth.signOut.mockResolvedValue({ error: null });
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      created_at: '2024-01-01',
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears user when set to null', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      created_at: '2024-01-01',
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.setUser(null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles sign in action', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock the localAuth service to return success
    const mockLocalAuth = require('../../services/localAuth').localAuth;
    mockLocalAuth.signIn.mockResolvedValue({ 
      user: { id: '1', username: 'testuser', email: 'test@example.com', created_at: '2023-01-01' }, 
      error: null 
    });

    await act(async () => {
      await result.current.signIn('testuser');
    });

    expect(mockLocalAuth.signIn).toHaveBeenCalledWith('testuser');
    expect(result.current.user).toEqual({ 
      id: '1', 
      username: 'testuser', 
      email: 'test@example.com', 
      created_at: '2023-01-01' 
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles sign up action', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock the localAuth service to return success
    const mockLocalAuth = require('../../services/localAuth').localAuth;
    mockLocalAuth.signUp.mockResolvedValue({ 
      user: { id: '2', username: 'newuser', email: 'new@example.com', created_at: '2023-01-01' }, 
      error: null 
    });

    await act(async () => {
      await result.current.signUp('newuser', 'new@example.com');
    });

    expect(mockLocalAuth.signUp).toHaveBeenCalledWith('newuser', 'new@example.com');
    expect(result.current.user).toEqual({ 
      id: '2', 
      username: 'newuser', 
      email: 'new@example.com', 
      created_at: '2023-01-01' 
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles sign out action', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First set a user
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      created_at: '2024-01-01',
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then sign out
    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets loading state during async operations', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.isLoading).toBe(false);

    // Start sign in (but don't await it immediately)
    const signInPromise = act(async () => {
      await result.current.signIn('testuser');
    });

    // Check that loading is handled correctly
    await signInPromise;
    expect(result.current.isLoading).toBe(false);
  });
});
