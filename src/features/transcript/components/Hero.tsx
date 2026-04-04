import { motion } from 'motion/react';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from '../../../components/ui/Icons';
import './Hero.scss';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__orb hero__orb--3" />
        <div className="hero__noise" />
      </div>

      <div className="hero__content">
        <motion.p
          className="hero__badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          YouTube Transcript Extractor
        </motion.p>

        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          Every word.<br />
          <span className="hero__title--accent">Extracted.</span>
        </motion.h1>

        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Paste a YouTube link, connect your account, or browse your subscriptions.
          Get clean, searchable transcripts in seconds.
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <a href="#demo">
            <Button variant="primary" size="lg" icon={<ArrowRightIcon size={20} />}>
              Try it now
            </Button>
          </a>
          <a href="#features">
            <Button variant="ghost" size="lg">Learn more</Button>
          </a>
        </motion.div>
      </div>

      <motion.div
        className="hero__scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <span>Scroll</span>
        <div className="hero__scroll-line" />
      </motion.div>
    </section>
  );
}
