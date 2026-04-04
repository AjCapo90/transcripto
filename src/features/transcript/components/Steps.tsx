import { motion } from 'motion/react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import './Steps.scss';

const STEPS = [
  { number: '01', title: 'Paste or Connect', text: 'Drop a YouTube URL or sign in with Google to browse your subscriptions.' },
  { number: '02', title: 'Select Videos', text: 'Pick one or multiple videos. See available languages and estimated processing time.' },
  { number: '03', title: 'Get Transcripts', text: 'Clean, formatted text ready to read, search, copy, or download.' },
] as const;

export function Steps() {
  return (
    <section className="steps" id="how-it-works">
      <div className="steps__container">
        <SectionHeader
          label="How it works"
          title={<>Three steps. That's it.</>}
        />

        <div className="steps__grid">
          {STEPS.map((step, index) => (
            <div className="steps__item" key={step.number}>
              {index > 0 && (
                <motion.div
                  className="steps__connector"
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <motion.div
                className="step"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="step__number">{step.number}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
