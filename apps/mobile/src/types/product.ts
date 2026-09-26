/**
 * Product-related TypeScript types
 * Shared between mobile app and backend
 */

export enum ProductStatus {
  Draft = 'Draft',
  Uploading = 'Uploading',
  Processing = 'Processing',
  AIReview = 'AIReview',
  Ready = 'Ready',
  Published = 'Published',
  Failed = 'Failed',
  Archived = 'Archived',
}

export enum InformationSource {
  SellerVoice = 'SellerVoice',
  SellerInput = 'SellerInput',
  ProductImage = 'ProductImage',
  PackageImage = 'PackageImage',
  Barcode = 'Barcode',
  TrustedCatalog = 'TrustedCatalog',
  AIInference = 'AIInference',
  Vision = 'Vision',
}

export enum Language {
  Tamil = 'Tamil',
  English = 'English',
  Telugu = 'Telugu',
  Hindi = 'Hindi',
  Malayalam = 'Malayalam',
  Kannada = 'Kannada',
}

export interface SourcedValue<T> {
  value: T | null;
  source: InformationSource;
  confidence: number;
  originalValue?: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  processedUrl?: string;
  isPrimary: boolean;
  order: number;
  altText: string;
  metadata: ImageMetadata;
  uploadedAt: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  sizeInBytes: number;
  format: string;
  isBlurry: boolean;
  isLowLight: boolean;
  hasBackground: boolean;
  qualityScore: number;
}

export interface ProductSpecification {
  key: string;
  label: string;
  value: SourcedValue<string>;
  unit?: string;
  order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>; // e.g., { color: 'Red', size: 'M' }
  price?: number;
  compareAtPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface ProductPricing {
  price: SourcedValue<number>;
  compareAtPrice: SourcedValue<number>;
  mrp: SourcedValue<number>;
  currency: string;
  costPrice?: number;
  isTaxInclusive: boolean;
  taxPercentage: number;
}

export interface ProductInventory {
  stockQuantity: SourcedValue<number>;
  sku?: string;
  barcode?: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold?: number;
}

export interface ProductSEO {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
}

export interface VoiceTranscript {
  id: string;
  originalText: string;
  normalizedText: string;
  language: Language;
  translatedText?: string;
  confidence: number;
  duration: number; // in milliseconds
  transcribedAt: string;
}

export interface AIQuestion {
  id: string;
  question: string;
  field: string;
  type: 'text' | 'number' | 'single_choice' | 'multiple_choice' | 'voice';
  suggestedAnswers?: string[];
  answer?: string;
  isRequired: boolean;
}

export interface AIMetadata {
  generationId: string;
  model: string;
  overallConfidence: number;
  voiceTranscript?: VoiceTranscript;
  missingInformation: string[];
  questions: AIQuestion[];
  generatedAt: string;
  fieldConfidence: Record<string, number>;
}

export interface Product {
  id: string;
  sellerId: string;
  storeId?: string;
  name: SourcedValue<string>;
  slug: string;
  brand: SourcedValue<string>;
  model: SourcedValue<string>;
  categoryId?: string;
  categoryName: SourcedValue<string>;
  subCategoryName: SourcedValue<string>;
  productType: SourcedValue<string>;
  shortDescription: string;
  description: string;
  highlights: string[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  seo: ProductSEO;
  aiMetadata?: AIMetadata;
  status: ProductStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// API Request/Response types
export interface CreateProductDraftRequest {
  sellerId: string;
  storeId?: string;
}

export interface CreateProductDraftResponse {
  productId: string;
  status: ProductStatus;
  uploadUrls: {
    images: string;
    voice: string;
  };
}

export interface UploadProductMediaRequest {
  productId: string;
  images: File[];
  voiceRecording?: File;
}

export interface StartAIProcessingRequest {
  productId: string;
  preferredLanguage?: Language;
}

export interface AIProcessingStatusResponse {
  productId: string;
  status: ProductStatus;
  progress: number; // 0-100
  currentStage: string;
  estimatedTimeRemaining?: number; // in seconds
  error?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PublishProductRequest {
  productId: string;
}

export interface PublishProductResponse {
  success: boolean;
  productId: string;
  publishedUrl?: string;
  message: string;
}

// Local draft (offline support)
export interface LocalProductDraft {
  localId: string;
  productId?: string; // null if not yet synced
  images: LocalImage[];
  voiceRecording?: LocalVoiceRecording;
  manualInputs: Record<string, any>;
  status: 'pending_upload' | 'uploading' | 'uploaded' | 'failed';
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface LocalImage {
  localUri: string;
  isPrimary: boolean;
  order: number;
  uploaded: boolean;
}

export interface LocalVoiceRecording {
  localUri: string;
  duration: number;
  uploaded: boolean;
}
