/**
 * Guided Task-Oriented AI Product Listing Assistant Engine
 * Normalizes seller Tamil/Tanglish/English voice utterances into structured E-Commerce JSON,
 * tracks persistent draft state, dynamically computes missing fields, and provides 1-tap option chips.
 */

export interface ProductDraftState {
  productName?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  mrp?: number;
  quantity?: number;
  unit?: string;
  color?: string;
  size?: string;
  brand?: string;
  hasBrand?: boolean;
  model?: string;
  material?: string;
  weight?: string;
  packSize?: string;
  ageGroup?: string;
  gender?: string;
  condition?: 'New' | 'Used' | 'Refurbished';
  warranty?: string;
  connectivity?: string;
  countryOfOrigin?: string;
  features?: string[];
  type?: string;
}

export interface AssistantQuestionOption {
  label: string;
  value: string;
  icon?: string;
}

export interface AssistantQuestion {
  fieldKey: keyof ProductDraftState;
  tamilQuestion: string;
  englishQuestion: string;
  options?: AssistantQuestionOption[];
  inputType: 'chips' | 'voice_or_text' | 'number_or_chips';
}

export interface AssistantChatTurn {
  id: string;
  sender: 'ai' | 'seller';
  text: string;
  timestamp: string;
  extractedData?: Partial<ProductDraftState>;
  options?: AssistantQuestionOption[];
}

export interface AssistantEngineResult {
  updatedDraft: ProductDraftState;
  progressPercent: number;
  collectedFields: Array<{ key: string; label: string; value: string }>;
  remainingFields: Array<{ key: string; label: string }>;
  missingRequiredFields: Array<string>;
  recommendedFields: Array<string>;
  nextQuestion: AssistantQuestion | null;
  isComplete: boolean;
  status: 'collecting' | 'ready_for_review' | 'confirmed' | 'published';
}

