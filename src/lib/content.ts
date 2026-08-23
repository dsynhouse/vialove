import type { BondType, MindfulSession, VaultCategory } from './types';

export const REFLECTIVE_PROMPTS: Record<BondType, string[]> = {
  couple: [
    'What is something I did this week that made you feel loved?',
    'Where do you feel closest to me lately — and where do you feel distant?',
    'What is a fear about us you have not said out loud?',
    'What does "home" feel like with me?',
    'What is one thing you wish I understood without you explaining it?',
  ],
  'parent-child': [
    'What is something from your childhood you want to talk about now?',
    'What do you wish I asked you more often?',
    'What is a rule or expectation that feels outdated between us?',
    'When do you feel most proud to be part of this family?',
    'What is something you have never told me?',
  ],
  friends: [
    'What has this friendship taught you about yourself?',
    'Is there anything unspoken between us right now?',
    'What do you need more of from me as a friend?',
    'What memory of us do you replay the most?',
    'Where do you see this friendship in five years?',
  ],
  siblings: [
    'What is something from growing up together you have never brought up?',
    'How has our relationship changed since we were kids?',
    'What do you admire about who I have become?',
    'Is there old tension between us worth finally naming?',
    'What do you need from me as a sibling right now?',
  ],
  custom: [
    'What does this bond mean to you right now?',
    'What is something you have been wanting to say?',
    'Where do you feel most understood by me?',
    'What is a hope you have for us?',
    'What is one thing I could do to show up better for you?',
  ],
};

export const FUN_PROMPTS: Record<BondType, string[]> = {
  couple: [
    'Would you rather: relive our first date or skip to our next big adventure?',
    'Describe our relationship as a weather forecast today.',
    'What is a silly nickname you have never told me you thought of?',
    'Pick a song that is "us" right now.',
    'If we had a mascot, what would it be and why?',
  ],
  'parent-child': [
    'What is the most embarrassing thing I have done as your parent/child?',
    'If our family were a sitcom, what would this season be called?',
    'What is a food only we would understand the appeal of?',
    'Pick a superpower for our family and explain the catch.',
    'What is a tradition we should absolutely start?',
  ],
  friends: [
    'If our friendship had a theme song, what would it be?',
    'What is the most "us" thing that has ever happened?',
    'Would you rather go on a spontaneous trip or plan the perfect night in with me?',
    'Cast our friendship as a buddy movie — what genre?',
    'What is a weird talent of mine you secretly admire?',
  ],
  siblings: [
    'What is the pettiest thing we have ever fought about?',
    'If we swapped lives for a day, what would you do first?',
    'What is a nickname from childhood that should make a comeback?',
    'Rank our family holidays and defend your list.',
    'What is a running joke only the two of us would get?',
  ],
  custom: [
    'What is a small joy you had this week?',
    'If this bond were a movie genre, what would it be?',
    'What is something you are randomly grateful for right now?',
    'Describe today in exactly five words.',
    'What is a tiny thing that made you smile recently?',
  ],
};

export const VAULT_CATEGORY_META: Record<
  VaultCategory,
  { label: string; description: string; color: string }
> = {
  dream: { label: 'Dreams', description: 'Where you hope life takes you.', color: '#4f7ea1' },
  aspiration: {
    label: 'Aspirations',
    description: 'Who you are working to become.',
    color: '#7d8f5c',
  },
  fear: { label: 'Fears', description: 'What quietly worries you.', color: '#9c4a34' },
  worry: { label: 'Worries', description: 'What is on your mind right now.', color: '#c79a3a' },
  regret: { label: 'Regrets', description: 'What you wish went differently.', color: '#a1698f' },
  shame: { label: 'Shame', description: 'What is hard to say out loud.', color: '#6e5a73' },
  goal: { label: 'Goals', description: 'What you are building toward.', color: '#c1694f' },
};

