import { motion } from 'motion/react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { LinkIcon, GoogleIcon, MonitorIcon } from '../../../components/ui/Icons';
import './Features.scss';

const FEATURES = [
  {
    icon: <LinkIcon size={24} />,
    title: 'Paste & Extract',
    text: 'Drop any YouTube URL and get a clean, formatted transcript instantly. Supports auto-generated and manual subtitles.',
  },
  {
    icon: <GoogleIcon size={24} />,
    title: 'Google Connected',
    text: 'Sign in with Google to see your subscriptions. Browse channels, pick videos, extract transcripts — all in one flow.',
  },
  {
    icon: <MonitorIcon size={24} />,
    title: 'Batch Processing',
    text: 'Select multiple videos at once. Track progress in real-time with a visual queue. Export transcripts individually or as a bundle.',
  },
] as const;

export function Features() {
  return (
    <section className="features" id="features">
      <div className="features__container">
        <SectionHeader
          label="Features"
          title={<>Built for speed.<br />Designed for clarity.</>}
        />

        <div className="features__grid">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="feature-card__icon">{feature.icon}</div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__text">{feature.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