// Option Chips Registry for 1-Tap Selections
export const PREDEFINED_OPTIONS = {
  category: [
    { label: '⚡ Electronics', value: 'Electronics', icon: '⚡' },
    { label: '👕 Fashion & Clothes', value: 'Fashion', icon: '👕' },
    { label: '🧸 Toys & Games', value: 'Toys', icon: '🧸' },
    { label: '🍳 Kitchen & Home', value: 'Home & Kitchen', icon: '🍳' },
    { label: '🌾 Groceries & Food', value: 'Groceries', icon: '🌾' },
    { label: '💄 Beauty & Personal', value: 'Beauty', icon: '💄' },
    { label: '📦 Other General Item', value: 'General', icon: '📦' },
  ],
  hasBrand: [
    { label: '✨ Has Brand', value: 'ZAH Audio' },
    { label: '❌ No Brand', value: 'Generic' },
    { label: '❓ Unknown Brand', value: 'Verified Seller' },
  ],
  price: [
    { label: '₹199', value: '199' },
    { label: '₹399', value: '399' },
    { label: '₹499', value: '499' },
    { label: '₹799', value: '799' },
    { label: '₹999', value: '999' },
    { label: '₹1499', value: '1499' },
    { label: '₹2499', value: '2499' },
  ],
  quantity: [
    { label: '1 Pc', value: '1' },
    { label: '2 Pcs', value: '2' },
    { label: '5 Pcs', value: '5' },
    { label: '10 Pcs', value: '10' },
    { label: '20 Pcs', value: '20' },
    { label: '50+ Pcs', value: '50' },
  ],
  color: [
    { label: '⬛ Black', value: 'Black' },
    { label: '⚪ White', value: 'White' },
    { label: '🔴 Red', value: 'Red' },
    { label: '🔵 Blue', value: 'Blue' },
    { label: '🟢 Green', value: 'Green' },
    { label: '🟡 Yellow', value: 'Yellow' },
    { label: '🎨 Other / Multi-color', value: 'Multi-Color' },
  ],
  condition: [
    { label: '✨ Brand New', value: 'New', icon: '✨' },
    { label: '🏷️ Used / Pre-owned', value: 'Used', icon: '🏷️' },
    { label: '🛠️ Refurbished', value: 'Refurbished', icon: '🛠️' },
  ],
  gender: [
    { label: '👨 Men', value: 'Men', icon: '👨' },
    { label: '👩 Women', value: 'Women', icon: '👩' },
    { label: '🧒 Kids', value: 'Kids', icon: '🧒' },
    { label: '👫 Unisex', value: 'Unisex', icon: '👫' },
  ],
  ageGroup: [
    { label: '👶 0-2 Years', value: '0-2 Years' },
    { label: '🧒 3-5 Years', value: '3-5 Years' },
    { label: '👦 6-8 Years', value: '6-8 Years' },
    { label: '🧑 9-12 Years', value: '9-12 Years' },
    { label: '👨‍🎓 13+ Years', value: '13+ Years' },
  ],
  size: [
    { label: 'Small (S)', value: 'S' },
    { label: 'Medium (M)', value: 'M' },
    { label: 'Large (L)', value: 'L' },
    { label: 'XL', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
  ],
  connectivity: [
    { label: '📶 Bluetooth / Wireless', value: 'Wireless' },
    { label: '🔌 Wired / Cable', value: 'Wired' },
    { label: '⚡ Both Wireless & Wired', value: 'Dual Mode' },
  ],
  warranty: [
    { label: '🛡️ 1 Year Warranty', value: '1 Year Warranty' },
    { label: '🛡️ 6 Months Warranty', value: '6 Months Warranty' },
    { label: '❌ No Warranty', value: 'No Warranty' },
  ],
};

// Category Specific Question Workflow
const CATEGORY_QUESTION_MAP: Record<string, Array<keyof ProductDraftState>> = {
  Electronics: ['productName', 'category', 'brand', 'price', 'quantity', 'color', 'connectivity', 'warranty'],
  Toys: ['productName', 'category', 'ageGroup', 'color', 'quantity', 'price'],
  Fashion: ['productName', 'category', 'gender', 'size', 'color', 'material', 'quantity', 'price'],
  'Home & Kitchen': ['productName', 'category', 'material', 'warranty', 'quantity', 'price'],
  Groceries: ['productName', 'category', 'brand', 'packSize', 'quantity', 'price'],
  General: ['productName', 'category', 'color', 'quantity', 'price'],
};

const DEFAULT_QUESTION_ORDER: Array<keyof ProductDraftState> = [
  'productName',
  'category',
  'brand',
  'price',
  'quantity',
  'color',
];

export class ProductAssistantEngine {
  /**
   * Multi-Field Utterance Parser (Extracts ALL provided fields in a single sentence)
   */
  public static parseUtterance(
    rawUtterance: string,
    currentDraft: ProductDraftState
  ): Partial<ProductDraftState> {
    if (!rawUtterance || !rawUtterance.trim()) return {};

    const text = rawUtterance.trim();
    const lower = text.toLowerCase();
    const extracted: Partial<ProductDraftState> = {};

    // 1. Skip / Unknown handling ("எனக்கு தெரியாது", "no brand", "don't know")
    if (
      lower.includes('தெரியாது') ||
      lower.includes('தெரியவில்லை') ||
      lower.includes("don't know") ||
      lower.includes('unknown') ||
      lower.includes('skip')
    ) {
      // Return empty extraction to let assistant skip optional fields gracefully
      return {};
    }

    // 2. Extract Category
    if (lower.includes('toy') || lower.includes('பொம்மை') || lower.includes('கார்')) {
      extracted.category = 'Toys';
    } else if (
      lower.includes('shirt') ||
      lower.includes('kurta') ||
      lower.includes('dress') ||
      lower.includes('துணி') ||
      lower.includes('ஆடை') ||
      lower.includes('saree')
    ) {
      extracted.category = 'Fashion';
    } else if (
      lower.includes('phone') ||
      lower.includes('headphone') ||
      lower.includes('earphone') ||
      lower.includes('gadget') ||
      lower.includes('electronic') ||
      lower.includes('இயர்போன்') ||
      lower.includes('ஹெட்போன்')
    ) {
      extracted.category = 'Electronics';
    } else if (
      lower.includes('mixer') ||
      lower.includes('grinder') ||
      lower.includes('kitchen') ||
      lower.includes('மிக்ஸி')
    ) {
      extracted.category = 'Home & Kitchen';
    } else if (lower.includes('grocery') || lower.includes('food') || lower.includes('டீ') || lower.includes('அரிசி')) {
      extracted.category = 'Groceries';
    }

    // 3. Brand Detection
    if (lower.includes('zah') || lower.includes('zebronics') || lower.includes('boat') || lower.includes('sony') || lower.includes('samsung') || lower.includes('butterfly')) {
      if (lower.includes('zah')) extracted.brand = 'ZAH Audio';
      else if (lower.includes('zebronics')) extracted.brand = 'Zebronics';
      else if (lower.includes('boat')) extracted.brand = 'Boat';
      else if (lower.includes('sony')) extracted.brand = 'Sony';
      else if (lower.includes('butterfly')) extracted.brand = 'Butterfly';
      extracted.hasBrand = true;
    } else if (lower.includes('no brand') || lower.includes('brand இல்லை')) {
      extracted.brand = 'Generic';
      extracted.hasBrand = false;
    }

    // 4. Multi-Number Extraction (Price vs Stock vs Age)
    const numbers = (text.match(/\d+/g) || []).map((n) => parseInt(n, 10));

    // Price Rupees Detection
    if (
      lower.includes('rupees') ||
      lower.includes('ரூபாய்') ||
      lower.includes('ரூபீஸ்') ||
      lower.includes('price') ||
      lower.includes('விலை') ||
      lower.includes('rate') ||
      lower.includes('₹')
    ) {
      const priceNum = numbers.find((n) => n >= 50);
      if (priceNum) {
        extracted.price = priceNum;
        extracted.mrp = Math.round(priceNum * 1.35);
      }
    }

    // Stock Quantity Detection
    if (
      lower.includes('piece') ||
      lower.includes('pcs') ||
      lower.includes('பீஸ்') ||
      lower.includes('ஸ்டாக்') ||
      lower.includes('quantity') ||
      lower.includes('count') ||
      lower.includes('எண்ணிக்கை') ||
      lower.includes('irukku') ||
      lower.includes('இருக்கு')
    ) {
      const qtyNum = numbers.find((n) => n >= 1 && n <= 1000);
      if (qtyNum) {
        extracted.quantity = qtyNum;
      }
    }

    // Fallback Unlabeled Numbers Sorting (Higher = Price, Lower = Stock)
    if (!extracted.price && !extracted.quantity && numbers.length > 0) {
      if (numbers.length >= 2) {
        numbers.sort((a, b) => b - a);
        extracted.price = numbers[0];
        extracted.quantity = numbers[1] <= 500 ? numbers[1] : 10;
      } else {
        if (numbers[0] >= 100) {
          extracted.price = numbers[0];
        } else {
          extracted.quantity = numbers[0];
        }
      }
    }

    // 5. Color Detection
    if (lower.includes('red') || lower.includes('சிவப்பு')) extracted.color = 'Red';
    else if (lower.includes('blue') || lower.includes('நீலம்')) extracted.color = 'Blue';
    else if (lower.includes('black') || lower.includes('கருப்பு')) extracted.color = 'Black';
    else if (lower.includes('white') || lower.includes('வெள்ளை')) extracted.color = 'White';
    else if (lower.includes('green') || lower.includes('பச்சை')) extracted.color = 'Green';
    else if (lower.includes('yellow') || lower.includes('மஞ்சள்')) extracted.color = 'Yellow';

    // 6. Connectivity
    if (lower.includes('bluetooth') || lower.includes('wireless') || lower.includes('வயர்லெஸ்')) {
      extracted.connectivity = 'Wireless';
    } else if (lower.includes('wired') || lower.includes('கேபிள்')) {
      extracted.connectivity = 'Wired';
    }

    // 7. Product Title Extraction
    if (!currentDraft.productName && !extracted.productName) {
      if (
        lower.includes('car') ||
        lower.includes('toy') ||
        lower.includes('headphone') ||
        lower.includes('earphone') ||
        lower.includes('mixer') ||
        lower.includes('shirt') ||
        lower.includes('kurta') ||
        text.length >= 4
      ) {
        let titleClean = text
          .replace(/இருக்கு|உள்ளது|விலை|ரூபாய்|பத்து|pieces|price|quantity|rate|color|black|red|blue/gi, '')
          .trim();
        if (titleClean.length >= 3) {
          extracted.productName = titleClean.charAt(0).toUpperCase() + titleClean.slice(1);
        }
      }
    }

    // 8. Size & Age Group
    if (lower.includes('0-2') || lower.includes('baby')) extracted.ageGroup = '0-2 Years';
    else if (lower.includes('3-5')) extracted.ageGroup = '3-5 Years';
    else if (lower.includes('6-8') || lower.includes('kids')) extracted.ageGroup = '6-8 Years';

    if (lower.includes('small') || lower.includes('size s')) extracted.size = 'S';
    else if (lower.includes('medium') || lower.includes('size m')) extracted.size = 'M';
    else if (lower.includes('large') || lower.includes('size l')) extracted.size = 'L';
    else if (lower.includes('xl')) extracted.size = 'XL';

    // 9. Warranty
    if (lower.includes('1 year') || lower.includes('1 வருஷம்')) extracted.warranty = '1 Year Warranty';
    else if (lower.includes('6 month') || lower.includes('6 மாதம்')) extracted.warranty = '6 Months Warranty';

    return extracted;
  }

  /**
   * Evaluate Completion Progress, Missing Required Fields & Next Question
   */
  public static evaluateAssistantState(draft: ProductDraftState): AssistantEngineResult {
    const category = draft.category || 'General';
    const requiredKeys = CATEGORY_QUESTION_MAP[category] || DEFAULT_QUESTION_ORDER;

    const collectedFields: Array<{ key: string; label: string; value: string }> = [];
    const remainingFields: Array<{ key: string; label: string }> = [];

    const fieldLabels: Record<keyof ProductDraftState, string> = {
      productName: 'Product Name',
      category: 'Category',
      subCategory: 'Sub-Category',
      price: 'Price',
      mrp: 'MRP',
      quantity: 'Quantity',
      unit: 'Unit',
      color: 'Color',
      size: 'Size',
      brand: 'Brand',
      hasBrand: 'Has Brand',
      model: 'Model',
      material: 'Material',
      weight: 'Weight',
      packSize: 'Pack Size',
      ageGroup: 'Age Group',
      gender: 'Gender',
      condition: 'Condition',
      warranty: 'Warranty',
      connectivity: 'Connectivity',
      countryOfOrigin: 'Origin',
      features: 'Features',
      type: 'Type',
    };

    requiredKeys.forEach((key) => {
      const val = draft[key];
      if (val !== undefined && val !== null && val !== '') {
        collectedFields.push({
          key,
          label: fieldLabels[key] || key,
          value: Array.isArray(val) ? val.join(', ') : val.toString(),
        });
      } else {
        remainingFields.push({
          key,
          label: fieldLabels[key] || key,
        });
      }
    });

    const missingRequiredFields = remainingFields.map((f) => f.key);
    const recommendedFields = ['warranty', 'material', 'condition'];

    const progressPercent = Math.round((collectedFields.length / requiredKeys.length) * 100);
    const firstMissingKey = requiredKeys.find((k) => draft[k] === undefined || draft[k] === null || draft[k] === '');
    const isComplete = !firstMissingKey;

    let nextQuestion: AssistantQuestion | null = null;
    if (firstMissingKey) {
      nextQuestion = this.getQuestionForField(firstMissingKey, category);
    }

    const status = isComplete ? 'ready_for_review' : 'collecting';

    return {
      updatedDraft: draft,
      progressPercent,
      collectedFields,
      remainingFields,
      missingRequiredFields,
      recommendedFields,
      nextQuestion,
      isComplete,
      status,
    };
  }

  /**
   * Human-Like Question Engine (Tamil + Tanglish + 1-Tap Options)
   */
  private static getQuestionForField(fieldKey: keyof ProductDraftState, category: string): AssistantQuestion {
    switch (fieldKey) {
      case 'productName':
        return {
          fieldKey: 'productName',
          tamilQuestion: 'இந்த பொருட்க்கு என்ன பெயர் வைக்கலாம்? (Product Name)',
          englishQuestion: 'What is the name of this product?',
          inputType: 'voice_or_text',
        };
      case 'category':
        return {
          fieldKey: 'category',
          tamilQuestion: 'இந்த பொருள் எந்த வகையைச் சேர்ந்தது? (Product Category)',
          englishQuestion: 'Select product category:',
          options: PREDEFINED_OPTIONS.category,
          inputType: 'chips',
        };
      case 'brand':
        return {
          fieldKey: 'brand',
          tamilQuestion: 'இந்த product-க்கு Brand Name இருக்கா? (Brand)',
          englishQuestion: 'Does this product have a brand name?',
          options: PREDEFINED_OPTIONS.hasBrand,
          inputType: 'chips',
        };
      case 'price':
        return {
          fieldKey: 'price',
          tamilQuestion: 'ஒரு பொருளின் விற்பனை விலை எவ்வளவு? (Selling Price in ₹)',
          englishQuestion: 'What is the selling price in ₹ Rupees?',
          options: PREDEFINED_OPTIONS.price,
          inputType: 'number_or_chips',
        };
      case 'quantity':
        return {
          fieldKey: 'quantity',
          tamilQuestion: 'விற்பனைக்கு எத்தனை எண்ணிக்கையில் உள்ளது? (Stock Quantity)',
          englishQuestion: 'How many pieces are available in stock?',
          options: PREDEFINED_OPTIONS.quantity,
          inputType: 'number_or_chips',
        };
      case 'color':
        return {
          fieldKey: 'color',
          tamilQuestion: 'இந்த பொருள் என்ன நிறம்? (Product Color)',
          englishQuestion: 'What is the color of the product?',
          options: PREDEFINED_OPTIONS.color,
          inputType: 'chips',
        };
      case 'connectivity':
        return {
          fieldKey: 'connectivity',
          tamilQuestion: 'இந்த headphone எந்த வகை இணைப்பு? (Connectivity)',
          englishQuestion: 'Is this Bluetooth wireless or wired?',
          options: PREDEFINED_OPTIONS.connectivity,
          inputType: 'chips',
        };
      case 'warranty':
        return {
          fieldKey: 'warranty',
          tamilQuestion: 'இந்த product-க்கு warranty இருக்கா? (Warranty)',
          englishQuestion: 'Does this product have a warranty?',
          options: PREDEFINED_OPTIONS.warranty,
          inputType: 'chips',
        };
      case 'ageGroup':
        return {
          fieldKey: 'ageGroup',
          tamilQuestion: 'இந்த பொம்மை எந்த வயது குழந்தைகளுக்கு ஏற்றது? (Target Age)',
          englishQuestion: 'Which age group is this toy suitable for?',
          options: PREDEFINED_OPTIONS.ageGroup,
          inputType: 'chips',
        };
      case 'gender':
        return {
          fieldKey: 'gender',
          tamilQuestion: 'யாருக்கான ஆடை இது? (Gender)',
          englishQuestion: 'Who is this apparel designed for?',
          options: PREDEFINED_OPTIONS.gender,
          inputType: 'chips',
        };
      case 'size':
        return {
          fieldKey: 'size',
          tamilQuestion: 'இதன் அளவு (Size) என்ன?',
          englishQuestion: 'What is the size?',
          options: PREDEFINED_OPTIONS.size,
          inputType: 'chips',
        };
      default:
        return {
          fieldKey: 'productName',
          tamilQuestion: 'கூடுதல் விவரங்களை கூறவும் (Product Details)',
          englishQuestion: 'Tell me more about the product',
          inputType: 'voice_or_text',
        };
    }
  }
}

