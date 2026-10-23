// Web Speech API wrapper for Trilingual TTS (Urdu, Sindhi, English)
import { Language } from '@/types';

export interface TTSState {
  isPlaying: boolean;
  activeLanguage: Language | null;
  currentText: string | null;
}

export interface TTSResult {
  started: boolean;
  error?: string;
}

type StateListener = (state: TTSState) => void;

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private playbackId = 0;
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
    this.playbackId += 1;
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

  public speak(text: string, lang: Language): TTSResult {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment');
      return { started: false, error: 'Audio playback is not supported in this browser.' };
    }

    this.stop();

    const voices = this.synth.getVoices();
    const voice = voices.find((candidate) => {
      const voiceLanguage = candidate.lang.toLowerCase();
      const voiceName = candidate.name.toLowerCase();

      if (lang === 'sd') {
        return voiceLanguage.startsWith('sd') || voiceName.includes('sindhi');
      }

      if (lang === 'ur') {
        return voiceLanguage === 'ur-pk' || voiceName.includes('urdu') || voiceLanguage === 'ur-in' || voiceLanguage === 'hi-in';
      }

      return voiceLanguage.startsWith('en');
    });

    if ((lang === 'sd' || lang === 'ur') && !voice) {
      return {
        started: false,
        error: lang === 'ur'
          ? 'No Urdu voice is installed in this browser. The Urdu text is still available to read.'
          : 'A Sindhi voice is not installed in this browser. Install a Sindhi system voice, then try again.',
      };
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    const activePlaybackId = ++this.playbackId;

    // Select suitable voice or language tag
    if (lang === 'ur') {
      utterance.lang = 'ur-PK';
      utterance.rate = 0.88; // Slightly slower for elderly comprehension
      utterance.pitch = 1.0;
    } else if (lang === 'sd') {
      utterance.lang = 'sd-PK';
      utterance.rate = 0.85;
      utterance.pitch = 0.98;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      if (activePlaybackId !== this.playbackId) return;
      this.state = {
        isPlaying: true,
        activeLanguage: lang,
        currentText: text,
      };
      this.notify();
    };

    utterance.onend = () => {
      if (activePlaybackId !== this.playbackId) return;
      this.state = {
        isPlaying: false,
        activeLanguage: null,
        currentText: null,
      };
      this.notify();
    };

    utterance.onerror = () => {
      if (activePlaybackId !== this.playbackId) return;
      this.state = {
        isPlaying: false,
        activeLanguage: null,
        currentText: null,
      };
      this.notify();
    };

    this.synth.speak(utterance);
    return { started: true };
  }

  public getState(): TTSState {
    return this.state;
  }
}

export const ttsService = new TTSService();
