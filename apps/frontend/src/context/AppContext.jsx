import { createContext, useContext, useReducer } from 'react';
import { DEFAULTS } from '@app/shared';

// Action Types
export const ActionTypes = {
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_LAST_MESSAGE: 'UPDATE_LAST_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_MODELS: 'SET_MODELS',
  SELECT_MODEL: 'SELECT_MODEL',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  TOGGLE_MODAL: 'TOGGLE_MODAL'
};

// Initial State
const initialState = {
  messages: [],
  currentModel: DEFAULTS.MODEL,
  currentModelName: DEFAULTS.MODEL_NAME,
  models: [],
  isLoading: false,
  isModalOpen: false
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };

    case ActionTypes.UPDATE_LAST_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, content: action.payload, isStreaming: false }
            : msg
        )
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.SET_MODELS:
      return {
        ...state,
        models: action.payload
      };

    case ActionTypes.SELECT_MODEL:
      return {
        ...state,
        currentModel: action.payload.id,
        currentModelName: action.payload.name,
        isModalOpen: false
      };

    case ActionTypes.CLEAR_MESSAGES:
      return {
        ...state,
        messages: []
      };

    case ActionTypes.TOGGLE_MODAL:
      return {
        ...state,
        isModalOpen: !state.isModalOpen
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext(null);

// Provider Component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch, ActionTypes }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
