import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, Send, ExternalLink, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionHeading, Button } from '../components/ui';

const RESOURCE_GROUPS = [
  {
    title: 'Talk to someone',
    items: [
      { name: 'Find a licensed therapist', desc: 'Browse counselors who specialize in relationships.' },
      { name: 'Couples & family counseling', desc: 'Structured sessions for two (or more).' },
      { name: 'Support groups near you', desc: 'Connect with others navigating similar bonds.' },
    ],
  },
  {
    title: 'Mentors & guides',
    items: [
      { name: 'Relationship coaches', desc: 'One-on-one guidance for specific goals.' },
      { name: 'Community elders & mentors', desc: 'Wisdom from people who have been there.' },
    ],
  },
  {
    title: 'If things feel urgent',
    items: [
      { name: 'Crisis text & hotlines', desc: 'Free, confidential support, any time of day.' },
      { name: 'Local emergency resources', desc: 'For situations that need immediate help.' },
    ],
  },
];

export default function Village() {
  const { activeBond, activePerson, otherPerson, addVaultEntry } = useApp();
  const [sent, setSent] = useState(false);

  if (!activeBond || !activePerson || !otherPerson) return null;

  function sendSignal() {
    addVaultEntry({
      personId: activePerson!.id,
      category: 'worry',
      content: `💛 ${activePerson!.name} sent a support signal — could use some extra care this week.`,
      visibility: 'shared',
    });
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeading
        eyebrow="Village"
        title="You don't have to do this alone"
        description="Curated support beyond the two of you — because a healthy bond leans on a wider circle."
      />

      <Card className="p-6 bond-bg-soft border-none flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bond-bg-accent text-white flex items-center justify-center shrink-0">
          <HeartHandshake size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Need extra care right now?</p>
          <p className="text-[13px] text-black/50">
            Quietly let {otherPerson.name} know, without needing to explain yet.
          </p>
        </div>
        <Button onClick={sendSignal} size="sm">
          <Send size={14} /> {sent ? 'Sent ✓' : 'Signal'}
        </Button>
      </Card>

      <AnimatePresence>
        {sent && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm bond-accent font-medium -mt-4"
          >
            {otherPerson.name} will see this in your shared vault.
          </motion.p>
        )}
      </AnimatePresence>

      {RESOURCE_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-sm font-semibold text-black/50 mb-3">{group.title}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {group.items.map((item) => (
              <Card key={item.name} className="p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-medium text-[var(--color-ink)]">{item.name}</p>
                  <p className="text-[13px] text-black/45 mt-0.5">{item.desc}</p>
                </div>
                <ExternalLink size={14} className="text-black/25 shrink-0 mt-1" />
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card className="p-5 flex items-start gap-3 border-none bg-black/[0.03]">
        <ShieldAlert size={17} className="text-black/40 shrink-0 mt-0.5" />
        <p className="text-[12px] text-black/45 leading-relaxed">
          vialove is a space for reflection and connection, not a replacement for professional care. If you or
          someone you know is in crisis, please reach out to a local emergency service or crisis line right
          away.
        </p>
      </Card>
    </div>
  );
}
