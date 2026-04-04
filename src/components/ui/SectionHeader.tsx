import { type ReactNode } from 'react';
import { RevealOnScroll } from './RevealOnScroll';
import './SectionHeader.scss';

interface SectionHeaderProps {
  label: string;
  title: ReactNode;
  subtitle?: string;
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <RevealOnScroll>
        <p className="section-header__label">{label}</p>
      </RevealOnScroll>
      <RevealOnScroll delay={0.05}>
        <h2 className="section-header__title">{title}</h2>
      </RevealOnScroll>
      {subtitle && (
        <RevealOnScroll delay={0.1}>
          <p className="section-header__subtitle">{subtitle}</p>
        </RevealOnScroll>
      )}
    </div>
  );
}
