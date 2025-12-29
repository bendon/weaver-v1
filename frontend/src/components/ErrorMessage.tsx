import { AlertCircle } from 'lucide-react';
import Card from './Card';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Card className="error-message" variant="outlined">
      <AlertCircle className="error-icon" />
      <p>{message}</p>
    </Card>
  );
}

