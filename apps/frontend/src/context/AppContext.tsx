import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { DEFAULTS, type Message, type Model } from '@app/shared';

/**
 * Extended message type for UI state
 */
interface UIMessage extends Message {
  isStreaming?: boolean;
}

/**
 * Application state structure
 */
interface AppState {
  messages: UIMessage[];
  currentModel: string;
  currentModelName: string;
  models: Model[];
  isLoading: boolean;
  isModalOpen: boolean;
}

/**
 * Action types enum
 */
export const ActionTypes = {
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_LAST_MESSAGE: 'UPDATE_LAST_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_MODELS: 'SET_MODELS',
  SELECT_MODEL: 'SELECT_MODEL',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  TOGGLE_MODAL: 'TOGGLE_MODAL',
} as const;

/**
 * Action type union
 */
type AppAction =
  | { type: typeof ActionTypes.ADD_MESSAGE; payload: UIMessage }
  | { type: typeof ActionTypes.UPDATE_LAST_MESSAGE; payload: string }
  | { type: typeof ActionTypes.SET_LOADING; payload: boolean }
  | { type: typeof ActionTypes.SET_MODELS; payload: Model[] }
  | { type: typeof ActionTypes.SELECT_MODEL; payload: { id: string; name: string } }
  | { type: typeof ActionTypes.CLEAR_MESSAGES }
  | { type: typeof ActionTypes.TOGGLE_MODAL };

/**
 * Context value type
 */
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  ActionTypes: typeof ActionTypes;
}

// Initial State
const initialState: AppState = {
  messages: [],
  currentModel: DEFAULTS.MODEL,
  currentModelName: DEFAULTS.MODEL_NAME,
  models: [],
  isLoading: false,
  isModalOpen: false,
};

/**
 * App reducer function
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case ActionTypes.UPDATE_LAST_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, content: action.payload, isStreaming: false }
            : msg
        ),
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.SET_MODELS:
      return {
        ...state,
        models: action.payload,
      };

    case ActionTypes.SELECT_MODEL:
      return {
        ...state,
        currentModel: action.payload.id,
        currentModelName: action.payload.name,
        isModalOpen: false,
      };

    case ActionTypes.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
      };

    case ActionTypes.TOGGLE_MODAL:
      return {
        ...state,
        isModalOpen: !state.isModalOpen,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<AppContextValue | null>(null);

/**
 * Provider component props
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * App Provider Component
 */
export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch, ActionTypes }}>{children}</AppContext.Provider>
  );
}

/**
 * Custom hook to access app context
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Export types for use in other components
export type { AppState, AppAction, UIMessage };
