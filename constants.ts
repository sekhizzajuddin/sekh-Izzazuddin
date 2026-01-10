
import { QAEntry } from './types';

export const DEFAULT_ADMIN = {
  username: 'Admin_Izzaz',
  password: 'Izzaz7603',
  role: 'Admin' as const
};

export const INITIAL_DATA: QAEntry[] = [
  {
    id: '1',
    authorId: 'admin-id',
    category: 'Technology',
    subCategory: 'Artificial Intelligence',
    topic: 'Large Language Models',
    question: 'How does the attention mechanism improve model performance?',
    answer: 'The attention mechanism allows models to focus on specific parts of the input sequence when producing an output, effectively giving different weights to different words depending on their relevance in context. This solves the long-term dependency problem found in traditional RNNs.',
    source: 'Vaswani et al. (2017), "Attention Is All You Need"',
    createdAt: Date.now() - 1000000,
    likes: [],
    dislikes: [],
    comments: []
  },
  {
    id: '2',
    authorId: 'admin-id',
    category: 'Science',
    subCategory: 'Quantum Physics',
    topic: 'Entanglement',
    question: 'What is Quantum Entanglement in simple terms?',
    answer: 'Quantum entanglement is a physical phenomenon that occurs when a pair or group of particles is generated, interact, or share spatial proximity in a way such that the quantum state of each particle of the pair or group cannot be described independently of the state of the others.',
    source: 'Niels Bohr Institute - Quantum Mechanics Fundamentals',
    createdAt: Date.now() - 500000,
    likes: [],
    dislikes: [],
    comments: []
  }
];

// Premium Chocolate & Gold Palette
export const CHOCOLATE = "#2b1810";
export const GOLD = "#D4AF37";
export const GOLD_LIGHT = "#F4E4BC";
export const SOFT_BG = "#FDFBF7";

// Facebook Layout Mappings
export const FB_BLUE = CHOCOLATE; // Using Chocolate as the primary "Action" color
export const FB_BG = SOFT_BG;
export const FB_CARD = "#FFFFFF";
export const FB_TEXT_PRIMARY = "#2b1810";
export const FB_TEXT_SECONDARY = "#5c4033";
export const FB_DIVIDER = "#E5E1DA";
export const FB_HOVER = "#F9F6F1";
export const FB_GREEN = "#1a472a"; // Deep Forest Green for accents
