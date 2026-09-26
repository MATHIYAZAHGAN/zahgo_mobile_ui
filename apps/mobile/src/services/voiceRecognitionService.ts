import { Platform } from 'react-native';

// Safe lazy native module resolvers (Prevents top-level [runtime not ready] red screen crashes)
let cachedLegacyAudioAV: any = undefined;
function getLegacyAudioAV(): any {
  if (cachedLegacyAudioAV !== undefined) return cachedLegacyAudioAV;
  try {
    const av = require('expo-av');
    cachedLegacyAudioAV = av?.Audio || null;
  } catch (e: any) {
    cachedLegacyAudioAV = null;
  }
  return cachedLegacyAudioAV;
}

let cachedExpoAudio: any = undefined;
function getExpoAudio(): any {
  if (cachedExpoAudio !== undefined) return cachedExpoAudio;
  try {
    cachedExpoAudio = require('expo-audio');
  } catch (e: any) {
    cachedExpoAudio = null;
  }
  return cachedExpoAudio;
}

let cachedFileSystem: any = undefined;
function getFileSystem(): any {
  if (cachedFileSystem !== undefined) return cachedFileSystem;
  try {
    cachedFileSystem = require('expo-file-system');
  } catch (e) {
    cachedFileSystem = null;
  }
  return cachedFileSystem;
}

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
  private static activeAudioRecorder: any = null;
  private static legacyAvRecording: any = null;
  private static onTranscriptCallback: ((result: VoiceRecognitionResult) => void) | null = null;
  private static onErrorCallback: ((error: string) => void) | null = null;

  private static lastWebTranscript: string = '';
  private static webMediaRecorder: any = null;
  private static webAudioChunks: any[] = [];
  private static webMediaStream: any = null;

  /**
   * Request Android & iOS microphone permissions safely
   */
  public static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('[VOICE] Permission granted (web)');
            return true;
          } catch (err) {
            console.warn('[VOICE] Web microphone access denied:', err);
            return false;
          }
        }
        return true;
      }

      // 1. Try expo-audio requestRecordingPermissionsAsync
      const ExpoAudio = getExpoAudio();
      if (ExpoAudio?.requestRecordingPermissionsAsync || ExpoAudio?.AudioModule?.requestRecordingPermissionsAsync) {
        try {
          const reqFn = ExpoAudio.requestRecordingPermissionsAsync || ExpoAudio.AudioModule.requestRecordingPermissionsAsync;
          const res = await reqFn();
          if (res?.granted) {
            console.log('[VOICE] Permission granted');
            return true;
          }
        } catch (e: any) {
          console.warn('[VOICE] expo-audio permission notice:', e?.message || e);
        }
      }

      // 2. Try expo-av requestPermissionsAsync
      const LegacyAudioAV = getLegacyAudioAV();
      if (LegacyAudioAV?.requestPermissionsAsync) {
        try {
          const res = await LegacyAudioAV.requestPermissionsAsync();
          if (res?.granted) {
            console.log('[VOICE] Permission granted (legacy)');
            return true;
          }
        } catch (e: any) {
          console.warn('[VOICE] expo-av permission notice:', e?.message || e);
        }
      }

      console.warn('[VOICE] Microphone permission not granted');
      return false;
    } catch (error: any) {
      console.error('[VOICE] Recording error during permission request:', error?.message || error);
      return false;
    }
  }

  /**
   * Start microphone audio recording
   */
  public static async startRecognition(
    config: VoiceRecognitionConfig,
    onTranscript: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError || null;

    if (Platform.OS === 'web') {
      return await this.startWebSpeechRecognition(config);
    } else {
      return await this.startMobileAudioRecording();
    }
  }

  /**
   * Native Mobile Microphone Recording Lifecycle
   */
  private static async startMobileAudioRecording(): Promise<boolean> {
    console.log('[VOICE] Starting mobile audio recording...');
    console.log('[VOICE] Platform:', Platform.OS);

    const ExpoAudio = getExpoAudio();
    const LegacyAudioAV = getLegacyAudioAV();

    try {
      // 1. Permission Check
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[VOICE] Permission status: denied');
        this.onErrorCallback?.('Microphone permission required to record audio.');
        return false;
      }

      // 2. Clear previous active recorders
      this.activeAudioRecorder = null;
      this.legacyAvRecording = null;

      // Engine A: expo-audio (Expo SDK 57 Official Engine)
      if (ExpoAudio) {
        try {
          console.log('[VOICE] Initializing expo-audio native recorder...');

          // Configure Audio Mode
          if (ExpoAudio.setAudioModeAsync) {
            await ExpoAudio.setAudioModeAsync({
              allowsRecording: true,
              playsInSilentMode: true,
            });
          }

          const AudioRecorderClass = ExpoAudio.AudioRecorder || ExpoAudio.AudioModule?.AudioRecorder;
          const presets = ExpoAudio.RecordingPresets || {};

          if (AudioRecorderClass) {
            const recorder = new AudioRecorderClass(presets.HIGH_QUALITY || {});
            console.log('[VOICE] Recorder created: true');

            if (recorder.prepareToRecordAsync) {
              await recorder.prepareToRecordAsync();
            } else if (recorder.prepare) {
              await recorder.prepare();
            }

            recorder.record();
            console.log('[VOICE] Recording started: true');

            this.activeAudioRecorder = recorder;
            return true;
          }
        } catch (expoErr: any) {
          console.warn('[VOICE] expo-audio recorder attempt notice:', expoErr?.message || expoErr);
        }
      }

      // Engine B: expo-av fallback
      if (LegacyAudioAV) {
        try {
          console.log('[VOICE] Initializing legacy expo-av native recorder...');
          await LegacyAudioAV.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });

          const recording = new LegacyAudioAV.Recording();
          await recording.prepareToRecordAsync(LegacyAudioAV.RecordingOptionsPresets?.HIGH_QUALITY || {});
          await recording.startAsync();

          console.log('[VOICE] Recorder created: true (legacy)');
          console.log('[VOICE] Recording started: true');
          this.legacyAvRecording = recording;
          return true;
        } catch (avErr: any) {
          console.warn('[VOICE] expo-av recorder attempt notice:', avErr?.message || avErr);
        }
      }

      const failMsg = `Microphone native recorder could not be initialized on ${Platform.OS}.`;
      console.error(`[VOICE] Recording error: ${failMsg}`);
      this.onErrorCallback?.(failMsg);
      return false;
    } catch (err: any) {
      console.error('[VOICE] Unhandled mobile recording error:', err?.message || err);
      this.onErrorCallback?.(err?.message || 'Failed to start microphone recording.');
      return false;
    }
  }

  /**
   * Web Browser Speech Recognition API + MediaRecorder Audio Blob Fallback
   */
  private static async startWebSpeechRecognition(config: VoiceRecognitionConfig): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    this.lastWebTranscript = '';
    this.webAudioChunks = [];

    // 1. Initialize Web MediaRecorder to capture physical audio blob from browser microphone
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webMediaStream = stream;

        const mimeType =
          typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

        const recorderOptions = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, recorderOptions);

        recorder.ondataavailable = (event: any) => {
          if (event.data && event.data.size > 0) {
            this.webAudioChunks.push(event.data);
          }
        };

        recorder.start(200);
        this.webMediaRecorder = recorder;
        console.log('[VOICE] Web MediaRecorder started: true');
      }
    } catch (mediaErr: any) {
      console.warn('[VOICE] Web MediaRecorder notice:', mediaErr?.message || mediaErr);
    }

    // 2. Initialize Web SpeechRecognition API for live real-time transcript streaming
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = config.continuous !== false;
        recognition.interimResults = config.interimResults !== false;
        recognition.maxAlternatives = config.maxAlternatives || 1;
        recognition.lang = config.language || 'ta-IN';

        recognition.onstart = () => {
          console.log('[VOICE] Recording started: true (web speech)');
        };

        recognition.onresult = (event: any) => {
          try {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;

              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            const textToUse = finalTranscript || interimTranscript;
            if (textToUse) {
              this.lastWebTranscript = textToUse;
              this.onTranscriptCallback?.({
                transcript: textToUse,
                isFinal: !!finalTranscript,
                confidence: 0.9,
              });
            }
          } catch (err) {
            console.error('[VOICE] Speech recognition result error:', err);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[VOICE] Web speech recognition notice:', event.error);
        };

        recognition.onend = () => {
          this.speechRecognition = null;
        };

        recognition.start();
        this.speechRecognition = recognition;
        return true;
      } catch (error: any) {
        console.warn('[VOICE] Web speech recognition start notice:', error?.message || error);
      }
    }

    // If MediaRecorder started successfully, return true even if SpeechRecognition was unavailable
    if (this.webMediaRecorder) {
      console.log('[VOICE] Recording started: true (web MediaRecorder)');
      return true;
    }

    console.warn('[VOICE] Neither Web Speech API nor MediaRecorder available.');
    this.onErrorCallback?.('Web microphone recording not supported in this browser.');
    return false;
  }

  /**
   * Stop voice recording and return verified audio file URI or transcript text
   */
  public static async stopRecognition(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const webText = this.lastWebTranscript?.trim() || null;

        // Stop Speech Recognition instance
        if (this.speechRecognition) {
          try {
            this.speechRecognition.stop();
          } catch (e) {
            console.warn('[VOICE] Error stopping web recognition:', e);
          }
          this.speechRecognition = null;
        }

        // Stop MediaRecorder and assemble Audio Blob URL
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
              const audioBlob = new Blob(this.webAudioChunks, {
                type: this.webMediaRecorder.mimeType || 'audio/webm',
              });
              blobUrl = URL.createObjectURL(audioBlob);
              console.log('[VOICE] Created Web Audio Blob URL:', blobUrl);
            }
          } catch (recErr: any) {
            console.warn('[VOICE] Error stopping MediaRecorder:', recErr);
          } finally {
            this.webMediaRecorder = null;
            this.webAudioChunks = [];
          }
        }

        // Stop media stream tracks (turns off browser mic indicator light)
        if (this.webMediaStream) {
          try {
            this.webMediaStream.getTracks().forEach((track: any) => track.stop());
          } catch (tErr) {}
          this.webMediaStream = null;
        }

        this.lastWebTranscript = '';

        // If Web Speech API captured text, return that text directly.
        // Otherwise, return the captured Audio Blob URL so backend STT can process the audio!
        const resultToReturn = webText || blobUrl;
        console.log('[VOICE] Web Recording result:', resultToReturn);
        return resultToReturn;
      } else {
        return await this.stopMobileAudioRecording();
      }
    } catch (error: any) {
      console.error('[VOICE] Stop recognition error:', error?.message || error);
      return null;
    }
  }

  /**
   * Stop Mobile Audio Recording with Strict Verification
   */
  private static async stopMobileAudioRecording(): Promise<string | null> {
    let capturedUri: string | null = null;
    const FileSystem = getFileSystem();

    try {
      // 1. Stop Engine A (expo-audio)
      if (this.activeAudioRecorder) {
        console.log('[VOICE] Recording stopped');
        if (this.activeAudioRecorder.stop) {
          await this.activeAudioRecorder.stop();
        }
        capturedUri = this.activeAudioRecorder.uri || this.activeAudioRecorder.getURI?.() || null;
        this.activeAudioRecorder = null;
      }
      // 2. Stop Engine B (expo-av)
      else if (this.legacyAvRecording) {
        console.log('[VOICE] Recording stopped (legacy)');
        try {
          await this.legacyAvRecording.stopAndUnloadAsync();
        } catch (stopErr: any) {
          console.warn('[VOICE] stopAndUnloadAsync notice:', stopErr?.message || stopErr);
        }
        capturedUri = this.legacyAvRecording.getURI();
        this.legacyAvRecording = null;
      }

      console.log(`[VOICE] Audio URI = ${capturedUri}`);

      if (!capturedUri) {
        console.warn('[VOICE] Audio URI is null');
        return null;
      }

      // Verify file exists on device filesystem
      if (FileSystem?.getInfoAsync) {
        try {
          const info = await FileSystem.getInfoAsync(capturedUri);
          if (info.exists) {
            console.log('[VOICE] Audio file valid = true');
          } else {
            console.warn('[VOICE] Audio file valid = false (File not found)');
            return null;
          }
        } catch (fsErr: any) {
          console.warn('[VOICE] File verification notice:', fsErr?.message || fsErr);
        }
      }

      return capturedUri;
    } catch (err: any) {
      console.error('[VOICE] Recording error while stopping:', err?.message || err);
      this.activeAudioRecorder = null;
      this.legacyAvRecording = null;
      return null;
    }
  }

  /**
   * Check if currently recording
   */
  public static isRecording(): boolean {
    if (Platform.OS === 'web') {
      return (
        this.speechRecognition !== null ||
        (this.webMediaRecorder !== null && this.webMediaRecorder.state !== 'inactive')
      );
    }
    return this.activeAudioRecorder !== null || this.legacyAvRecording !== null;
  }
}

