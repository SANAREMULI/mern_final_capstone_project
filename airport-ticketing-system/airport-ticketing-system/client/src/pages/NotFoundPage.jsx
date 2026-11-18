import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';

export default function NotFoundPage() {
  return (
    <div className="container section">
      <EmptyState title="Page not found" action={<Link to="/" className="btn btn--primary">Back to flights</Link>}>
        The page you are looking for has taken off without you.
      </EmptyState>
    </div>
  );
}