export const DATE_IDEAS: Record<BondType, { title: string; energy: 'low' | 'medium' | 'high'; budget: '$' | '$$' | '$$$' }[]> = {
  couple: [
    { title: 'Cook a new recipe together, no recipe skipped', energy: 'medium', budget: '$' },
    { title: 'Write each other a letter to open in a year', energy: 'low', budget: '$' },
    { title: 'Recreate your first date', energy: 'medium', budget: '$$' },
    { title: 'Stargazing with a shared playlist', energy: 'low', budget: '$' },
    { title: 'Weekend trip somewhere neither of you has been', energy: 'high', budget: '$$$' },
  ],
  'parent-child': [
    { title: 'Cook grandma’s recipe together', energy: 'medium', budget: '$' },
    { title: 'Trade playlists and explain your picks', energy: 'low', budget: '$' },
    { title: 'Build something together from scratch', energy: 'medium', budget: '$$' },
    { title: 'Look through old photos and tell the stories', energy: 'low', budget: '$' },
    { title: 'Plan a day trip the other person picks entirely', energy: 'high', budget: '$$' },
  ],
  friends: [
    { title: 'Themed movie marathon, costumes optional', energy: 'low', budget: '$' },
    { title: 'Try a class neither of you has done before', energy: 'medium', budget: '$$' },
    { title: 'Recreate a childhood memory together', energy: 'medium', budget: '$' },
    { title: 'Road trip with no destination set', energy: 'high', budget: '$$' },
    { title: 'Swap "you have to try this" recommendations night', energy: 'low', budget: '$' },
  ],
  siblings: [
    { title: 'Rewatch the show that defined your childhood', energy: 'low', budget: '$' },
    { title: 'Cook the family recipe from memory (compare results)', energy: 'medium', budget: '$' },
    { title: 'Go back to a place from your childhood', energy: 'medium', budget: '$$' },
    { title: 'Trade "things I never told you" over dinner', energy: 'low', budget: '$' },
    { title: 'Plan next holiday together, just the two of you', energy: 'medium', budget: '$$' },
  ],
  custom: [
    { title: 'Spend an hour doing nothing but talking', energy: 'low', budget: '$' },
    { title: 'Try something new together', energy: 'medium', budget: '$$' },
    { title: 'Share three things you are grateful for about this bond', energy: 'low', budget: '$' },
    { title: 'Plan a small adventure for the two of you', energy: 'high', budget: '$$' },
    { title: 'Write down your bond’s story so far', energy: 'low', budget: '$' },
  ],
};

export const DISCUSSION_TEMPLATES = [
  {
    id: 'state-of-us',
    title: 'State of the bond',
    steps: [
      'What has felt good between us lately?',
      'What has felt hard or off?',
      'Is there anything unresolved from the past few weeks?',
      'What is one thing we can commit to before we meet again?',
    ],
  },
  {
    id: 'conflict',
    title: 'Working through friction',
    steps: [
      'Name the issue without blame — just the facts.',
      'Each person shares how it made them feel.',
      'What need was not being met?',
      'Agree on one concrete change to try.',
    ],
  },
  {
    id: 'future',
    title: 'Future planning',
    steps: [
      'What do we want more of in this bond a year from now?',
      'What is one shared goal we can work toward?',
      'What might get in the way, and how do we handle it?',
      'What is our next small step?',
    ],
  },
];

export const MINDFUL_SESSIONS: MindfulSession[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    minutes: 4,
    kind: 'breathing',
    description: 'A steady 4-4-4-4 rhythm to settle the nervous system before a hard conversation.',
  },
  {
    id: 'gratitude-meditation',
    title: 'Gratitude for This Bond',
    minutes: 6,
    kind: 'meditation',
    description: 'A guided reflection on what this relationship has given you.',
  },
  {
    id: 'loving-kindness',
    title: 'Loving-Kindness',
    minutes: 8,
    kind: 'meditation',
    description: 'Traditional metta practice, adapted to send warmth toward the other person.',
  },
  {
    id: 'quiet-reflection',
    title: 'Quiet Reflection',
    minutes: 5,
    kind: 'spiritual',
    description: 'Open, denomination-agnostic stillness — space to sit with whatever you carry.',
  },
  {
    id: 'gratitude-walk',
    title: 'Shared Gratitude Walk',
    minutes: 10,
    kind: 'spiritual',
    description: 'A prompt-guided walk (together or apart) noticing what you are thankful for.',
  },
];

export const WEEKLY_QUESTIONS: {
  key: keyof Omit<import('./types').WeeklyResponse, 'submittedAt'>;
  label: string;
  placeholder: string;
}[] = [
  { key: 'appreciation', label: 'Something I appreciated this week', placeholder: 'Be specific — what did they do?' },
  { key: 'friction', label: 'Something that felt off or hard', placeholder: 'Speak from your own experience, not blame' },
  { key: 'request', label: 'A request going into next week', placeholder: 'One small, concrete ask' },
  { key: 'win', label: 'A win worth celebrating', placeholder: 'For either of you, or the bond itself' },
  { key: 'tryThis', label: 'Something new to try together', placeholder: 'A ritual, habit, or experiment' },
];
