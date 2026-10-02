import { Platform } from 'react-native';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import type { AudioRecorder } from 'expo-audio/build/AudioModule.types';

/**
 * Production Voice Recognition Service
 * Uses expo-audio SDK 57 correct API:
 * - requestRecordingPermissionsAsync (top-level export)
 * - setAudioModeAsync (top-level export)
 * - AudioModule.AudioRecorder (native class constructor)
 * - recorder.prepareToRecordAsync() + recorder.record() + recorder.stop()
 * - recorder.uri (string | null)
 *
 * expo-av has been removed — incompatible JSI ABI with RN 0.86.
 */

// High quality recording options compatible with expo-audio SDK 57
const HIGH_QUALITY_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: 2, // MPEG_4
    audioEncoder: 3, // AAC
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'aac ',
    audioQuality: 127, // MAX
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export interface VoiceRecognitionConfig {
  language?: 'ta-IN' | 'en-US' | 'en-IN';
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export class VoiceRecognitionService {
  private static speechRecognition: any = null;
  private static activeRecorder: AudioRecorder | null = null;
  private static onTranscriptCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private static onErrorCallback: ((error: string) => void) | null = null;
  private static lastWebTranscript: string = '';
  private static webMediaRecorder: any = null;
  private static webAudioChunks: any[] = [];
  private static webMediaStream: any = null;

  /**
   * Request microphone permissions.
   */
  public static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
          } catch {
            return false;
          }
        }
        return true;
      }
      const { granted } = await requestRecordingPermissionsAsync();
      return granted;
    } catch (error: any) {
      console.error('[VOICE] Permission error:', error?.message || error);
      return false;
    }
  }

  /**
   * Start voice recording.
   */
  public static async startRecognition(
    config: VoiceRecognitionConfig,
    onTranscript: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError || null;

    if (Platform.OS === 'web') {
      return this.startWebRecognition(config);
    }
    return this.startNativeRecording();
  }

  private static async startNativeRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.onErrorCallback?.(
          'Microphone permission is required. Please allow access in Settings.'
        );
        return false;
      }

      // Set audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Create recorder using AudioModule's AudioRecorder class
      const RecorderClass = AudioModule.AudioRecorder;
      const recorder = new RecorderClass(HIGH_QUALITY_OPTIONS) as AudioRecorder;

      await recorder.prepareToRecordAsync(HIGH_QUALITY_OPTIONS);
      recorder.record();

      this.activeRecorder = recorder;
      console.log('[VOICE] Native recording started');
      return true;
    } catch (error: any) {
      console.error('[VOICE] Start recording error:', error?.message || error);
      const msg = (error?.message || '').toLowerCase().includes('permission')
        ? 'Microphone permission denied. Please enable in Settings.'
        : 'Could not start recording. Please try again.';
      this.onErrorCallback?.(msg);
      return false;
    }
  }

  private static async startWebRecognition(config: VoiceRecognitionConfig): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    this.lastWebTranscript = '';
    this.webAudioChunks = [];

    // MediaRecorder for audio blob
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webMediaStream = stream;
        const mimeType =
          typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e: any) => {
          if (e.data?.size > 0) this.webAudioChunks.push(e.data);
        };
        recorder.start(200);
        this.webMediaRecorder = recorder;
      }
    } catch {
      // fallthrough
    }

    // Web SpeechRecognition
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = config.continuous !== false;
        recognition.interimResults = config.interimResults !== false;
        recognition.maxAlternatives = config.maxAlternatives || 1;
        recognition.lang = config.language || 'ta-IN';
        recognition.onresult = (event: any) => {
          let finalText = '';
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += text;
            else interimText += text;
          }
          const text = finalText || interimText;
          if (text) {
            this.lastWebTranscript = text;
            this.onTranscriptCallback?.({ transcript: text, isFinal: !!finalText, confidence: 0.9 });
          }
        };
        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') console.warn('[VOICE] Web speech error:', e.error);
        };
        recognition.onend = () => { this.speechRecognition = null; };
        recognition.start();
        this.speechRecognition = recognition;
      } catch {
        // fallthrough
      }
    }

    return !!(this.webMediaRecorder || this.speechRecognition);
  }

  /**
   * Stop recording — returns audio URI (native) or text/blob URL (web).
   */
  public static async stopRecognition(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return this.stopWebRecognition();

      if (!this.activeRecorder) {
        console.warn('[VOICE] No active recorder');
        return null;
      }

      await this.activeRecorder.stop();
      const uri = this.activeRecorder.uri;
      console.log('[VOICE] Recording stopped, URI:', uri);
      this.activeRecorder = null;

      // Reset audio mode
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false }).catch(() => {});

      return uri || null;
    } catch (error: any) {
      console.error('[VOICE] Stop error:', error?.message || error);
      this.activeRecorder = null;
      return null;
    }
  }

  private static async stopWebRecognition(): Promise<string | null> {
    const webText = this.lastWebTranscript?.trim() || null;

    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch {}
      this.speechRecognition = null;
    }

    let blobUrl: string | null = null;
    if (this.webMediaRecorder) {
      try {
        if (this.webMediaRecorder.state !== 'inactive') {
          await new Promise<void>((resolve) => {
            this.webMediaRecorder.onstop = () => resolve();
            this.webMediaRecorder.stop();
          });
        }
        if (this.webAudioChunks.length > 0) {
          const blob = new Blob(this.webAudioChunks, {
            type: this.webMediaRecorder.mimeType || 'audio/webm',
          });
          blobUrl = URL.createObjectURL(blob);
        }
      } catch {}
      this.webMediaRecorder = null;
      this.webAudioChunks = [];
    }

    if (this.webMediaStream) {
      try { this.webMediaStream.getTracks().forEach((t: any) => t.stop()); } catch {}
      this.webMediaStream = null;
    }

    this.lastWebTranscript = '';
    return webText || blobUrl;
  }

  /**
   * Check if currently recording.
   */
  public static isRecording(): boolean {
    if (Platform.OS === 'web') {
      return (
        this.speechRecognition !== null ||
        (this.webMediaRecorder !== null && this.webMediaRecorder.state !== 'inactive')
      );
    }
    return this.activeRecorder !== null;
  }
}
