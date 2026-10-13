import Icon from "../Icon";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.message}</span>

      {toast.action && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            toast.action.run();
            onClose();
          }}
        >
          {toast.action.label}
        </button>
      )}

      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
