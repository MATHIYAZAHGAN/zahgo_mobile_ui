import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../config/theme';
import { useProductStore } from '../store/productStore';
import { AIParserService } from '../services/aiParserService';
import { StudioImageProcessor } from '../utils/studioImageProcessor';
import { VoiceRecognitionService } from '../services/voiceRecognitionService';
import {
  ProductAssistantEngine,
  ProductDraftState,
  AssistantChatTurn,
  AssistantEngineResult,
} from '../services/productAssistantEngine';

interface AddProductFlowProps {
  editProductId?: string | null;
  onCancel: () => void;
  onFinish: () => void;
}

const SAMPLE_VOICE_TRANSCRIPTS = [
  {
    label: '🎧 Zebronics Earphones Prompt',
    text: 'Zebronics Zeb-Bro C Type-C earphones with in-line mic price 399 rupees 1 year warranty',
  },
  {
    label: '🎙️ Tamil Mixer Prompt',
    text: 'பட்டர்ஃப்ளை மிக்ஸி 750 வாட்ஸ் 3 ஜார் 1 வருஷம் வாரண்டி விலை 4200 ரூபாய்',
  },
  {
    label: '👕 English Kurta Prompt',
    text: 'Men navy blue pure cotton kurta shirt size L price 899 rupees best quality',
  },
];

