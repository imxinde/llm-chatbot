import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { getModels } from '../api/client.js';

function ModelModal() {
  const { state, dispatch, ActionTypes } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only load if models not already loaded
    if (state.models.length > 0) return;

    const loadModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const models = await getModels();
        dispatch({ type: ActionTypes.SET_MODELS, payload: models });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [dispatch, ActionTypes, state.models.length]);

  const handleClose = () => {
    dispatch({ type: ActionTypes.TOGGLE_MODAL });
  };

  const handleSelect = (model) => {
    dispatch({
      type: ActionTypes.SELECT_MODEL,
      payload: { id: model.id, name: model.name }
    });
  };

  const handleBackdropClick = (e) => {
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
