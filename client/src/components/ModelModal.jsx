import { useEffect } from 'react';
import { useAppContext, ActionTypes } from '../context/AppContext';

export default function ModelModal() {
  const { state, dispatch } = useAppContext();

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        if (data.models) {
          dispatch({ type: ActionTypes.SET_MODELS, payload: data.models });
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    loadModels();
  }, [dispatch]);

  const handleClose = () => {
    dispatch({ type: ActionTypes.TOGGLE_MODAL, payload: false });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSelectModel = (model) => {
    dispatch({
      type: ActionTypes.SELECT_MODEL,
      payload: { id: model.id, name: model.name }
    });
  };

  return (
    <div 
      className={`modal-overlay ${state.isModalOpen ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>选择模型</h3>
          <button className="btn-icon modal-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="model-list">
            {state.models.length === 0 ? (
              <div className="loading">加载模型列表中...</div>
            ) : (
              state.models.map((model) => (
                <div
                  key={model.id}
                  className={`model-item ${model.id === state.currentModel ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model)}
                >
                  <div className="model-item-name">{model.name}</div>
                  <div className="model-item-desc">{model.description || model.id}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
