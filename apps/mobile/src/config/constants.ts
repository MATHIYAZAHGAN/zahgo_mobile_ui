/**
 * Application Constants
 * 
 * Centralized constants used throughout the application
 */

export const APP_NAME = 'ZAH Seller AI';

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads

// File Limits
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGES_PER_PRODUCT = 5;
export const MAX_VOICE_DURATION_SECONDS = 120; // 2 minutes
export const MAX_VOICE_FILE_SIZE_MB = 20;

// Supported file formats
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'webm'];

// Product Status
export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  AI_REVIEW: 'ai_review',
  READY: 'ready',
  PUBLISHED: 'published',
  FAILED: 'failed',
  ARCHIVED: 'archived',
} as const;

// Product Status Labels (Multilingual - Tamil as primary)
export const PRODUCT_STATUS_LABELS = {
  draft: 'Draft / வரைவு',
  uploading: 'Uploading / பதிவேற்றம்',
  processing: 'Processing / செயலாக்கம்',
  ai_review: 'AI Review / AI பரிசீலனை',
  ready: 'Ready / தயார்',
  published: 'Published / வெளியிடப்பட்டது',
  failed: 'Failed / தோல்வி',
  archived: 'Archived / காப்பகப்படுத்தப்பட்டது',
};

// Languages
export const LANGUAGES = {
  TAMIL: 'tamil',
  ENGLISH: 'english',
  TELUGU: 'telugu',
  HINDI: 'hindi',
  MALAYALAM: 'malayalam',
  KANNADA: 'kannada',
} as const;

// Language Labels
export const LANGUAGE_LABELS = {
  tamil: 'தமிழ் (Tamil)',
  english: 'English',
  telugu: 'తెలుగు (Telugu)',
  hindi: 'हिन्दी (Hindi)',
  malayalam: 'മലയാളം (Malayalam)',
  kannada: 'ಕನ್ನಡ (Kannada)',
};

// AI Processing Stages
export const AI_STAGES = [
  {
    key: 'image_quality',
    label: 'Analyzing product image',
    tamilLabel: 'படத்தை பகுப்பாய்வு செய்கிறது',
  },
  {
    key: 'voice_transcription',
    label: 'Understanding your voice',
    tamilLabel: 'உங்கள் குரலை புரிந்துகொள்கிறது',
  },
  {
    key: 'product_identification',
    label: 'Identifying product',
    tamilLabel: 'தயாரிப்பை அடையாளம் காண்கிறது',
  },
  {
    key: 'catalog_generation',
    label: 'Creating product details',
    tamilLabel: 'தயாரிப்பு விவரங்களை உருவாக்குகிறது',
  },
  {
    key: 'seo_generation',
    label: 'Preparing catalog',
    tamilLabel: 'பட்டியலை தயார் செய்கிறது',
  },
  {
    key: 'finalization',
    label: 'Finalizing',
    tamilLabel: 'இறுதி செய்கிறது',
  },
];

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  LANGUAGE_PREFERENCE: 'language_preference',
  VOICE_LANGUAGE: 'voice_language',
  LOCAL_DRAFTS: 'local_drafts',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

// Navigation Routes
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Tabs
  HOME: 'Home',
  PRODUCTS: 'Products',
  PROFILE: 'Profile',
  
  // Add Product Flow
  ADD_PRODUCT: 'AddProduct',
  CAMERA: 'Camera',
  VOICE_RECORDING: 'VoiceRecording',
  UPLOAD_PROGRESS: 'UploadProgress',
  AI_PROCESSING: 'AIProcessing',
  PRODUCT_PREVIEW: 'ProductPreview',
  EDIT_PRODUCT: 'EditProduct',
  PUBLISH_CONFIRMATION: 'PublishConfirmation',
  
  // Product Management
  PRODUCT_DETAILS: 'ProductDetails',
  PRODUCT_LIST: 'ProductList',
  
  // Settings
  SETTINGS: 'Settings',
  LANGUAGE_SETTINGS: 'LanguageSettings',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Image Compression Quality
export const IMAGE_COMPRESSION = {
  THUMBNAIL: 0.5,
  OPTIMIZED: 0.8,
  ORIGINAL: 1.0,
} as const;

// Camera Settings
export const CAMERA = {
  ASPECT_RATIO: '4:3' as const,
  QUALITY: 0.8,
  DEFAULT_TYPE: 'back' as const,
} as const;

// Voice Recording Settings
export const VOICE = {
  SAMPLE_RATE: 44100,
  NUMBER_OF_CHANNELS: 1,
  BIT_RATE: 128000,
  EXTENSION: '.m4a',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  NETWORK_ERROR_TAMIL: 'இணைய பிழை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  SERVER_ERROR_TAMIL: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  UNAUTHORIZED: 'Please login to continue.',
  UNAUTHORIZED_TAMIL: 'தொடர உள்நுழையவும்.',
  IMAGE_TOO_LARGE: `Image size must be less than ${MAX_IMAGE_SIZE_MB}MB.`,
  IMAGE_TOO_LARGE_TAMIL: `படத்தின் அளவு ${MAX_IMAGE_SIZE_MB}MB க்கும் குறைவாக இருக்க வேண்டும்.`,
  POOR_IMAGE_QUALITY: 'Photo is a little unclear. Please take another photo.',
  POOR_IMAGE_QUALITY_TAMIL: 'புகைப்படம் சற்று தெளிவற்றது. மற்றொரு புகைப்படம் எடுக்கவும்.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_PUBLISHED: 'Your product is now online! 🎉',
  PRODUCT_PUBLISHED_TAMIL: 'உங்கள் தயாரிப்பு இப்போது இணையத்தில் உள்ளது! 🎉',
  DRAFT_SAVED: 'Draft saved successfully.',
  DRAFT_SAVED_TAMIL: 'வரைவு வெற்றிகரமாக சேமிக்கப்பட்டது.',
} as const;

// Feature Flags (for gradual rollout)
export const FEATURES = {
  ENABLE_VOICE_INPUT: true,
  ENABLE_MULTIPLE_IMAGES: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_AI_ASSISTANT: true,
  ENABLE_VOICE_EDITING: false, // Future feature
  ENABLE_BACKGROUND_REMOVAL: false, // Future feature
  ENABLE_BARCODE_SCAN: false, // Future feature
} as const;
