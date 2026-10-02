import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { theme } from '../config/theme';
import { useProductStore } from '../store/productStore';
import { useLanguageStore } from '../store/languageStore';
import { AIParserService } from '../services/aiParserService';
import { StudioImageProcessor } from '../utils/studioImageProcessor';
import { VoiceRecognitionService } from '../services/voiceRecognitionService';
import {
  ProductAssistantEngine,
  ProductDraftState,
  AssistantChatTurn,
  AssistantEngineResult,
} from '../services/productAssistantEngine';

const { width } = Dimensions.get('window');

interface AddProductFlowProps {
  editProductId?: string | null;
  onCancel: () => void;
  onFinish: () => void;
}

export default function AddProductFlow({ editProductId, onCancel, onFinish }: AddProductFlowProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

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

  const [selectedPhoto, setSelectedPhoto] = useState<string>(capturedImages[0] || '');
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveTranslation, setLiveTranslation] = useState('');

  // AI Conversation state
  const [productDraft, setProductDraft] = useState<ProductDraftState>({});
  const [inputText, setInputText] = useState('');
  const initialAiMessage = 'Hello! Tell me about the product you want to add.';
  const [chatTurns, setChatTurns] = useState<AssistantChatTurn[]>([
    {
      id: '1',
      sender: 'ai',
      text: initialAiMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: [
        { label: '⚡ Electronics', value: 'Electronics' },
        { label: '👕 Fashion', value: 'Fashion' },
        { label: '🧸 Toys', value: 'Toys' },
        { label: '🍳 Kitchen', value: 'Home & Kitchen' },
      ],
    },
  ]);
  const [assistantResult, setAssistantResult] = useState<AssistantEngineResult>(
    ProductAssistantEngine.evaluateAssistantState({})
  );

  // Review step editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const scrollRef = useRef<ScrollView>(null);

  // Sync current product into edit fields
  useEffect(() => {
    if (currentProduct) {
      setEditTitle(currentProduct.name?.value || '');
      setEditPrice(String(currentProduct.pricing?.price?.value || ''));
      setEditMrp(String(currentProduct.pricing?.mrp?.value || ''));
      setEditDesc(currentProduct.description || '');
    }
  }, [currentProduct]);

  // Update live translation whenever transcript changes
  useEffect(() => {
    if (voiceTranscript) {
      const r = AIParserService.translateTamilToEnglish(voiceTranscript);
      setLiveTranslation(r.englishTranslation);
    } else {
      setLiveTranslation('');
    }
  }, [voiceTranscript]);

  // Recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecording) {
      timer = setInterval(() => setRecordDuration((d) => d + 1), 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (VoiceRecognitionService.isRecording()) {
        VoiceRecognitionService.stopRecognition().catch(() => {});
      }
    };
  }, []);

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ---------- PHOTO STEP ----------

  const applyStudioBg = async (uri: string) => {
    setSelectedPhoto(uri);
    setIsProcessingBg(true);
    try {
      const studioUri = await StudioImageProcessor.removeBackground(uri);
      setSelectedPhoto(studioUri);
      setCapturedImages([studioUri]);
    } catch {
      setSelectedPhoto(uri);
      setCapturedImages([uri]);
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleTakePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(t('common.error'), t('addProduct.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await applyStudioBg(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(t('common.error'), t('addProduct.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await applyStudioBg(result.assets[0].uri);
    }
  };

  const handleConfirmPhoto = () => {
    setCapturedImages([selectedPhoto]);
    useProductStore.setState({ currentFlowStep: 'voice' });
  };

  // ---------- VOICE STEP ----------

  const processAssistantUtterance = useCallback(
    (userInput: string) => {
      const text = userInput.trim();
      if (!text) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userTurn: AssistantChatTurn = {
        id: Date.now().toString(),
        sender: 'seller',
        text,
        timestamp: timeStr,
      };

      const extracted = ProductAssistantEngine.parseUtterance(text, productDraft);
      const updatedDraft = { ...productDraft, ...extracted };
      setProductDraft(updatedDraft);
      useProductStore.setState({ productDraft: updatedDraft });

      const evalRes = ProductAssistantEngine.evaluateAssistantState(updatedDraft);
      setAssistantResult(evalRes);

      let aiText: string;
      if (evalRes.isComplete) {
        aiText = 'Great! All details collected. Ready to generate your AI catalog! 🎉';
      } else if (evalRes.nextQuestion) {
        aiText = evalRes.nextQuestion.englishQuestion;
      } else {
        aiText = 'Please provide more details.';
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
      scrollToBottom();

      const fullTranscript = Object.values(updatedDraft).filter(Boolean).join(' ');
      setVoiceTranscript(fullTranscript);
    },
    [productDraft, language, setVoiceTranscript, scrollToBottom]
  );

  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribingVoice(true);

      try {
        const audioUri = await VoiceRecognitionService.stopRecognition();
        if (!audioUri && Platform.OS !== 'web') {
          Alert.alert(t('common.error'), t('addProduct.voiceEmpty'));
          setIsTranscribingVoice(false);
          return;
        }

        const result = await AIParserService.processRecordedAudio(audioUri);
        if (result.tamilTranscript?.trim()) {
          setVoiceTranscript(result.tamilTranscript);
          processAssistantUtterance(result.tamilTranscript);
        } else {
          Alert.alert('Voice Not Detected', t('addProduct.voiceEmpty'));
        }
        if (result.englishTranslation) setLiveTranslation(result.englishTranslation);
      } catch {
        Alert.alert(t('common.error'), t('addProduct.micError'));
      } finally {
        setIsTranscribingVoice(false);
      }
    } else {
      setRecordDuration(0);
      const started = await VoiceRecognitionService.startRecognition(
        { language: 'ta-IN', continuous: true, interimResults: true },
        (res) => { if (res.transcript) setVoiceTranscript(res.transcript); },
        (err) => {
          setIsRecording(false);
          Alert.alert(t('common.error'), err || t('addProduct.micError'));
        }
      );
      if (started) {
        setIsRecording(true);
      } else {
        Alert.alert(t('common.error'), t('addProduct.micPermission'));
      }
    }
  };

  const handleOptionChipSelect = useCallback(
    (fieldKey: keyof ProductDraftState, optValue: string, optLabel: string) => {
      const updatedDraft = { ...productDraft, [fieldKey]: optValue };
      setProductDraft(updatedDraft);
      useProductStore.setState({ productDraft: updatedDraft });

      const evalRes = ProductAssistantEngine.evaluateAssistantState(updatedDraft);
      setAssistantResult(evalRes);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let nextText: string;
      if (evalRes.isComplete) {
        nextText = 'Perfect! All details collected. 🎉';
      } else if (evalRes.nextQuestion) {
        nextText = evalRes.nextQuestion.englishQuestion;
      } else {
        nextText = 'Continue.';
      }

      setChatTurns((prev) => [
        ...prev,
        { id: `s-${Date.now()}`, sender: 'seller', text: optLabel, timestamp: timeStr },
        {
          id: `a-${Date.now()}`,
          sender: 'ai',
          text: nextText,
          timestamp: timeStr,
          options: evalRes.nextQuestion?.options,
        },
      ]);
      scrollToBottom();
    },
    [productDraft, language, scrollToBottom]
  );

  // ---------- REVIEW STEP ----------

  const validateReview = (): boolean => {
    const errors: Record<string, string> = {};
    if (!editTitle.trim()) errors.title = t('addProduct.validationNameRequired');
    const priceNum = parseFloat(editPrice);
    if (!editPrice || isNaN(priceNum) || priceNum <= 0)
      errors.price = t('addProduct.validationPriceRequired');
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateReview()) return;
    if (!currentProduct) return;

    const priceVal = parseFloat(editPrice) || currentProduct.pricing?.price?.value || 0;
    const mrpVal = parseFloat(editMrp) || currentProduct.pricing?.mrp?.value || priceVal * 1.35;

    updateCurrentProduct({
      name: { ...currentProduct.name, value: editTitle.trim() },
      description: editDesc.trim(),
      pricing: {
        ...currentProduct.pricing,
        price: { ...currentProduct.pricing.price, value: priceVal },
        mrp: { ...currentProduct.pricing.mrp, value: mrpVal },
        compareAtPrice: { ...currentProduct.pricing.compareAtPrice, value: mrpVal },
      },
    });

    const success = await publishProduct(currentProduct.id);
    if (!success) {
      const err = useProductStore.getState().error;
      Alert.alert(t('common.error'), err || t('errors.publishFailed'));
    }
  };

  // ---------- NAVIGATION ----------

  const stepLabel = (step: string) => {
    switch (step) {
      case 'camera': return t('addProduct.stepPhoto');
      case 'voice': return t('addProduct.stepVoice');
      case 'ai_processing': return t('addProduct.stepAI');
      default: return t('addProduct.stepCatalog');
    }
  };

  const steps = ['camera', 'voice', 'ai_processing', 'review'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Step bar */}
      <View style={styles.flowBar}>
        <TouchableOpacity
          onPress={
            currentFlowStep === 'camera'
              ? onCancel
              : currentFlowStep === 'voice'
              ? () => useProductStore.setState({ currentFlowStep: 'camera' })
              : currentFlowStep === 'review'
              ? () => useProductStore.setState({ currentFlowStep: 'voice' })
              : undefined
          }
          style={styles.backBtn}
          disabled={currentFlowStep === 'ai_processing' || currentFlowStep === 'success'}
        >
          <Text style={styles.backBtnText}>
            {currentFlowStep === 'camera' ? '✕' : '←'}
          </Text>
        </TouchableOpacity>

        <View style={styles.stepDots}>
          {steps.map((s, i) => (
            <View key={s} style={styles.stepDotWrapper}>
              <View
                style={[
                  styles.stepDot,
                  currentFlowStep === s && styles.stepDotActive,
                  steps.indexOf(currentFlowStep) > i && styles.stepDotDone,
                ]}
              >
                <Text style={[styles.stepDotText, currentFlowStep === s && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              {i < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        <Text style={styles.stepLabel}>{stepLabel(currentFlowStep)}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== STEP 1: PHOTO ===== */}
          {currentFlowStep === 'camera' && (
            <View>
              <Text style={styles.stepTitle}>{t('addProduct.photoTitle')}</Text>
              <Text style={styles.stepSub}>{t('addProduct.photoSubtitle')}</Text>
              <View style={styles.photoFrame}>
                {selectedPhoto ? (
                  <Image source={{ uri: selectedPhoto }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <View style={styles.emptyPhoto}>
                    <Text style={styles.emptyPhotoIcon}>📸</Text>
                    <Text style={styles.emptyPhotoText}>Capture product photo</Text>
                  </View>
                )}
                {isProcessingBg && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.processingText}>{t('addProduct.aiProcessingTitle')}</Text>
                    <Text style={styles.processingSubText}>{t('addProduct.aiProcessingSubtitle')}</Text>
                  </View>
                )}
                {!isProcessingBg && !!selectedPhoto && (
                  <View style={styles.studioBadge}>
                    <Text style={styles.studioBadgeText}>✨ Studio White Active</Text>
                  </View>
                )}
              </View>
              <View style={styles.photoActionRow}>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleTakePhoto}
                  accessibilityRole="button"
                >
                  <Text style={styles.photoBtnIcon}>📸</Text>
                  <Text style={styles.photoBtnText}>{t('addProduct.takePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoBtn, { backgroundColor: '#4F46E5' }]}
                  onPress={handlePickGallery}
                  accessibilityRole="button"
                >
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>{t('addProduct.chooseGallery')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleConfirmPhoto}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>{t('addProduct.confirmPhoto')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== STEP 2: VOICE / CONVERSATION ===== */}
          {currentFlowStep === 'voice' && (
            <View>
              <Text style={styles.stepTitle}>{t('addProduct.voiceTitle')}</Text>
              <Text style={styles.stepSub}>{t('addProduct.voiceSubtitle')}</Text>

              {/* Progress bar */}
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>{t('addProduct.progressTitle')}</Text>
                  <Text style={styles.progressPercent}>{assistantResult.progressPercent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${assistantResult.progressPercent}%` }]} />
                </View>
                <View style={styles.badgeRow}>
                  {assistantResult.collectedFields.map((f) => (
                    <View key={f.key} style={styles.collectedBadge}>
                      <Text style={styles.collectedBadgeText}>✓ {f.label}</Text>
                    </View>
                  ))}
                  {assistantResult.remainingFields.map((f) => (
                    <View key={f.key} style={styles.remainingBadge}>
                      <Text style={styles.remainingBadgeText}>○ {f.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Chat */}
              <View style={styles.chatContainer}>
                {chatTurns.map((turn) => (
                  <View
                    key={turn.id}
                    style={[
                      styles.bubble,
                      turn.sender === 'ai' ? styles.bubbleAi : styles.bubbleSeller,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        turn.sender === 'ai' ? styles.bubbleTextAi : styles.bubbleTextSeller,
                      ]}
                    >
                      {turn.sender === 'ai' ? '🤖 ' : '🗣️ '}
                      {turn.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Option chips for current question */}
              {assistantResult.nextQuestion?.options && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                  style={{ marginBottom: 12 }}
                >
                  {assistantResult.nextQuestion.options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.optionChip}
                      onPress={() =>
                        handleOptionChipSelect(
                          assistantResult.nextQuestion!.fieldKey,
                          opt.value,
                          opt.label
                        )
                      }
                      accessibilityRole="button"
                    >
                      <Text style={styles.optionChipText}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* Mic + Text Input */}
              <View style={styles.inputCard}>
                <View style={styles.micRow}>
                  <TouchableOpacity
                    style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                    onPress={handleToggleRecord}
                    accessibilityRole="button"
                    accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <Text style={styles.micBtnIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
                  </TouchableOpacity>

                  {isTranscribingVoice ? (
                    <View style={styles.transcribingRow}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.transcribingText}>{t('addProduct.processingAudio')}</Text>
                    </View>
                  ) : isRecording ? (
                    <View style={styles.recordingRow}>
                      <Text style={styles.recordingText}>
                        {t('addProduct.recording')} ({recordDuration}s)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.micHint}>{t('addProduct.tapMic')}</Text>
                  )}
                </View>

                {/* Live voice transcript display */}
                {voiceTranscript && !isRecording && !isTranscribingVoice && (
                  <View style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>Your voice:</Text>
                    <Text style={styles.transcriptText}>{voiceTranscript}</Text>
                    {liveTranslation && liveTranslation !== voiceTranscript && (
                      <>
                        <Text style={styles.translationLabel}>→ English:</Text>
                        <Text style={styles.translationText}>{liveTranslation}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Text input */}
                <View style={styles.textRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('addProduct.typeHere')}
                    placeholderTextColor={theme.colors.gray400}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => processAssistantUtterance(inputText)}
                    returnKeyType="send"
                    multiline={false}
                  />
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => processAssistantUtterance(inputText)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sendBtnText}>{t('addProduct.send')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Generate button */}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  !assistantResult.collectedFields.length && styles.primaryBtnDisabled,
                ]}
                onPress={runAIProcessing}
                disabled={!assistantResult.collectedFields.length}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>{t('addProduct.generateAI')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== STEP 3: AI PROCESSING ===== */}
          {currentFlowStep === 'ai_processing' && (
            <View style={styles.aiProcessingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.aiTitle}>ZAH AI Processing 🤖</Text>
              <Text style={styles.aiSub}>
                Converting your voice input into a product catalog...
              </Text>
              <View style={styles.aiStepList}>
                {[
                  '1. Studio background removal',
                  '2. Voice NLP analysis',
                  '3. Details extraction',
                  '4. E-Commerce catalog ready',
                ].map((step, i) => (
                  <View key={i} style={styles.aiStepRow}>
                    <Text style={styles.aiStepCheck}>
                      {aiProcessingStage > i ? '✅' : aiProcessingStage === i ? '⏳' : '○'}
                    </Text>
                    <Text style={styles.aiStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ===== STEP 4: REVIEW ===== */}
          {currentFlowStep === 'review' && currentProduct && (
            <View>
              <Text style={styles.stepTitle}>{t('addProduct.reviewTitle')}</Text>
              <Text style={styles.stepSub}>{t('addProduct.reviewSubtitle')}</Text>

              <View style={styles.reviewCard}>
                {/* Product image */}
                {currentProduct.images?.[0]?.originalUrl ? (
                  <View style={styles.reviewImageContainer}>
                    <Image
                      source={{ uri: currentProduct.images[0].originalUrl }}
                      style={styles.reviewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                {/* Product Name */}
                <Text style={styles.fieldLabel}>{t('addProduct.productName')} *</Text>
                <TextInput
                  style={[styles.editInput, validationErrors.title && styles.editInputError]}
                  value={editTitle}
                  onChangeText={(v) => {
                    setEditTitle(v);
                    if (validationErrors.title) setValidationErrors((e) => ({ ...e, title: '' }));
                  }}
                  placeholder={t('addProduct.enterProductName')}
                  placeholderTextColor={theme.colors.gray400}
                />
                {!!validationErrors.title && (
                  <Text style={styles.validationError}>{validationErrors.title}</Text>
                )}

                {/* Brand & Category (read-only display) */}
                <View style={styles.reviewMetaRow}>
                  {currentProduct.brand?.value ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>{t('addProduct.brand')}</Text>
                      <Text style={styles.metaChipValue}>{currentProduct.brand.value}</Text>
                    </View>
                  ) : null}
                  {currentProduct.categoryName?.value ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>{t('addProduct.category')}</Text>
                      <Text style={styles.metaChipValue}>{currentProduct.categoryName.value}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Pricing */}
                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>{t('addProduct.price')} *</Text>
                    <TextInput
                      style={[styles.editInput, validationErrors.price && styles.editInputError]}
                      keyboardType="numeric"
                      value={editPrice}
                      onChangeText={(v) => {
                        setEditPrice(v);
                        if (validationErrors.price) setValidationErrors((e) => ({ ...e, price: '' }));
                      }}
                      placeholder="0"
                      placeholderTextColor={theme.colors.gray400}
                    />
                    {!!validationErrors.price && (
                      <Text style={styles.validationError}>{validationErrors.price}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>{t('addProduct.mrp')}</Text>
                    <TextInput
                      style={styles.editInput}
                      keyboardType="numeric"
                      value={editMrp}
                      onChangeText={setEditMrp}
                      placeholder="0"
                      placeholderTextColor={theme.colors.gray400}
                    />
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.fieldLabel}>{t('addProduct.description')}</Text>
                <TextInput
                  style={[styles.editInput, styles.editInputMultiline]}
                  multiline
                  numberOfLines={3}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder={t('addProduct.productDescription')}
                  placeholderTextColor={theme.colors.gray400}
                  textAlignVertical="top"
                />

                {/* Highlights */}
                {currentProduct.highlights?.length > 0 && (
                  <>
                    <Text style={styles.reviewSectionTitle}>{t('addProduct.highlights')}</Text>
                    {currentProduct.highlights.map((h, i) => (
                      <Text key={i} style={styles.bulletText}>• {h}</Text>
                    ))}
                  </>
                )}

                {/* Specifications */}
                {currentProduct.specifications?.length > 0 && (
                  <>
                    <Text style={styles.reviewSectionTitle}>{t('addProduct.specifications')}</Text>
                    {currentProduct.specifications.map((spec, i) => (
                      <View key={i} style={styles.specRow}>
                        <Text style={styles.specLabel}>{spec.label}</Text>
                        <Text style={styles.specValue}>{spec.value?.value}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                onPress={handlePublish}
                disabled={isLoading}
                accessibilityRole="button"
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('addProduct.publishProduct')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ===== STEP 5: SUCCESS ===== */}
          {currentFlowStep === 'success' && (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>{t('addProduct.successTitle')}</Text>
              <Text style={styles.successSub}>{t('addProduct.successSubtitle')}</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onFinish}
                accessibilityRole="button"
              >
                <Text style={styles.primaryBtnText}>{t('addProduct.backToDashboard')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    gap: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  stepDots: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDotWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepDotDone: { backgroundColor: theme.colors.success },
  stepDotText: { fontSize: 10, fontWeight: '700', color: theme.colors.gray400 },
  stepDotTextActive: { color: theme.colors.white },
  stepLine: {
    width: Math.max(8, (width - 200) / 6),
    height: 2,
    backgroundColor: theme.colors.gray200,
    marginHorizontal: 2,
  },
  stepLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.text.secondary },
  scrollContent: {
    padding: Math.min(20, width * 0.05),
    paddingBottom: 48,
  },
  stepTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 4 },
  stepSub: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 16, lineHeight: 18 },

  // Photo step
  photoFrame: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  emptyPhoto: { alignItems: 'center' },
  emptyPhotoIcon: { fontSize: 44, marginBottom: 8 },
  emptyPhotoText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '600' },
  processingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  processingText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  processingSubText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  studioBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  studioBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  photoActionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoBtnIcon: { fontSize: 16 },
  photoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Primary button
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...theme.shadows.sm,
  },
  primaryBtnDisabled: { backgroundColor: theme.colors.gray300 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Voice step
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  progressPercent: { fontSize: 13, fontWeight: '800', color: '#38BDF8' },
  progressTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  collectedBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  collectedBadgeText: { color: '#A7F3D0', fontSize: 10, fontWeight: '700' },
  remainingBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  remainingBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  chatContainer: { marginBottom: 12, gap: 8 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 14 },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bubbleSeller: { alignSelf: 'flex-end', backgroundColor: '#3B82F6', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  bubbleTextAi: { color: '#1E3A8A' },
  bubbleTextSeller: { color: '#fff' },
  chipsScroll: { paddingVertical: 4, gap: 8 },
  optionChip: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  optionChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  inputCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
    ...theme.shadows.sm,
  },
  micRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  micBtnRecording: { backgroundColor: '#EF4444' },
  micBtnIcon: { fontSize: 32 },
  micHint: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '600', flex: 1 },
  transcribingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  transcribingText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, flex: 1 },
  recordingRow: { flex: 1 },
  recordingText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
  transcriptCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  transcriptLabel: { fontSize: 11, fontWeight: '700', color: '#15803D', marginBottom: 3 },
  transcriptText: { fontSize: 13, color: '#166534', fontWeight: '600', lineHeight: 18 },
  translationLabel: { fontSize: 11, fontWeight: '700', color: '#1E40AF', marginTop: 6, marginBottom: 2 },
  translationText: { fontSize: 12, color: '#1E3A8A', fontWeight: '500' },
  textRow: { flexDirection: 'row', gap: 8 },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  sendBtn: {
    height: 42,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // AI Processing step
  aiProcessingContainer: { alignItems: 'center', paddingVertical: 24 },
  aiTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 6 },
  aiSub: { fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 },
  aiStepList: {
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    width: '100%',
  },
  aiStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiStepCheck: { fontSize: 18 },
  aiStepText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, flex: 1 },

  // Review step
  reviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.sm,
  },
  reviewImageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewImage: { width: '100%', height: 180 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  editInputError: { borderColor: theme.colors.error },
  editInputMultiline: { minHeight: 72, paddingTop: 10 },
  validationError: { fontSize: 11, color: theme.colors.error, marginTop: 3 },
  reviewMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  metaChipLabel: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600', marginBottom: 2 },
  metaChipValue: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  priceRow: { flexDirection: 'row', gap: 12 },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  bulletText: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 3, lineHeight: 18 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  specLabel: { fontSize: 12, color: theme.colors.text.secondary },
  specValue: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary },

  // Success step
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
});
