interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

/**
 * Animated loading spinner with optional message
 */
export default function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner--${size}`} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      {message && <p className="loading-message">{message}</p>}
      <span className="visually-hidden">Loading{message ? `: ${message}` : '...'}</span>
    </div>
  )
}
