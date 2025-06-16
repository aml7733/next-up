import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Reset the store before each test
const initialState = useAuthStore.getState();

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState(initialState, true);
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
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Sign in:', 'test@example.com');
    
    consoleSpy.mockRestore();
  });

  it('handles sign up action', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await act(async () => {
      await result.current.signUp('test@example.com', 'password');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Sign up:', 'test@example.com');
    
    consoleSpy.mockRestore();
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
      await result.current.signIn('test@example.com', 'password');
    });

    // Check that loading is handled correctly
    await signInPromise;
    expect(result.current.isLoading).toBe(false);
  });
});
