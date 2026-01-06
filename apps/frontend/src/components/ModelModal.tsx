import { useEffect, useState, MouseEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { getModels } from '../api/client';
import { Model } from '@app/shared';

function ModelModal(): React.JSX.Element {
  const { state, dispatch, ActionTypes } = useAppContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load if models not already loaded
    if (state.models.length > 0) return;

    const loadModels = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const models = await getModels();
        dispatch({ type: ActionTypes.SET_MODELS, payload: models });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void loadModels();
  }, [dispatch, ActionTypes, state.models.length]);

  const handleClose = (): void => {
    dispatch({ type: ActionTypes.TOGGLE_MODAL });
  };

  const handleSelect = (model: Model): void => {
    dispatch({
      type: ActionTypes.SELECT_MODEL,
      payload: { id: model.id, name: model.name }
    });
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>Select Model</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">Loading models...</div>}
          {error && <div className="error">Error: {error}</div>}
          {!loading && !error && (
            <div className="model-list">
              {state.models.map((model) => (
                <button
                  key={model.id}
                  className={`model-item ${model.id === state.currentModel ? 'selected' : ''}`}
                  onClick={() => handleSelect(model)}
                >
                  <div className="model-item-name">{model.name}</div>
                  {model.description && (
                    <div className="model-item-desc">{model.description}</div>
                  )}
                  {model.context_length && (
                    <div className="model-item-context">
                      Context: {model.context_length.toLocaleString()} tokens
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelModal;
