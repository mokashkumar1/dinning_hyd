// Web Speech API wrapper for Trilingual TTS (Urdu, Sindhi, English)
import { Language } from '@/types';

export interface TTSState {
  isPlaying: boolean;
  activeLanguage: Language | null;
  currentText: string | null;
}

type StateListener = (state: TTSState) => void;

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<StateListener> = new Set();
  private state: TTSState = {
    isPlaying: false,
    activeLanguage: null,
    currentText: null,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.state = {
      isPlaying: false,
      activeLanguage: null,
      currentText: null,
    };
    this.notify();
  }

  public speak(text: string, lang: Language) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment');
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Select suitable voice or language tag
    if (lang === 'ur') {
      utterance.lang = 'ur-PK';
      utterance.rate = 0.88; // Slightly slower for elderly comprehension
      utterance.pitch = 1.0;
    } else if (lang === 'sd') {
      // Browsers often fall back to ur-PK or ar-SA if sd-PK voice is not present
      utterance.lang = 'ur-PK'; 
      utterance.rate = 0.85;
      utterance.pitch = 0.98;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
    }

    // Try finding matching voice
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => 
        (lang === 'ur' && (v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu'))) ||
        (lang === 'sd' && (v.lang.startsWith('sd') || v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu'))) ||
        (lang === 'en' && v.lang.startsWith('en'))
      );
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      this.state = {
        isPlaying: true,
        activeLanguage: lang,
        currentText: text,
      };
      this.notify();
    };

    utterance.onend = () => {
      this.state = {
        isPlaying: false,
        activeLanguage: null,
        currentText: null,
      };
      this.notify();
    };

    utterance.onerror = () => {
      this.state = {
        isPlaying: false,
        activeLanguage: null,
        currentText: null,
      };
      this.notify();
    };

    this.synth.speak(utterance);
  }

  public getState(): TTSState {
    return this.state;
  }
}

export const ttsService = new TTSService();
