import { PlayIcon } from '../ui/Icons';
import './Footer.scss';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">
          <PlayIcon size={20} />
          Transcripto
        </p>
        <p className="footer__credit">
          Built by{' '}
          <a href="https://github.com/alessandrocapozzi" target="_blank" rel="noopener noreferrer">
            Alessandro Capozzi
          </a>
        </p>
        <nav className="footer__links" aria-label="Footer">
          <a href="https://github.com/alessandrocapozzi" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </nav>
      </div>
    </footer>
  );
}
