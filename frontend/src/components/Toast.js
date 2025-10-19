import { useState, useEffect } from 'preact/hooks';
import { styled } from 'goober';

const ToastContainer = styled('div')`
  min-width: 300px;
  max-width: 500px;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease-out;
  position: relative;
  overflow: hidden;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
      case 'error':
        return `
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
      case 'warning':
        return `
          background-color: #fffbeb;
          border: 1px solid #fed7aa;
          color: #d97706;
        `;
      default:
        return `
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        `;
    }
  }}
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const Icon = styled('div')`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
`;

const Message = styled('div')`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
`;

const CloseButton = styled('button')`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
  
  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const ProgressBar = styled('div')`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
  animation: progress ${props => props.duration}ms linear;
  
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

export function Toast({ message, type = 'info', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <ToastContainer type={type}>
      <Icon>{getIcon()}</Icon>
      <Message>{message}</Message>
      <CloseButton onClick={onClose} aria-label="Close notification">
        ✕
      </CloseButton>
      <ProgressBar duration={duration} />
    </ToastContainer>
  );
}