/**
 * Smart transaction categorizer
 * Works with UPI descriptions from Indian bank statements
 * Extracts merchant name + UPI handle and matches against rules
 */

// UPI handle patterns → category
const UPI_HANDLE_RULES = [
  // Food & Dining
  { patterns: ['zomato', 'swiggy', 'foodpanda', 'dunzo', 'blinkit.food', 'eatfit', 'freshmenu', 'faasos', 'boxncow', 'rebel.food', 'eatsure'], category: 'Food' },
  // Shopping
  { patterns: ['amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'snapdeal', 'shopsy', 'tatacliq', 'firstcry', 'bigbasket', 'jiomart', 'blinkit', 'zepto', 'instamart', 'grofers', 'dmart', 'reliance'], category: 'Shopping' },
  // Transport
  { patterns: ['uber', 'ola', 'rapido', 'yulu', 'bounce', 'drivezy', 'blowhorn', 'porter', 'metroemo', 'metro', 'irctc', 'redbus', 'abhibus', 'makemytrip.transport'], category: 'Transport' },
  // Entertainment
  { patterns: ['netflix', 'spotify', 'hotstar', 'primevideo', 'sonyliv', 'zee5', 'jiocinema', 'bookmyshow', 'paytminsider', 'youtube', 'gaana', 'jiosaavn', 'hungama', 'mxplayer', 'voot', 'alt.balaji'], category: 'Entertainment' },
  // Health
  { patterns: ['apollo', 'pharmeasy', 'netmeds', 'tata1mg', '1mg', 'medlife', 'docsapp', 'practo', 'lybrate', 'healthians', 'thyrocare', 'portea', 'cult.fit', 'curefit'], category: 'Health' },
  // Utilities
  { patterns: ['airtel', 'jio', 'vodafone', 'bsnl', 'payair', 'vi.pay', 'bescom', 'msedcl', 'bses', 'tpddl', 'cesc', 'adanielectricity', 'tatapower', 'mahadiscom', 'torrentpower', 'paytm.utility', 'billdesk', 'bajajfinserv.emi'], category: 'Utilities' },
  // Investment
  { patterns: ['groww', 'zerodha', 'upstox', 'angelone', 'angelbroking', 'icicidirect', 'hdfcsec', 'kotaksec', 'sbisec', 'motilal', 'nuvama', 'paytmmoney', 'kuvera', 'coin.zerodha', 'mfcentral', 'camsonline', 'nsdl', 'cdsl', 'npscra'], category: 'Investment' },
  // Travel
  { patterns: ['makemytrip', 'goibibo', 'yatra', 'cleartrip', 'ixigo', 'airasia', 'indigo', 'spicejet', 'airindia', 'vistara', 'akasaair', 'oyo', 'treebo', 'fabhotels', 'zostel', 'airbnb'], category: 'Travel' },
  // Education
  { patterns: ['udemy', 'coursera', 'byjus', 'unacademy', 'vedantu', 'whitehatjr', 'toppr', 'extramarks', 'meritnation', 'simplilearn', 'scaler', 'upgrad', 'lpu', 'twc', 'college', 'university', 'school', 'fees'], category: 'Education' },
  // Rent
  { patterns: ['nobroker', 'magicbricks', 'housing.com', 'nestaway', 'stanza', 'colive', 'rent', 'landlord', 'pg.pay', 'commonfloor'], category: 'Rent' },
];

// Merchant name keyword rules (from UPI description name part)
const MERCHANT_NAME_RULES = [
  { keywords: ['zomato', 'swiggy', 'food', 'foods', 'kitchen', 'kitchn', 'cafe', 'restaurant', 'hotel', 'dhaba', 'biryani', 'pizza', 'burger', 'chai', 'chaivyan', 'nk food', 'shiva fo', 'belgian', 'belg', 'juice', 'bakery', 'sweet', 'canteen', 'mess', 'tiffin', 'dabba'], category: 'Food' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'shopping', 'mart', 'store', 'shop', 'market', 'bazar', 'bazaar', 'retail', 'dmart', 'reliance', 'bigbasket', 'grocer', 'grocery', 'kirana', 'vegetables', 'fruits'], category: 'Shopping' },
  { keywords: ['uber', 'ola', 'rapido', 'metro', 'metroemo', 'bus', 'auto', 'taxi', 'cab', 'travel', 'transport', 'petrol', 'fuel', 'pump', 'irctc', 'railway', 'train', 'flight', 'airline', 'redbus', 'porter'], category: 'Transport' },
  { keywords: ['netflix', 'spotify', 'prime', 'hotstar', 'bookmyshow', 'cinema', 'movie', 'theatre', 'gaming', 'game', 'play', 'entertainment', 'music', 'show'], category: 'Entertainment' },
  { keywords: ['apollo', 'pharma', 'pharmacy', 'medical', 'medicine', 'doctor', 'hospital', 'clinic', 'health', 'diagnostic', 'lab', 'test', 'fitness', 'gym', 'cult', 'yoga', 'chemist', 'drug'], category: 'Health' },
  { keywords: ['airtel', 'jio', 'vodafone', 'bsnl', 'electricity', 'electric', 'power', 'bill', 'recharge', 'broadband', 'internet', 'water', 'gas', 'utility', 'bescom', 'msedcl', 'tatapower', 'wifi'], category: 'Utilities' },
  { keywords: ['groww', 'zerodha', 'upstox', 'angel', 'invest', 'sip', 'mutual fund', 'stock', 'share', 'demat', 'nps', 'ppf', 'fd', 'fixed deposit', 'insurance', 'lic', 'hdfc life', 'icici pru'], category: 'Investment' },
  { keywords: ['hotel', 'oyo', 'treebo', 'airbnb', 'flight', 'indigo', 'spicejet', 'makemytrip', 'goibibo', 'yatra', 'cleartrip', 'ixigo', 'resort', 'lodge', 'hostel', 'booking'], category: 'Travel' },
  { keywords: ['lpu', 'university', 'college', 'school', 'udemy', 'coursera', 'byjus', 'unacademy', 'coaching', 'tuition', 'classes', 'education', 'course', 'fees', 'admission', 'twc'], category: 'Education' },
  { keywords: ['rent', 'landlord', 'house rent', 'pg rent', 'room rent', 'flat rent', 'accommodation'], category: 'Rent' },
  { keywords: ['salary', 'stipend', 'income', 'bonus', 'payroll', 'nfsi', 'imps-in', 'neft-in', 'neft_in', 'credit'], category: 'Salary' },
  { keywords: ['atm', 'cash withdrawal', 'wdr', 'withdraw'], category: 'Other' },
];

// Income transaction patterns
const INCOME_PATTERNS = ['imps-in', 'neft_in', 'neft-in', 'salary', 'stipend', 'refund', 'cashback', 'reversal', 'upi/cr'];

/**
 * Parse UPI description and extract useful parts
 * Format: UPI/DR/TXNID/MerchantName/BankCode/UPIHandle
 */
function parseUPIDescription(description) {
  if (!description) return { merchant: '', upiHandle: '', isUPI: false };

  const desc = description.trim();

  // Check if it's a UPI transaction
  const upiMatch = desc.match(/UPI\/(DR|CR)\/\d+\/([^\/]+)\/[^\/]+\/([^\s,\/]+)/i);
  if (upiMatch) {
    return {
      isUPI: true,
      direction: upiMatch[1].toUpperCase(), // DR or CR
      merchant: upiMatch[2].trim().toLowerCase(),
      upiHandle: upiMatch[3].trim().toLowerCase(),
    };
  }

  // IMPS / NEFT
  const impsMatch = desc.match(/IMPS-IN|NEFT_IN|NEFT-IN/i);
  if (impsMatch) {
    return { isUPI: false, merchant: desc.toLowerCase(), upiHandle: '', isIncoming: true };
  }

  return { isUPI: false, merchant: desc.toLowerCase(), upiHandle: '', isIncoming: false };
}

/**
 * Main categorization function
 */
function categorizeTransaction(description, type) {
  if (!description) return 'Other';

  const desc = description.toLowerCase();
  const { merchant, upiHandle, isUPI, isIncoming } = parseUPIDescription(description);

  // Income transactions
  if (type === 'income') {
    if (desc.includes('salary') || desc.includes('stipend') || desc.includes('payroll')) return 'Salary';
    if (desc.includes('groww') || desc.includes('zerodha') || desc.includes('upstox') || desc.includes('mutual') || desc.includes('nps')) return 'Investment';
    if (desc.includes('refund') || desc.includes('cashback') || desc.includes('reversal')) return 'Other';
    return 'Salary'; // Default income = salary
  }

  // Step 1: Match UPI handle (most accurate)
  if (upiHandle) {
    for (const rule of UPI_HANDLE_RULES) {
      if (rule.patterns.some(p => upiHandle.includes(p))) {
        return rule.category;
      }
    }
  }

  // Step 2: Match merchant name from UPI
  if (merchant) {
    for (const rule of MERCHANT_NAME_RULES) {
      if (rule.keywords.some(k => merchant.includes(k))) {
        return rule.category;
      }
    }
  }

  // Step 3: Match full description string
  for (const rule of MERCHANT_NAME_RULES) {
    if (rule.keywords.some(k => desc.includes(k))) {
      return rule.category;
    }
  }

  // Step 4: ATM withdrawal
  if (desc.includes('atm') || desc.includes('wdr') || desc.includes('cash')) return 'Other';

  // Step 5: Default
  return 'Other';
}

module.exports = { categorizeTransaction };