export default function AddProductFlow({ editProductId, onCancel, onFinish }: AddProductFlowProps) {
  const {
    currentFlowStep,
    capturedImages,
    voiceTranscript,
    aiProcessingStage,
    currentProduct,
    setCapturedImages,
    setVoiceTranscript,
    runAIProcessing,
    updateCurrentProduct,
    publishProduct,
    isLoading,
  } = useProductStore();

  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    capturedImages[0] || ''
  );
  
  // Amazon Studio Background Removal State
  const [backgroundMode, setBackgroundMode] = useState<'amazon_white' | 'gradient' | 'original'>('amazon_white');
  const [isProcessingBg, setIsProcessingBg] = useState(false);

  // Microphone & Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordingObject, setRecordingObject] = useState<any | null>(null);

  // Live Tamil to English Translation
  const [liveTranslation, setLiveTranslation] = useState<string>('');

  // Product Assistant Guided Conversation State
  const [productDraft, setProductDraft] = useState<ProductDraftState>({});
  const [inputText, setInputText] = useState('');
  const [chatTurns, setChatTurns] = useState<AssistantChatTurn[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'வணக்கம்! உங்கள் பொருளின் பெயர் அல்லது விவரத்தைக் கூறவும். (e.g. "ஒரு Remote Control Car இருக்கு 10 pieces price 500")',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: '🧸 Toys & Games', value: 'Toys' },
        { label: '⚡ Electronics', value: 'Electronics' },
        { label: '👕 Fashion', value: 'Fashion' },
        { label: '🍳 Kitchen', value: 'Home & Kitchen' },
      ],
    },
  ]);

  const [assistantResult, setAssistantResult] = useState<AssistantEngineResult>(
    ProductAssistantEngine.evaluateAssistantState({})
  );

  const processAssistantUtterance = (userInput: string) => {
    if (!userInput || !userInput.trim()) return;

    const userText = userInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userTurn: AssistantChatTurn = {
      id: Date.now().toString(),
      sender: 'seller',
      text: userText,
      timestamp: timeStr,
    };

    const extracted = ProductAssistantEngine.parseUtterance(userText, productDraft);
    console.log('[VOICE] AI extraction =', JSON.stringify(extracted));
    const updatedDraft = { ...productDraft, ...extracted };
    setProductDraft(updatedDraft);
    useProductStore.setState({ productDraft: updatedDraft });

    const evalRes = ProductAssistantEngine.evaluateAssistantState(updatedDraft);
    setAssistantResult(evalRes);

    let aiText = '';
    if (evalRes.isComplete) {
      aiText = 'சிறப்பு! அனைத்து விவரங்களும் சேகரிக்கப்பட்டன. இப்போது AI Catalog உருவாக்க தயார்! 🎉';
    } else if (evalRes.nextQuestion) {
      aiText = evalRes.nextQuestion.tamilQuestion;
    } else {
      aiText = 'கூடுதல் விவரங்களைத் தேர்வு செய்யவும் அல்லது கூறவும்.';
    }

    const aiTurn: AssistantChatTurn = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiText,
      timestamp: timeStr,
      extractedData: extracted,
      options: evalRes.nextQuestion?.options,
    };

    setChatTurns((prev) => [...prev, userTurn, aiTurn]);
    setInputText('');

    const fullTranscript = Object.values(updatedDraft).filter(Boolean).join(' ');
    setVoiceTranscript(fullTranscript);
  };

  // Editable Product details in Review Step
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Speech Recognition & TextInput ref
  const speechRecognitionRef = useRef<any>(null);
  const transcriptInputRef = useRef<TextInput>(null);

  // Sync current product fields into edit state when entering review step
  useEffect(() => {
    if (currentProduct) {
      setEditTitle(currentProduct.name?.value || '');
      setEditPrice(currentProduct.pricing?.price?.value?.toString() || '999');
      setEditMrp(currentProduct.pricing?.mrp?.value?.toString() || '1499');
      setEditDesc(currentProduct.description || '');
    }
  }, [currentProduct]);

  // Update live translation whenever transcript changes
  useEffect(() => {
    if (voiceTranscript) {
      const result = AIParserService.translateTamilToEnglish(voiceTranscript);
      setLiveTranslation(result.englishTranslation);
    } else {
      setLiveTranslation('');
    }
  }, [voiceTranscript]);

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Clean up recording object
  useEffect(() => {
    return () => {
      if (recordingObject) {
        recordingObject.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recordingObject]);

  // Process Studio White Background Removal
  const applyStudioBackgroundRemoval = async (photoUri: string) => {
    setSelectedPhoto(photoUri);
    setIsProcessingBg(true);
    try {
      const studioUri = await StudioImageProcessor.removeBackground(photoUri);
      setSelectedPhoto(studioUri);
      setCapturedImages([studioUri]);
    } catch (e) {
      setSelectedPhoto(photoUri);
      setCapturedImages([photoUri]);
    } finally {
      setIsProcessingBg(false);
    }
  };

  // Photo Capture via Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture product photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const photoUri = result.assets[0].uri;
        await applyStudioBackgroundRemoval(photoUri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  // Photo Selection via Gallery
  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery permission is required to choose product photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const photoUri = result.assets[0].uri;
        await applyStudioBackgroundRemoval(photoUri);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
    }
  };

  // Confirm Photo & Move to Voice Step
  const handleConfirmPhoto = () => {
    setCapturedImages([selectedPhoto]);
    useProductStore.setState({ currentFlowStep: 'voice' });
  };

  // Dedicated Android / Mobile Microphone Diagnostic Test Button
  const [isTestingMic, setIsTestingMic] = useState(false);
  const handleTestMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const hasPerm = await VoiceRecognitionService.requestPermissions();
      if (!hasPerm) {
        Alert.alert('Permission Denied', 'Microphone permission was denied on this device.');
        setIsTestingMic(false);
        return;
      }

      const started = await VoiceRecognitionService.startRecognition(
        { language: 'ta-IN' },
        () => {},
        (err) => {
          Alert.alert('Microphone Error', err);
          setIsTestingMic(false);
        }
      );

      if (!started) {
        Alert.alert('Recording Failed', 'Native microphone recorder could not be started.');
        setIsTestingMic(false);
        return;
      }

      // Record for 4 seconds test
      setTimeout(async () => {
        const uri = await VoiceRecognitionService.stopRecognition();
        setIsTestingMic(false);
        if (uri) {
          Alert.alert('Audio Captured Successfully! 🎉', `Audio File URI:\n${uri}`);
        } else {
          Alert.alert('Microphone Recording Failed ❌', 'Audio URI returned null. Please verify Android permissions.');
        }
      }, 4000);
    } catch (e: any) {
      setIsTestingMic(false);
      Alert.alert('Test Error', e?.message || 'Mic test failed');
    }
  };

  // Continuous Real-Time Speech Recognition & Native Microphone Toggle
  const handleToggleRecord = async () => {
    if (isRecording) {
      // STOP RECORDING
      setIsRecording(false);
      setIsTranscribingVoice(true);

      try {
        const audioUri = await VoiceRecognitionService.stopRecognition();
        console.log('[VOICE] Audio URI:', audioUri);

        if (!audioUri && Platform.OS !== 'web') {
          Alert.alert(
            'Voice recording failed ❌',
            'Microphone did not produce an audio file. Please try again.'
          );
          setIsTranscribingVoice(false);
          return;
        }

        // Send recorded audio directly to AI Speech-to-Text & Translation Engine
        console.log('[VOICE] Sending audio to STT');
        const result = await AIParserService.processRecordedAudio(audioUri);
        console.log('[VOICE] Transcript =', result.tamilTranscript);
        
        if (result.tamilTranscript && result.tamilTranscript.trim()) {
          setVoiceTranscript(result.tamilTranscript);
          processAssistantUtterance(result.tamilTranscript);
        } else {
          Alert.alert(
            'குரல் அறியப்படவில்லை (Voice Not Detected)',
            'தயவுசெய்து சத்தமாகவும் தெளிவாகவும் பேசவும், அல்லது கீழே உள்ள 1-Tap பொத்தான்களை தேர்வு செய்யவும்.'
          );
        }
        if (result.englishTranslation) {
          setLiveTranslation(result.englishTranslation);
        }
      } catch (err) {
        console.warn('Audio transcription error:', err);
      } finally {
        setIsTranscribingVoice(false);
      }
    } else {
      // START RECORDING (PHYSICAL PHONE MIC RECORDING!)
      setRecordDuration(0);
      transcriptInputRef.current?.blur();

      const success = await VoiceRecognitionService.startRecognition(
        {
          language: 'ta-IN', // Tamil Speech Recognition
          continuous: true,
          interimResults: true,
        },
        (result) => {
          if (result.transcript) {
            setVoiceTranscript(result.transcript);
          }
        },
        (error) => {
          console.warn('[VOICE] Voice recognition error:', error);
          setIsRecording(false);
          Alert.alert('Microphone Error', error);
        }
      );

      if (success) {
        setIsRecording(true);
      } else {
        setIsRecording(false);
        Alert.alert(
          'Microphone Failed ❌',
          'Voice recording could not start. Please check Android microphone permissions.'
        );
      }
    }
  };

  // Step-by-Step Back Handlers
  const handleGoBackFromVoice = () => {
    useProductStore.setState({ currentFlowStep: 'camera' });
  };

  const handleGoBackFromReview = () => {
    useProductStore.setState({ currentFlowStep: 'voice' });
  };

  // Save changes and Publish
  const handlePublish = async () => {
    if (currentProduct) {
      const priceVal = parseFloat(editPrice) || currentProduct.pricing?.price?.value || 999;
      const mrpVal = parseFloat(editMrp) || currentProduct.pricing?.mrp?.value || priceVal * 1.35;

      updateCurrentProduct({
        name: { ...currentProduct.name, value: editTitle || currentProduct.name?.value },
        description: editDesc || currentProduct.description,
        pricing: {
          ...currentProduct.pricing,
          price: { ...currentProduct.pricing.price, value: priceVal },
          mrp: { ...currentProduct.pricing.mrp, value: mrpVal },
        },
      });

      const success = await publishProduct(currentProduct.id);
      
      if (!success) {
        const errorStore = useProductStore.getState();
        Alert.alert(
          'Publish Failed',
          errorStore.error || 'Failed to publish product to server. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header Bar - Safe Inset Padding */}
      <View style={styles.flowBar}>
        {currentFlowStep === 'camera' && (
          <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Exit</Text>
          </TouchableOpacity>
        )}

        {currentFlowStep === 'voice' && (
          <TouchableOpacity onPress={handleGoBackFromVoice} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Photo</Text>
          </TouchableOpacity>
        )}

        {currentFlowStep === 'ai_processing' && (
          <View style={styles.backBtnDisabled}>
            <Text style={styles.backBtnDisabledText}>🤖 AI Processing...</Text>
          </View>
        )}

        {currentFlowStep === 'review' && (
          <TouchableOpacity onPress={handleGoBackFromReview} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Voice</Text>
          </TouchableOpacity>
        )}

        {currentFlowStep === 'success' && (
          <TouchableOpacity onPress={onFinish} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Step Indicators */}
        <View style={styles.stepBadges}>
          <View style={[styles.stepDot, currentFlowStep === 'camera' && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentFlowStep === 'camera' && styles.stepDotTextActive]}>1. 📸 Photo</Text>
          </View>
          <Text style={styles.stepArrow}>→</Text>
          <View style={[styles.stepDot, currentFlowStep === 'voice' && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentFlowStep === 'voice' && styles.stepDotTextActive]}>2. 🎙️ Voice</Text>
          </View>
          <Text style={styles.stepArrow}>→</Text>
          <View style={[styles.stepDot, currentFlowStep === 'ai_processing' && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentFlowStep === 'ai_processing' && styles.stepDotTextActive]}>3. 🤖 AI</Text>
          </View>
          <Text style={styles.stepArrow}>→</Text>
          <View style={[styles.stepDot, (currentFlowStep === 'review' || currentFlowStep === 'success') && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, (currentFlowStep === 'review' || currentFlowStep === 'success') && styles.stepDotTextActive]}>4. 🚀 Catalog</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onCancel} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: CAMERA / PHOTO CAPTURE & AMAZON STUDIO BACKGROUND CLEANUP */}
        {currentFlowStep === 'camera' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>பொருளின் புகைப்படம் (Product Photo) 📸</Text>
            <Text style={styles.stepSub}>
              அமேசான் ஸ்டுடியோ போன்ற தூய்மையான வெள்ளை பின்புலத்துடன் (Amazon Studio White Background) படம் எடுக்கவும்
            </Text>

            {/* Studio Photo Frame */}
            <View style={styles.photoFrame}>
              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto }} style={styles.previewImage} />
              ) : (
                <View style={styles.emptyPhotoContainer}>
                  <Text style={{ fontSize: 44, marginBottom: 6 }}>📸</Text>
                  <Text style={styles.emptyPhotoTitle}>பொருளின் படம் எடுக்கவும்</Text>
                  <Text style={styles.emptyPhotoSub}>
                    (Tap Camera or Gallery button below to add photo)
                  </Text>
                </View>
              )}

              {isProcessingBg && (
                <View style={styles.bgLoadingOverlay}>
                  <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 10 }} />
                  <Text style={styles.bgLoadingTitle}>✨ AI Studio Background Removal</Text>
                  <Text style={styles.bgLoadingSub}>
                    அமேசான் பின்புலம் வெள்ளை நிறத்தில் மாற்றப்படுகிறது...
                  </Text>
                </View>
              )}

              {!isProcessingBg && selectedPhoto ? (
                <View style={styles.qualityCheckBadge}>
                  <Text style={styles.qualityText}>
                    ✨ Amazon Studio White (#FFFFFF) Active
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Studio Background Selector */}
            <Text style={styles.sectionLabel}>பின்புல அமேசான் ஸ்டுடியோ மோட் (Studio Mode):</Text>
            <View style={styles.studioBgRow}>
              <TouchableOpacity
                style={[styles.studioChip, backgroundMode === 'amazon_white' && styles.studioChipActive]}
                onPress={() => setBackgroundMode('amazon_white')}
              >
                <Text style={[styles.studioChipText, backgroundMode === 'amazon_white' && styles.studioChipTextActive]}>
                  ⬜ Amazon Studio White
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.studioChip, backgroundMode === 'gradient' && styles.studioChipActive]}
                onPress={() => setBackgroundMode('gradient')}
              >
                <Text style={[styles.studioChipText, backgroundMode === 'gradient' && styles.studioChipTextActive]}>
                  🌫️ Studio Soft Shadow
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.studioChip, backgroundMode === 'original' && styles.studioChipActive]}
                onPress={() => setBackgroundMode('original')}
              >
                <Text style={[styles.studioChipText, backgroundMode === 'original' && styles.studioChipTextActive]}>
                  📸 Original
                </Text>
              </TouchableOpacity>
            </View>

            {/* Camera & Gallery Action Buttons */}
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={[styles.photoOptionBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleTakePhoto}
                activeOpacity={0.85}
              >
                <Text style={styles.photoOptionIcon}>📸</Text>
                <Text style={styles.photoOptionText}>Take Photo / கேமரா</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoOptionBtn, { backgroundColor: '#4F46E5' }]}
                onPress={handlePickGallery}
                activeOpacity={0.85}
              >
                <Text style={styles.photoOptionIcon}>🖼️</Text>
                <Text style={styles.photoOptionText}>Choose Gallery / கேலரி</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleConfirmPhoto}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>Confirm Studio Photo & Next: Voice →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: GUIDED CONVERSATIONAL AI PRODUCT LISTING ASSISTANT */}
        {currentFlowStep === 'voice' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>AI Product Assistant 🤖 (குரல் வழிகாட்டி)</Text>
            <Text style={styles.stepSub}>
              உங்கள் பொருளைப் பற்றி தமிழில் பேசவும் அல்லது தேர்வு செய்யவும். AI உங்களுக்கு வழிகாட்டும்!
            </Text>

            {/* Live Progress Bar Card */}
            <View style={styles.assistantProgressCard}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressTitle}>Product Details Completion</Text>
                <Text style={styles.progressPercentText}>{assistantResult.progressPercent}% Complete</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${assistantResult.progressPercent}%` }]} />
              </View>
              <View style={styles.collectedBadgesRow}>
                {assistantResult.collectedFields.map((field) => (
                  <View key={field.key} style={styles.collectedBadge}>
                    <Text style={styles.collectedBadgeText}>✓ {field.label}: {field.value}</Text>
                  </View>
                ))}
                {assistantResult.remainingFields.map((field) => (
                  <View key={field.key} style={styles.remainingBadge}>
                    <Text style={styles.remainingBadgeText}>○ {field.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Conversational Assistant Transcript */}
            <View style={styles.chatContainer}>
              {chatTurns.map((turn) => (
                <View
                  key={turn.id}
                  style={[
                    styles.chatBubble,
                    turn.sender === 'ai' ? styles.chatBubbleAi : styles.chatBubbleSeller,
                  ]}
                >
                  <Text style={turn.sender === 'ai' ? styles.chatTextAi : styles.chatTextSeller}>
                    {turn.sender === 'ai' ? '🤖 ' : '🗣️ '}
                    {turn.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Dynamic Option Chips Bar for Current Question */}
            {assistantResult.nextQuestion?.options && (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsSectionLabel}>தேர்வு செய்யவும் (1-Tap Option Selection):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {assistantResult.nextQuestion.options.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.optionChipBtn}
                      onPress={() => {
                        // Directly set the field value based on the current question
                        const fieldKey = assistantResult.nextQuestion!.fieldKey;
                        const currentDraft = useProductStore.getState().productDraft || {};
                        const updatedDraft = {
                          ...currentDraft,
                          [fieldKey]: opt.value
                        };
                        
                        useProductStore.setState({ productDraft: updatedDraft });
                        
                        const evalRes = ProductAssistantEngine.evaluateAssistantState(updatedDraft);
                        setAssistantResult(evalRes);
                        
                        // Add chat message showing selection
                        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const newSellerMessage: AssistantChatTurn = {
                          id: `seller-${Date.now()}`,
                          sender: 'seller',
                          text: opt.label,
                          timestamp: timeStr,
                        };
                        
                        let aiResponseText = '';
                        if (evalRes.isComplete) {
                          aiResponseText = 'சிறப்பு! அனைத்து விவரங்களும் சேகரிக்கப்பட்டன. இப்போது AI Catalog உருவாக்க தயார்! 🎉';
                        } else if (evalRes.nextQuestion) {
                          aiResponseText = evalRes.nextQuestion.tamilQuestion;
                        } else {
                          aiResponseText = 'கூடுதல் விவரங்களைத் தேர்வு செய்யவும்.';
                        }
                        
                        const newAiMessage: AssistantChatTurn = {
                          id: `ai-${Date.now()}`,
                          sender: 'ai',
                          text: aiResponseText,
                          timestamp: timeStr,
                          options: evalRes.nextQuestion?.options,
                        };
                        
                        setChatTurns((prev) => [...prev, newSellerMessage, newAiMessage]);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionChipText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Hybrid Microphone + Text Input Controls */}
            <View style={styles.inputControlsCard}>
              <View style={styles.micCircleContainer}>
                <TouchableOpacity
                  style={[styles.micCircleBtn, isRecording && styles.micCircleBtnRecording]}
                  onPress={handleToggleRecord}
                  activeOpacity={0.8}
                >
                  <Text style={styles.micCircleIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
                </TouchableOpacity>

                {isTranscribingVoice ? (
                  <View style={styles.aiVoiceProcessingCard}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.aiVoiceProcessingText}>
                      🤖 AI transcribing Tamil voice...
                    </Text>
                  </View>
                ) : isRecording ? (
                  <View style={styles.recordingPulse}>
                    <Text style={styles.recordingTimerText}>
                      🔴 கேட்கிறது... ({recordDuration}s) - Speak Tamil/English Now!
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.micInstructionText}>
                    தட்டவும் & பேசவும் (Tap Mic to Speak)
                  </Text>
                )}

                {/* Diagnostic Mic Test Button */}
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#F1F5F9',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                    alignSelf: 'center',
                  }}
                  onPress={handleTestMicrophone}
                  disabled={isTestingMic}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                    {isTestingMic ? '🎤 Diagnostic Recording (4s)...' : '🔧 Test Android Mic Capture'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text Fallback Input */}
              <View style={styles.textInputRow}>
                <TextInput
                  style={styles.hybridTextInput}
                  placeholder="அல்லது இங்கு எழுதவும் (or type here)..."
                  placeholderTextColor={theme.colors.gray400}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => processAssistantUtterance(inputText)}
                />
                <TouchableOpacity
                  style={styles.sendInputBtn}
                  onPress={() => processAssistantUtterance(inputText)}
                >
                  <Text style={styles.sendInputBtnText}>Send ➔</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Sample Prompts */}
            <Text style={styles.sectionLabel}>மாதிரி குரல் பதிவுகள் (Quick Voice Prompts):</Text>
            {SAMPLE_VOICE_TRANSCRIPTS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                onPress={() => processAssistantUtterance(item.text)}
              >
                <Text style={styles.promptChipLabel}>{item.label}</Text>
                <Text style={styles.promptChipText}>{item.text}</Text>
              </TouchableOpacity>
            ))}

            {/* Continue to AI Processing */}
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                !assistantResult.collectedFields.length && { backgroundColor: theme.colors.gray400 },
              ]}
              onPress={runAIProcessing}
              disabled={!assistantResult.collectedFields.length}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>
                Generate AI E-Commerce Catalog 🤖 →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: REAL MULTIMODAL AI CATALOG PROCESSING */}
        {currentFlowStep === 'ai_processing' && (
          <View style={styles.stepContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            <Text style={styles.aiTitle}>ZAH Multimodal AI Processing 🤖</Text>
            <Text style={styles.aiSub}>
              அமேசான் தரத்தில் பின்புலம் நீக்கப்பட்டு, தமிழ் பேச்சு ஆங்கிலத்தில் மாற்றப்படுகிறது...
            </Text>

            <View style={styles.aiProgressList}>
              <View style={styles.aiProgressRow}>
                <Text style={styles.aiProgressCheck}>{aiProcessingStage >= 1 ? '✅' : '⏳'}</Text>
                <Text style={styles.aiProgressText}>1. Amazon Studio White Background Removal</Text>
              </View>

              <View style={styles.aiProgressRow}>
                <Text style={styles.aiProgressCheck}>{aiProcessingStage >= 2 ? '✅' : '⏳'}</Text>
                <Text style={styles.aiProgressText}>2. Tamil Voice Speech NLP Parsing & Translation</Text>
              </View>

              <View style={styles.aiProgressRow}>
                <Text style={styles.aiProgressCheck}>{aiProcessingStage >= 3 ? '✅' : '⏳'}</Text>
                <Text style={styles.aiProgressText}>3. Technical Specs, Warranty, MRP & Feature Extraction</Text>
              </View>

              <View style={styles.aiProgressRow}>
                <Text style={styles.aiProgressCheck}>{aiProcessingStage >= 4 ? '✅' : '⏳'}</Text>
                <Text style={styles.aiProgressText}>4. Production Grade E-Commerce Catalog Ready</Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: AI CATALOG REVIEW & EDIT */}
        {currentFlowStep === 'review' && currentProduct && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>AI உருவாக்கிய தயாரிப்பு பட்டியல் 📋</Text>
            <Text style={styles.stepSub}>
              அமேசான் ஸ்டுடியோ படம் மற்றும் தமிழ்-ஆங்கில விவரங்கள் சரிபார்க்கவும்
            </Text>

            {/* Generated Catalog Preview Card */}
            <View style={styles.reviewCard}>
              <View style={styles.studioWhiteImageContainer}>
                <Image
                  source={{
                    uri:
                      currentProduct.images?.[0]?.originalUrl ||
                      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600',
                  }}
                  style={styles.reviewImage}
                />
                <View style={styles.amazonBadge}>
                  <Text style={styles.amazonBadgeText}>📦 Amazon Studio Background</Text>
                </View>
              </View>

              <Text style={styles.reviewCategory}>{currentProduct.categoryName?.value}</Text>

              {/* Title Input */}
              <Text style={styles.fieldLabel}>தயாரிப்பு பெயர் (Product Title):</Text>
              <TextInput
                style={styles.textInputEdit}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              {/* Pricing Row Inputs */}
              <View style={styles.priceEditRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>விற்பனை விலை (Price ₹):</Text>
                  <TextInput
                    style={styles.textInputEdit}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>அடக்கல் MRP (MRP ₹):</Text>
                  <TextInput
                    style={styles.textInputEdit}
                    keyboardType="numeric"
                    value={editMrp}
                    onChangeText={setEditMrp}
                  />
                </View>
              </View>

              {/* Description Input */}
              <Text style={styles.fieldLabel}>தயாரிப்பு விளக்கம் (Description):</Text>
              <TextInput
                style={[styles.textInputEdit, { minHeight: 80 }]}
                multiline
                value={editDesc}
                onChangeText={setEditDesc}
              />

              <Text style={styles.reviewSectionTitle}>சிறப்பம்சங்கள் (Highlights):</Text>
              {currentProduct.highlights.map((h, i) => (
                <Text key={i} style={styles.highlightBullet}>
                  • {h}
                </Text>
              ))}

              <Text style={styles.reviewSectionTitle}>விவரக்குறிப்புகள் (Specifications):</Text>
              {currentProduct.specifications.map((spec, i) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specLabel}>{spec.label}:</Text>
                  <Text style={styles.specVal}>{spec.value.value}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons: Edit or Publish */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handlePublish}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryActionText}>🚀 Publish Live to Online Store</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: SUCCESS / PUBLISHED CELEBRATION */}
        {currentFlowStep === 'success' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>தயாரிப்பு வெற்றிகரமாக வெளியிடப்பட்டது!</Text>
            <Text style={styles.successSub}>Published Live on Your E-Commerce Store</Text>

            <TouchableOpacity style={styles.primaryActionButton} onPress={onFinish}>
              <Text style={styles.primaryActionText}>View Live Catalog Dashboard →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 36 : 14,
    paddingBottom: 10,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  backBtnDisabled: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backBtnDisabledText: {
    fontSize: 11,
    color: theme.colors.gray400,
    fontWeight: '600',
  },
  stepBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepDot: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  stepDotTextActive: {
    color: theme.colors.white,
  },
  stepArrow: {
    fontSize: 9,
    color: theme.colors.gray400,
  },
  exitBtn: {
    padding: 6,
  },
  exitBtnText: {
    fontSize: 16,
    color: theme.colors.gray400,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  photoFrame: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyPhotoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  emptyPhotoSub: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  bgLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    paddingHorizontal: 20,
  },
  bgLoadingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  bgLoadingSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },
  previewImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  qualityCheckBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  qualityText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  studioBgRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  studioChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  studioChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  studioChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  studioChipTextActive: {
    color: theme.colors.white,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  photoOptionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoOptionIcon: {
    fontSize: 16,
  },
  photoOptionText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  micCircleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  micCircleBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  micCircleBtnRecording: {
    backgroundColor: '#EF4444',
  },
  micCircleIcon: {
    fontSize: 40,
  },
  recordingPulse: {
    marginTop: 12,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  aiVoiceProcessingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  aiVoiceProcessingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  waveBarRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  waveBar: {
    width: 4,
    height: 14,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  recordingTimerText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  micInstructionText: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  transcriptBoxContainer: {
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  transcriptInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  translationCard: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  translationCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  translationCardText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  promptChip: {
    backgroundColor: theme.colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  promptChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  promptChipText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...theme.shadows.sm,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  aiSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  aiProgressList: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  aiProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiProgressCheck: {
    fontSize: 18,
  },
  aiProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  studioWhiteImageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  reviewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  amazonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amazonBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  reviewCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
    marginTop: 8,
  },
  textInputEdit: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    marginBottom: 6,
  },
  priceEditRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  highlightBullet: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  specLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  // Guided AI Product Assistant Styles
  assistantProgressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  collectedBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  collectedBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  collectedBadgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  remainingBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remainingBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  chatContainer: {
    marginBottom: 16,
    gap: 10,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
  },
  chatBubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chatBubbleSeller: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderTopRightRadius: 4,
  },
  chatTextAi: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '600',
    lineHeight: 20,
  },
  chatTextSeller: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 20,
  },
  chipsSection: {
    marginBottom: 16,
  },
  chipsSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  chipsScroll: {
    gap: 8,
  },
  optionChipBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  inputControlsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    ...theme.shadows.sm,
  },
  textInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  hybridTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: theme.colors.text.primary,
  },
  sendInputBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendInputBtnText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
