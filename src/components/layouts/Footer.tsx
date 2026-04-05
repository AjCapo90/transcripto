import { PlayIcon, GitHubIcon, LinkedInIcon } from '../ui/Icons';
import './Footer.scss';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <p className="footer__brand">
            <PlayIcon size={20} />
            Transcripto
          </p>
          <p className="footer__credit">
            Built by Alessandro Capozzi
          </p>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <a href="https://github.com/AjCapo90" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GitHubIcon size={20} />
          </a>
          <a href="https://www.linkedin.com/in/alessandro-capozzi" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <LinkedInIcon size={20} />
          </a>
        </nav>
      </div>
    </footer>
  );
}
