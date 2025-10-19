import { render } from 'preact';
import { Router } from 'preact-router';
import { App } from './components/App';
import { SearchPage } from './pages/SearchPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import './styles/global.css';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// App component with routing
function MainApp() {
  return (
    <App>
      <Router>
        <SearchPage path="/" />
        <ResultsPage path="/results/:searchId" />
        <HistoryPage path="/history" />
        <AnalyticsPage path="/analytics" />
      </Router>
    </App>
  );
}

// Render the app
render(<MainApp />, document.getElementById('app'));