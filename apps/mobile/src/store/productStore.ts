import { create } from 'zustand';
import { Product, ProductStatus, InformationSource } from '../types/product';
import { apiClient } from '../services/apiClient';
import { AIParserService } from '../services/aiParserService';

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;

  // Add Product Flow State
  currentFlowStep: 'camera' | 'voice' | 'ai_processing' | 'review' | 'success';
  capturedImages: string[];
  voiceTranscript: string;
  productDraft?: any;
  aiProcessingStage: number;

  // Actions
  fetchProducts: () => Promise<void>;
  startNewProductFlow: () => void;
  startEditProductFlow: (productId: string) => void;
  setCapturedImages: (images: string[]) => void;
  setVoiceTranscript: (transcript: string) => void;
  runAIProcessing: () => Promise<void>;
  updateCurrentProduct: (updated: Partial<Product>) => void;
  updateProduct: (productId: string, updated: Product) => Promise<boolean>;
  publishProduct: (productId: string) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  resetFlow: () => void;
}

const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).substring(0, 24);
};

// Map backend ProductSummaryDto to frontend Product shape
const mapSummaryToProduct = (dto: any): Product => ({
  id: dto.id || dto.Id || '',
  sellerId: dto.sellerId || dto.SellerId || '',
  name: {
    value: dto.name || dto.Name || 'Untitled Product',
    source: InformationSource.AIInference,
    confidence: 1,
    createdAt: dto.createdAt || new Date().toISOString(),
  },
  slug: (dto.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  brand: {
    value: dto.brand || dto.Brand || '',
    source: InformationSource.AIInference,
    confidence: 1,
    createdAt: dto.createdAt || new Date().toISOString(),
  },
  model: { value: '', source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
  categoryName: { value: dto.categoryName || dto.CategoryName || 'General', source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
  subCategoryName: { value: '', source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
  productType: { value: '', source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
  shortDescription: '',
  description: dto.description || '',
  highlights: [],
  images: dto.primaryImageUrl || dto.PrimaryImageUrl
    ? [{
        id: 'primary',
        originalUrl: dto.primaryImageUrl || dto.PrimaryImageUrl,
        optimizedUrl: dto.primaryImageUrl || dto.PrimaryImageUrl,
        thumbnailUrl: dto.primaryImageUrl || dto.PrimaryImageUrl,
        isPrimary: true,
        order: 1,
        altText: dto.name || 'Product',
        metadata: { width: 400, height: 400, sizeInBytes: 0, format: 'jpg', isBlurry: false, isLowLight: false, hasBackground: true, qualityScore: 0.9 },
        uploadedAt: new Date().toISOString(),
      }]
    : [],
  specifications: [],
  variants: [],
  pricing: {
    price: { value: dto.price || dto.Price || 0, source: InformationSource.SellerVoice, confidence: 1, createdAt: new Date().toISOString() },
    compareAtPrice: { value: 0, source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
    mrp: { value: 0, source: InformationSource.AIInference, confidence: 1, createdAt: new Date().toISOString() },
    currency: '₹',
    isTaxInclusive: true,
    taxPercentage: 18,
  },
  inventory: {
    stockQuantity: { value: 0, source: InformationSource.SellerInput, confidence: 1, createdAt: new Date().toISOString() },
    trackInventory: true,
    allowBackorder: false,
  },
  seo: { title: '', description: '', slug: '', keywords: [] },
  status: dto.status !== undefined ? dto.status : ProductStatus.Draft,
  tags: [],
  createdAt: dto.createdAt || dto.CreatedAt || new Date().toISOString(),
  updatedAt: dto.updatedAt || dto.UpdatedAt || new Date().toISOString(),
  publishedAt: dto.publishedAt || dto.PublishedAt,
});

export const useProductStore = create<ProductState>((set, get) => ({
  // Start with EMPTY array — no fake/demo products ever
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,

  currentFlowStep: 'camera',
  capturedImages: [],
  voiceTranscript: '',
  aiProcessingStage: 0,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<any>('/products');
      if (response.success && response.data) {
        const rawList = response.data.products || response.data;
        if (Array.isArray(rawList)) {
          const mapped = rawList.map(mapSummaryToProduct);
          set({ products: mapped, isLoading: false });
        } else {
          set({ products: [], isLoading: false });
        }
      } else {
        set({ products: [], isLoading: false });
      }
    } catch (err: any) {
      set({ products: [], isLoading: false, error: null }); // Silent fail — show empty state
    }
  },

  startNewProductFlow: () => {
    set({
      currentFlowStep: 'camera',
      capturedImages: [],
      voiceTranscript: '',
      aiProcessingStage: 0,
      currentProduct: null,
      productDraft: undefined,
    });
  },

  startEditProductFlow: (productId: string) => {
    const product = get().products.find((p) => p.id === productId);
    if (product) {
      const images =
        product.images && product.images.length > 0 ? [product.images[0].originalUrl] : [];
      set({
        currentFlowStep: 'review',
        capturedImages: images,
        voiceTranscript: '',
        aiProcessingStage: 0,
        currentProduct: product,
        productDraft: undefined,
      });
    }
  },

  setCapturedImages: (images: string[]) => set({ capturedImages: images }),

  setVoiceTranscript: (transcript: string) => set({ voiceTranscript: transcript }),

  runAIProcessing: async () => {
    set({ currentFlowStep: 'ai_processing', aiProcessingStage: 0 });

    await new Promise((r) => setTimeout(r, 800));
    set({ aiProcessingStage: 1 });
    await new Promise((r) => setTimeout(r, 1000));
    set({ aiProcessingStage: 2 });
    await new Promise((r) => setTimeout(r, 1200));
    set({ aiProcessingStage: 3 });

    const images = get().capturedImages;
    const draft = get().productDraft;
    let aiParsed: any;

    if (draft && (draft.productName || draft.category)) {
      aiParsed = AIParserService.generateCatalogFromDraft(draft, images[0] || '');
    } else {
      const rawTranscript = get().voiceTranscript || 'Product captured';
      // Always translate to English before parsing so product name is English
      const translated = AIParserService.translateTamilToEnglish(rawTranscript);
      const transcript = translated.englishTranslation || rawTranscript;
      aiParsed = AIParserService.parseVoiceAndImage(transcript, images[0] || '');
    }

    const generatedProduct: Product = {
      id: generateObjectId(),
      sellerId: '',
      name: {
        value: aiParsed.productName,
        source: InformationSource.AIInference,
        confidence: aiParsed.confidenceScore,
        createdAt: new Date().toISOString(),
      },
      slug: aiParsed.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: {
        value: aiParsed.brand,
        source: InformationSource.SellerVoice,
        confidence: 0.95,
        createdAt: new Date().toISOString(),
      },
      model: {
        value: aiParsed.model,
        source: InformationSource.AIInference,
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
      categoryName: {
        value: aiParsed.categoryName,
        source: InformationSource.AIInference,
        confidence: 0.99,
        createdAt: new Date().toISOString(),
      },
      subCategoryName: {
        value: aiParsed.subCategoryName,
        source: InformationSource.AIInference,
        confidence: 0.95,
        createdAt: new Date().toISOString(),
      },
      productType: {
        value: aiParsed.productType,
        source: InformationSource.AIInference,
        confidence: 0.95,
        createdAt: new Date().toISOString(),
      },
      shortDescription: aiParsed.shortDescription,
      description: aiParsed.description,
      highlights: aiParsed.highlights,
      images:
        images.length > 0
          ? images.map((uri, idx) => ({
              id: `img-${idx}`,
              originalUrl: uri,
              optimizedUrl: uri,
              thumbnailUrl: uri,
              isPrimary: idx === 0,
              order: idx + 1,
              altText: aiParsed.productName,
              metadata: {
                width: 800,
                height: 800,
                sizeInBytes: 150000,
                format: 'jpg',
                isBlurry: false,
                isLowLight: false,
                hasBackground: true,
                qualityScore: 0.98,
              },
              uploadedAt: new Date().toISOString(),
            }))
          : [],
      specifications: aiParsed.specifications,
      variants: [],
      pricing: {
        price: {
          value: aiParsed.price,
          source: InformationSource.SellerVoice,
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        },
        compareAtPrice: {
          value: aiParsed.mrp,
          source: InformationSource.AIInference,
          confidence: 0.9,
          createdAt: new Date().toISOString(),
        },
        mrp: {
          value: aiParsed.mrp,
          source: InformationSource.AIInference,
          confidence: 0.9,
          createdAt: new Date().toISOString(),
        },
        currency: '₹',
        isTaxInclusive: true,
        taxPercentage: 18,
      },
      inventory: {
        stockQuantity: {
          value: aiParsed.stockQuantity,
          source: InformationSource.SellerInput,
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        },
        trackInventory: true,
        allowBackorder: false,
      },
      seo: {
        title: aiParsed.suggestedSEOTitle,
        description: aiParsed.suggestedSEODescription,
        slug: aiParsed.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        keywords: aiParsed.keywords,
      },
      status: ProductStatus.AIReview,
      tags: aiParsed.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ currentProduct: generatedProduct, currentFlowStep: 'review' });
  },

  updateCurrentProduct: (updated: Partial<Product>) => {
    const curr = get().currentProduct;
    if (curr) {
      set({ currentProduct: { ...curr, ...updated, updatedAt: new Date().toISOString() } });
    }
  },

  updateProduct: async (productId: string, updated: Product) => {
    set({ isLoading: true });
    try {
      await apiClient.put(`/products/${productId}`, updated).catch(() => null);
      const updatedList = get().products.map((p) =>
        p.id === productId ? { ...updated, updatedAt: new Date().toISOString() } : p
      );
      set({ products: updatedList, isLoading: false });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  publishProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const product = get().currentProduct || get().products.find((p) => p.id === productId);
      if (!product) {
        set({ isLoading: false, error: 'Product not found' });
        return false;
      }

      let savedProductId = productId;
      let productToSave = { ...product };

      // Try to update existing product; if 404 create new draft
      let productExists = false;
      try {
        const updateTest = await apiClient.put(`/products/${productId}`, productToSave);
        if (updateTest.success) productExists = true;
      } catch (err: any) {
        if (err?.response?.status !== 404) throw err;
      }

      if (!productExists) {
        const createResp = await apiClient.post('/products');
        if (!createResp.success || !createResp.data) throw new Error('Failed to create draft');
        savedProductId = createResp.data.productId || createResp.data.ProductId;
        productToSave = { ...product, id: savedProductId };
        const updateResp = await apiClient.put(`/products/${savedProductId}`, productToSave);
        if (!updateResp.success) throw new Error('Failed to update draft');
      }

      // Set Ready
      const readyProduct = { ...productToSave, id: savedProductId, status: ProductStatus.Ready };
      await apiClient.put(`/products/${savedProductId}`, readyProduct);

      // Publish
      const publishResp = await apiClient.post(`/products/${savedProductId}/publish`);
      if (!publishResp.success) throw new Error(publishResp.error?.message || 'Publish failed');

      const updatedProduct: Product = {
        ...productToSave,
        id: savedProductId,
        status: ProductStatus.Published,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Replace in list (remove old temp ID if different, add saved one)
      const filtered = get().products.filter(
        (p) => p.id !== productId && p.id !== savedProductId
      );
      set({
        products: [updatedProduct, ...filtered],
        currentProduct: updatedProduct,
        currentFlowStep: 'success',
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      const msg =
        error?.response?.status === 401
          ? 'Authentication required. Please log in again.'
          : error?.message || 'Failed to publish product. Please check your connection.';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      await apiClient.delete(`/products/${productId}`).catch(() => null);
    } catch {}
    set({ products: get().products.filter((p) => p.id !== productId) });
    return true;
  },

  resetFlow: () => {
    set({
      currentFlowStep: 'camera',
      capturedImages: [],
      voiceTranscript: '',
      aiProcessingStage: 0,
      currentProduct: null,
      productDraft: undefined,
    });
  },
}));
