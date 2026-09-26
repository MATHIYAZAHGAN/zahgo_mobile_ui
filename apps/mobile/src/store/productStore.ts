import { create } from 'zustand';
import { Product, ProductStatus, InformationSource, Language } from '../types/product';
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
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + random).substring(0, 24);
};

// Sample seed products for initial rich experience if server is empty
const INITIAL_SAMPLE_PRODUCTS: Product[] = [
  {
    id: '65f1a2b3c4d5e6f7a8b9c0d1',
    sellerId: '65f1a2b3c4d5e6f7a8b9c0f0',
    name: {
      value: 'Butterfly Jet Elite 750W Mixer Grinder with 3 Jars',
      source: InformationSource.AIInference,
      confidence: 0.98,
      createdAt: new Date().toISOString(),
    },
    slug: 'butterfly-jet-elite-750w-mixer-grinder',
    brand: {
      value: 'Butterfly',
      source: InformationSource.SellerVoice,
      confidence: 1.0,
      createdAt: new Date().toISOString(),
    },
    model: {
      value: 'Jet Elite',
      source: InformationSource.Vision,
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    },
    categoryName: {
      value: 'Home Appliances / சமையலறை உபகரணங்கள்',
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    subCategoryName: {
      value: 'Kitchen Appliances',
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    productType: {
      value: 'Mixer Grinder',
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    shortDescription: 'Powerful 750-Watt motor mixer grinder with 3 stainless steel jars for heavy Indian kitchen grinding.',
    description: 'Butterfly Jet Elite 750W Mixer Grinder is engineered for maximum performance and durability. Features 3 heavy-duty stainless steel jars, ergonomic handles, overload protection switch, and sleek black finish.',
    highlights: [
      '⚡ 750 Watt Heavy Duty Motor',
      '🏺 3 Stainless Steel Jars (1.5L, 1.0L, 0.4L)',
      '🔒 Overload Protection Switch',
      '🛡️ 2 Years Manufacturer Warranty',
    ],
    images: [
      {
        id: 'img-1',
        originalUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        optimizedUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80',
        isPrimary: true,
        order: 1,
        altText: 'Butterfly Mixer Grinder',
        metadata: {
          width: 800,
          height: 800,
          sizeInBytes: 150000,
          format: 'jpg',
          isBlurry: false,
          isLowLight: false,
          hasBackground: true,
          qualityScore: 0.95,
        },
        uploadedAt: new Date().toISOString(),
      },
    ],
    specifications: [
      {
        key: 'power',
        label: 'Power / சக்தி',
        value: { value: '750 Watts', source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
        order: 1,
      },
      {
        key: 'jarCount',
        label: 'No. of Jars / ஜார்கள் எண்ணிக்கை',
        value: { value: '3 Jars', source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
        order: 2,
      },
      {
        key: 'warranty',
        label: 'Warranty / உத்தரவாதம்',
        value: { value: '2 Years', source: InformationSource.SellerVoice, confidence: 0.9, createdAt: new Date().toISOString() },
        order: 3,
      },
    ],
    variants: [],
    pricing: {
      price: { value: 4200, source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
      compareAtPrice: { value: 5499, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
      mrp: { value: 5499, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
      currency: '₹',
      isTaxInclusive: true,
      taxPercentage: 18,
    },
    inventory: {
      stockQuantity: { value: 10, source: InformationSource.SellerInput, confidence: 1.0, createdAt: new Date().toISOString() },
      trackInventory: true,
      allowBackorder: false,
    },
    seo: {
      title: 'Buy Butterfly Jet Elite 750W Mixer Grinder Online',
      description: 'Get the best price on Butterfly Jet Elite 750W Mixer Grinder with 3 jars.',
      slug: 'butterfly-jet-elite-750w-mixer-grinder',
      keywords: ['butterfly', 'mixer grinder', '750w', 'kitchen appliances'],
    },
    status: ProductStatus.Published,
    tags: ['Kitchen', 'Mixer', 'Butterfly', 'Appliances'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c0d2',
    sellerId: '65f1a2b3c4d5e6f7a8b9c0f0',
    name: {
      value: 'Men Cotton Casual Kurta Shirt - Navy Blue',
      source: InformationSource.AIInference,
      confidence: 0.96,
      createdAt: new Date().toISOString(),
    },
    slug: 'men-cotton-casual-kurta-shirt-navy-blue',
    brand: {
      value: 'EthnicCraft',
      source: InformationSource.AIInference,
      confidence: 0.85,
      createdAt: new Date().toISOString(),
    },
    model: {
      value: 'Kurta 2026',
      source: InformationSource.AIInference,
      confidence: 0.8,
      createdAt: new Date().toISOString(),
    },
    categoryName: {
      value: 'Fashion / ஆடைகள்',
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    subCategoryName: {
      value: "Men's Clothing",
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    productType: {
      value: 'Kurta',
      source: InformationSource.AIInference,
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    shortDescription: 'Pure breathable cotton kurta shirt for men, perfect for festivals and casual wear.',
    description: 'Handcrafted pure cotton long kurta shirt in navy blue. Features mandarin collar, full sleeves, side pockets, and comfortable relaxed fit for all seasons.',
    highlights: [
      '🧵 100% Pure Premium Cotton',
      '👔 Stylish Mandarin Collar',
      '✨ Breathable & Comfortable Fit',
      '🎨 Colorfast Machine Washable',
    ],
    images: [
      {
        id: 'img-2',
        originalUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        optimizedUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80',
        isPrimary: true,
        order: 1,
        altText: 'Navy Blue Kurta Shirt',
        metadata: {
          width: 800,
          height: 800,
          sizeInBytes: 120000,
          format: 'jpg',
          isBlurry: false,
          isLowLight: false,
          hasBackground: true,
          qualityScore: 0.92,
        },
        uploadedAt: new Date().toISOString(),
      },
    ],
    specifications: [
      {
        key: 'fabric',
        label: 'Fabric / துணி வகை',
        value: { value: '100% Cotton', source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
        order: 1,
      },
      {
        key: 'color',
        label: 'Color / நிறம்',
        value: { value: 'Navy Blue', source: InformationSource.Vision, confidence: 0.95, createdAt: new Date().toISOString() },
        order: 2,
      },
    ],
    variants: [],
    pricing: {
      price: { value: 899, source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
      compareAtPrice: { value: 1499, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
      mrp: { value: 1499, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
      currency: '₹',
      isTaxInclusive: true,
      taxPercentage: 5,
    },
    inventory: {
      stockQuantity: { value: 25, source: InformationSource.SellerInput, confidence: 1.0, createdAt: new Date().toISOString() },
      trackInventory: true,
      allowBackorder: false,
    },
    seo: {
      title: 'Men Navy Blue Cotton Kurta Shirt',
      description: 'Shop men navy blue cotton kurta shirt online at best price.',
      slug: 'men-cotton-casual-kurta-shirt-navy-blue',
      keywords: ['kurta', 'cotton', 'men fashion', 'ethnic'],
    },
    status: ProductStatus.Draft,
    tags: ['Fashion', 'Kurta', 'Cotton', 'Men'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: INITIAL_SAMPLE_PRODUCTS,
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
      if (response.success && response.data && Array.isArray(response.data.products)) {
        set({ products: response.data.products, isLoading: false });
      } else {
        // Keep initial sample if backend API empty/mock
        set({ isLoading: false });
      }
    } catch {
      // Fallback gracefully to existing products list
      set({ isLoading: false });
    }
  },

  startNewProductFlow: () => {
    set({
      currentFlowStep: 'camera',
      capturedImages: [],
      voiceTranscript: '',
      aiProcessingStage: 0,
      currentProduct: null,
    });
  },

  startEditProductFlow: (productId: string) => {
    const product = get().products.find(p => p.id === productId);
    if (product) {
      const images = product.images && product.images.length > 0 
        ? [product.images[0].originalUrl] 
        : [];
      
      set({
        currentFlowStep: 'review', // Go directly to review step
        capturedImages: images,
        voiceTranscript: '',
        aiProcessingStage: 0,
        currentProduct: product,
      });
    }
  },

  setCapturedImages: (images: string[]) => {
    set({ capturedImages: images });
  },

  setVoiceTranscript: (transcript: string) => {
    set({ voiceTranscript: transcript });
  },

  runAIProcessing: async () => {
    set({ currentFlowStep: 'ai_processing', aiProcessingStage: 0 });

    // Step 1: Image Analysis
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ aiProcessingStage: 1 });

    // Step 2: Voice Understanding
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ aiProcessingStage: 2 });

    // Step 3: AI Identification & Multimodal Catalog Generation
    await new Promise((resolve) => setTimeout(resolve, 1200));
    set({ aiProcessingStage: 3 });

    // Step 4: Construct AI-Generated Product
    const images = get().capturedImages;
    const draft = get().productDraft;
    let aiParsed: any;

    if (draft && (draft.productName || draft.category)) {
      aiParsed = AIParserService.generateCatalogFromDraft(draft, images[0] || '');
    } else {
      const transcript = get().voiceTranscript || 'Product photo captured by seller';
      aiParsed = AIParserService.parseVoiceAndImage(transcript, images[0] || '');
    }

    const generatedProduct: Product = {
      id: generateObjectId(),
      sellerId: '65f1a2b3c4d5e6f7a8b9c0f0',
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
      images: images.length > 0 ? images.map((uri, idx) => ({
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
      })) : [
        {
          id: 'img-default',
          originalUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
          optimizedUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
          isPrimary: true,
          order: 1,
          altText: aiParsed.productName,
          metadata: {
            width: 800,
            height: 800,
            sizeInBytes: 150000,
            format: 'jpg',
            isBlurry: false,
            isLowLight: false,
            hasBackground: true,
            qualityScore: 0.95,
          },
          uploadedAt: new Date().toISOString(),
        },
      ],
      specifications: aiParsed.specifications,
      variants: [],
      pricing: {
        price: { value: aiParsed.price, source: InformationSource.SellerVoice, confidence: 1.0, createdAt: new Date().toISOString() },
        compareAtPrice: { value: aiParsed.mrp, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
        mrp: { value: aiParsed.mrp, source: InformationSource.AIInference, confidence: 0.9, createdAt: new Date().toISOString() },
        currency: '₹',
        isTaxInclusive: true,
        taxPercentage: 18,
      },
      inventory: {
        stockQuantity: { value: aiParsed.stockQuantity, source: InformationSource.SellerInput, confidence: 1.0, createdAt: new Date().toISOString() },
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
      // Try updating to backend API
      await apiClient.put(`/products/${productId}`, updated).catch(() => null);

      const updatedList = get().products.map(p => 
        p.id === productId ? { ...updated, updatedAt: new Date().toISOString() } : p
      );
      
      set({
        products: updatedList,
        isLoading: false,
      });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  publishProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const product = get().currentProduct || get().products.find(p => p.id === productId);
      
      if (!product) {
        set({ isLoading: false, error: 'Product not found' });
        return false;
      }

      let savedProductId = productId;
      let productToSave = { ...product };

      console.log('📤 Step 1: Trying to update product in backend...');
      
      // Step 1: Try to update existing product, if 404 then create new
      let productExists = false;
      try {
        const updateTest = await apiClient.put(`/products/${productId}`, productToSave);
        if (updateTest.success) {
          console.log('✅ Product already exists, updated');
          productExists = true;
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('📝 Step 2: Product not found (404), creating new draft...');
          productExists = false;
        } else {
          throw err;
        }
      }

      // Step 2: If product doesn't exist, create it
      if (!productExists) {
        const createResp = await apiClient.post('/products');
        if (!createResp.success || !createResp.data) {
          throw new Error('Failed to create draft');
        }
        
        savedProductId = createResp.data.productId || createResp.data.ProductId;
        console.log('✅ Draft created:', savedProductId);
        
        // Update draft with full data
        productToSave = { ...product, id: savedProductId };
        const updateResp = await apiClient.put(`/products/${savedProductId}`, productToSave);
        if (!updateResp.success) {
          throw new Error('Failed to update draft');
        }
        console.log('✅ Draft updated with product data');
      }

      // Step 3: Set status to Ready
      console.log('📝 Step 3: Setting status to Ready...');
      const readyProduct = { ...productToSave, id: savedProductId, status: ProductStatus.Ready };
      const readyResp = await apiClient.put(`/products/${savedProductId}`, readyProduct);
      if (!readyResp.success) {
        throw new Error('Failed to set Ready status');
      }
      console.log('✅ Status set to Ready');

      // Step 4: Publish
      console.log('📤 Step 4: Publishing...');
      const publishResp = await apiClient.post(`/products/${savedProductId}/publish`);
      if (!publishResp.success) {
        throw new Error(publishResp.error?.message || 'Publish failed');
      }

      console.log('🎉 SUCCESS! Product published:', savedProductId);

      const updatedProduct: Product = {
        ...productToSave,
        id: savedProductId,
        status: ProductStatus.Published,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = get().products.filter(p => p.id !== productId && p.id !== savedProductId);
      set({
        products: [updatedProduct, ...updatedList],
        currentProduct: updatedProduct,
        currentFlowStep: 'success',
        isLoading: false,
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Publish error:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication required. Please log in again.'
        : error.message || 'Failed to publish product';
      set({ isLoading: false, error: errorMessage });
      return false;
    }
  },

  deleteProduct: async (productId: string) => {
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
    });
  },
}));
