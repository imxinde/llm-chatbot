import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext, ActionTypes } from './AppContext';
import { DEFAULTS } from '@app/shared';

describe('ActionTypes', () => {
  it('should have all required action types', () => {
    expect(ActionTypes.ADD_MESSAGE).toBe('ADD_MESSAGE');
    expect(ActionTypes.UPDATE_LAST_MESSAGE).toBe('UPDATE_LAST_MESSAGE');
    expect(ActionTypes.SET_LOADING).toBe('SET_LOADING');
    expect(ActionTypes.SET_MODELS).toBe('SET_MODELS');
    expect(ActionTypes.SELECT_MODEL).toBe('SELECT_MODEL');
    expect(ActionTypes.CLEAR_MESSAGES).toBe('CLEAR_MESSAGES');
    expect(ActionTypes.TOGGLE_MODAL).toBe('TOGGLE_MODAL');
  });
});

describe('useAppContext', () => {
  it('should throw error when used outside Provider', () => {
    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');
  });

  it('should return context when used inside Provider', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    expect(result.current.state).toBeDefined();
    expect(result.current.dispatch).toBeDefined();
    expect(result.current.ActionTypes).toBe(ActionTypes);
  });
});

describe('Initial State', () => {
  it('should have correct default values', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: AppProvider,
    });

    expect(result.current.state.messages).toEqual([]);
    expect(result.current.state.currentModel).toBe(DEFAULTS.MODEL);
    expect(result.current.state.currentModelName).toBe(DEFAULTS.MODEL_NAME);
    expect(result.current.state.models).toEqual([]);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.isModalOpen).toBe(false);
  });
});

describe('appReducer', () => {
  describe('ADD_MESSAGE', () => {
    it('should add message to the list', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      const newMessage = {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
      };

      act(() => {
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: newMessage,
        });
      });

      expect(result.current.state.messages).toHaveLength(1);
      expect(result.current.state.messages[0]).toEqual(newMessage);
    });

    it('should append multiple messages', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '1', role: 'user' as const, content: 'First' },
        });
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '2', role: 'assistant' as const, content: 'Second' },
        });
      });

      expect(result.current.state.messages).toHaveLength(2);
      const firstMsg = result.current.state.messages[0];
      const secondMsg = result.current.state.messages[1];
      expect(firstMsg?.content).toBe('First');
      expect(secondMsg?.content).toBe('Second');
    });
  });

  describe('UPDATE_LAST_MESSAGE', () => {
    it('should update the last message content', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '1', role: 'assistant' as const, content: 'Hello', isStreaming: true },
        });
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: 'Hello World',
        });
      });

      const firstMsg = result.current.state.messages[0];
      expect(firstMsg?.content).toBe('Hello World');
      expect(firstMsg?.isStreaming).toBe(false);
    });

    it('should only update the last message', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '1', role: 'user' as const, content: 'First' },
        });
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '2', role: 'assistant' as const, content: 'Second' },
        });
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: 'Updated',
        });
      });

      const firstMsg = result.current.state.messages[0];
      const secondMsg = result.current.state.messages[1];
      expect(firstMsg?.content).toBe('First');
      expect(secondMsg?.content).toBe('Updated');
    });

    it('should not crash when messages list is empty', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      // Should not throw
      act(() => {
        result.current.dispatch({
          type: ActionTypes.UPDATE_LAST_MESSAGE,
          payload: 'Test',
        });
      });

      expect(result.current.state.messages).toEqual([]);
    });
  });

  describe('SET_LOADING', () => {
    it('should set isLoading to true', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.SET_LOADING,
          payload: true,
        });
      });

      expect(result.current.state.isLoading).toBe(true);
    });

    it('should set isLoading to false', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        result.current.dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      });

      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('SET_MODELS', () => {
    it('should set models list', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      const models = [
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' },
      ];

      act(() => {
        result.current.dispatch({
          type: ActionTypes.SET_MODELS,
          payload: models,
        });
      });

      expect(result.current.state.models).toEqual(models);
    });
  });

  describe('SELECT_MODEL', () => {
    it('should update currentModel and currentModelName', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({
          type: ActionTypes.SELECT_MODEL,
          payload: { id: 'gpt-4', name: 'GPT-4' },
        });
      });

      expect(result.current.state.currentModel).toBe('gpt-4');
      expect(result.current.state.currentModelName).toBe('GPT-4');
    });

    it('should close modal when selecting model', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      // Open modal first
      act(() => {
        result.current.dispatch({ type: ActionTypes.TOGGLE_MODAL });
      });
      expect(result.current.state.isModalOpen).toBe(true);

      // Select model should close it
      act(() => {
        result.current.dispatch({
          type: ActionTypes.SELECT_MODEL,
          payload: { id: 'gpt-4', name: 'GPT-4' },
        });
      });

      expect(result.current.state.isModalOpen).toBe(false);
    });
  });

  describe('CLEAR_MESSAGES', () => {
    it('should clear all messages', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      // Add some messages first
      act(() => {
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '1', role: 'user' as const, content: 'Hello' },
        });
        result.current.dispatch({
          type: ActionTypes.ADD_MESSAGE,
          payload: { id: '2', role: 'assistant' as const, content: 'Hi' },
        });
      });

      expect(result.current.state.messages).toHaveLength(2);

      // Clear messages
      act(() => {
        result.current.dispatch({ type: ActionTypes.CLEAR_MESSAGES });
      });

      expect(result.current.state.messages).toEqual([]);
    });
  });

  describe('TOGGLE_MODAL', () => {
    it('should toggle isModalOpen from false to true', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      expect(result.current.state.isModalOpen).toBe(false);

      act(() => {
        result.current.dispatch({ type: ActionTypes.TOGGLE_MODAL });
      });

      expect(result.current.state.isModalOpen).toBe(true);
    });

    it('should toggle isModalOpen from true to false', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider,
      });

      act(() => {
        result.current.dispatch({ type: ActionTypes.TOGGLE_MODAL });
        result.current.dispatch({ type: ActionTypes.TOGGLE_MODAL });
      });

      expect(result.current.state.isModalOpen).toBe(false);
    });
  });
});
