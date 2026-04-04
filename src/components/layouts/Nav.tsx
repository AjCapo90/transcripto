import { useScrolled } from '../../hooks/useScrolled';
import { Button } from '../ui/Button';
import { GoogleIcon, PlayIcon, LogOutIcon } from '../ui/Icons';
import './Nav.scss';

interface NavProps {
  isLoggedIn: boolean;
  onAuthToggle: () => void;
}

export function Nav({ isLoggedIn, onAuthToggle }: NavProps) {
  const isScrolled = useScrolled(50);

  return (
    <header className={`nav ${isScrolled ? 'nav--scrolled' : ''}`}>
      <nav aria-label="Main">
        <div className="nav__inner">
          <a href="#" className="nav__logo">
            <PlayIcon size={24} className="nav__logo-icon" />
            <span>Transcripto</span>
          </a>

          <ul className="nav__links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#demo">Try it</a></li>
          </ul>

          <Button
            variant="outline"
            size="sm"
            icon={isLoggedIn ? <LogOutIcon size={18} /> : <GoogleIcon size={18} />}
            onClick={onAuthToggle}
          >
            {isLoggedIn ? 'Sign out' : 'Sign in with Google'}
          </Button>
        </div>
      </nav>
    </header>
  );
}
