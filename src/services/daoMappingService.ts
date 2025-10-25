/**
 * DAO Mapping Service
 * Maps proposal types and categories to the appropriate DAO organizations
 * Updated to use 5 main DAO organizations with batch categorization
 */

export interface DAOOrganization {
  id: string;
  name: string;
  description: string;
  governance_token_symbol: string;
  min_proposal_threshold: number;
  voting_period_days: number;
  execution_delay_hours: number;
  quorum_percentage: number;
  super_majority_threshold: number;
  is_active: boolean;
}

export interface ProposalMapping {
  category: string;
  daoName: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  batch?: string; // New field for batch categorization
}

/**
 * Maps proposal categories to their appropriate DAO organizations
 * Updated to use 5 main DAO organizations with batch categorization
 */
export const PROPOSAL_DAO_MAPPING: Record<string, ProposalMapping> = {
  // Platform Governance DAO - Core platform decisions and infrastructure
  'governance': {
    category: 'governance',
    daoName: 'Platform Governance DAO',
    description: '🏛️ Core Platform - Platform-wide decisions and system architecture',
    priority: 'high',
    batch: 'Core Platform'
  },
  'technical': {
    category: 'technical',
    daoName: 'Platform Governance DAO',
    description: '⚙️ Technical Infrastructure - Development, APIs, integrations',
    priority: 'high',
    batch: 'Technical Infrastructure'
  },
  'security': {
    category: 'security',
    daoName: 'Platform Governance DAO',
    description: '🔒 Security & Compliance - Security protocols, audits, compliance',
    priority: 'high',
    batch: 'Security & Compliance'
  },
  'blockchain': {
    category: 'blockchain',
    daoName: 'Platform Governance DAO',
    description: '⛓️ Blockchain Integration - Web3 features, smart contracts, protocols',
    priority: 'high',
    batch: 'Blockchain Integration'
  },
  'infrastructure': {
    category: 'infrastructure',
    daoName: 'Platform Governance DAO',
    description: '⚙️ Technical Infrastructure - Server infrastructure and DevOps',
    priority: 'medium',
    batch: 'Technical Infrastructure'
  },
  'api': {
    category: 'api',
    daoName: 'Platform Governance DAO',
    description: '⚙️ Technical Infrastructure - API development and integrations',
    priority: 'medium',
    batch: 'Technical Infrastructure'
  },
  'privacy': {
    category: 'privacy',
    daoName: 'Platform Governance DAO',
    description: '🔒 Security & Compliance - Data privacy and GDPR compliance',
    priority: 'high',
    batch: 'Security & Compliance'
  },
  'legal': {
    category: 'legal',
    daoName: 'Platform Governance DAO',
    description: '🔒 Security & Compliance - Legal compliance and regulatory requirements',
    priority: 'high',
    batch: 'Security & Compliance'
  },

  // Financial & Treasury DAO - All financial and economic decisions
  'treasury': {
    category: 'treasury',
    daoName: 'Financial & Treasury DAO',
    description: '💰 Treasury Management - Fund allocation, budget decisions',
    priority: 'high',
    batch: 'Treasury Management'
  },
  'investment': {
    category: 'investment',
    daoName: 'Financial & Treasury DAO',
    description: '📈 Investment Policies - Marketplace rules, investment criteria',
    priority: 'high',
    batch: 'Investment Policies'
  },
  'economics': {
    category: 'economics',
    daoName: 'Financial & Treasury DAO',
    description: '🪙 Token Economics - RAC token policies, staking rewards',
    priority: 'high',
    batch: 'Token Economics'
  },
  'defi': {
    category: 'defi',
    daoName: 'Financial & Treasury DAO',
    description: '📈 Investment Policies - DeFi integrations and protocols',
    priority: 'high',
    batch: 'Investment Policies'
  },
  'asset': {
    category: 'asset',
    daoName: 'Financial & Treasury DAO',
    description: '💰 Treasury Management - Asset initiatives and impact projects',
    priority: 'medium',
    batch: 'Treasury Management'
  },

  // Community & Ecosystem DAO - User engagement and ecosystem growth
  'community': {
    category: 'community',
    daoName: 'Community & Ecosystem DAO',
    description: '👥 Community Engagement - User programs, community events',
    priority: 'medium',
    batch: 'Community Engagement'
  },
  'marketing': {
    category: 'marketing',
    daoName: 'Community & Ecosystem DAO',
    description: '📢 Marketing & Growth - Brand initiatives, user acquisition',
    priority: 'medium',
    batch: 'Marketing & Growth'
  },
  'partnership': {
    category: 'partnership',
    daoName: 'Community & Ecosystem DAO',
    description: '🤝 Partnerships - Strategic alliances, integrations',
    priority: 'high',
    batch: 'Partnerships'
  },
  'ecosystem': {
    category: 'ecosystem',
    daoName: 'Community & Ecosystem DAO',
    description: '🌱 Ecosystem Growth - Platform expansion and growth',
    priority: 'high',
    batch: 'Ecosystem Growth'
  },
  'environment': {
    category: 'environment',
    daoName: 'Community & Ecosystem DAO',
    description: '🌍 Social Impact - Environmental impact initiatives',
    priority: 'medium',
    batch: 'Social Impact'
  },
  'social': {
    category: 'social',
    daoName: 'Community & Ecosystem DAO',
    description: '🤝 Social Impact - Social impact projects',
    priority: 'medium',
    batch: 'Social Impact'
  },
  'education': {
    category: 'education',
    daoName: 'Community & Ecosystem DAO',
    description: '👥 Community Engagement - User education and documentation',
    priority: 'low',
    batch: 'Community Engagement'
  },
  'support': {
    category: 'support',
    daoName: 'Community & Ecosystem DAO',
    description: '👥 Community Engagement - Customer support policies',
    priority: 'low',
    batch: 'Community Engagement'
  },
  'ux': {
    category: 'ux',
    daoName: 'Community & Ecosystem DAO',
    description: '👥 Community Engagement - User interface and experience improvements',
    priority: 'medium',
    batch: 'Community Engagement'
  },

  // Business & Merchant DAO - Merchant relations and business operations
  'merchant': {
    category: 'merchant',
    daoName: 'Business & Merchant DAO',
    description: '🏪 Merchant Relations - Onboarding, support, policies',
    priority: 'medium',
    batch: 'Merchant Relations'
  },
  'nft': {
    category: 'nft',
    daoName: 'Business & Merchant DAO',
    description: '🎨 NFT Collections - NFT policies, collection management',
    priority: 'medium',
    batch: 'NFT Collections'
  },
  'rewards': {
    category: 'rewards',
    daoName: 'Business & Merchant DAO',
    description: '🎁 Loyalty Programs - Rewards systems, referral programs',
    priority: 'medium',
    batch: 'Loyalty Programs'
  },
  'business': {
    category: 'business',
    daoName: 'Business & Merchant DAO',
    description: '🏪 Merchant Relations - Business development and strategy',
    priority: 'high',
    batch: 'Merchant Relations'
  },

  // Innovation & Development DAO - New features and technological advancement
  'research': {
    category: 'research',
    daoName: 'Innovation & Development DAO',
    description: '🔬 Research & Development - Innovation projects, pilot programs',
    priority: 'medium',
    batch: 'Research & Development'
  },
  'governance_innovation': {
    category: 'governance_innovation',
    daoName: 'Innovation & Development DAO',
    description: '🚀 Product Development - Governance innovation and voting mechanisms',
    priority: 'medium',
    batch: 'Product Development'
  },

  // General (mapped to Platform Governance DAO)
  'general': {
    category: 'general',
    daoName: 'Platform Governance DAO',
    description: '🏛️ Core Platform - General platform decisions',
    priority: 'high',
    batch: 'Core Platform'
  }
};

/**
 * Gets the appropriate DAO organization for a given proposal category
 */
export function getDAOForCategory(category: string): ProposalMapping | null {
  return PROPOSAL_DAO_MAPPING[category.toLowerCase()] || PROPOSAL_DAO_MAPPING['general'];
}

/**
 * Gets all available proposal categories
 */
export function getAvailableCategories(): Array<{ value: string; label: string; daoName: string; batch?: string }> {
  return Object.entries(PROPOSAL_DAO_MAPPING).map(([key, mapping]) => ({
    value: key,
    label: mapping.description,
    daoName: mapping.daoName,
    batch: mapping.batch
  }));
}

/**
 * Gets categories grouped by DAO organization
 */
export function getCategoriesByDAO(): Record<string, Array<{ value: string; label: string; batch?: string }>> {
  const categories = getAvailableCategories();
  const grouped: Record<string, Array<{ value: string; label: string; batch?: string }>> = {};

  categories.forEach(category => {
    const daoName = category.daoName;
    if (!grouped[daoName]) {
      grouped[daoName] = [];
    }
    grouped[daoName].push({
      value: category.value,
      label: category.label,
      batch: category.batch
    });
  });

  return grouped;
}

/**
 * Gets categories grouped by priority
 */
export function getCategoriesByPriority(): Record<string, Array<{ value: string; label: string; daoName: string; batch?: string }>> {
  const categories = getAvailableCategories();
  const grouped: Record<string, Array<{ value: string; label: string; daoName: string; batch?: string }>> = {
    high: [],
    medium: [],
    low: []
  };

  categories.forEach(category => {
    const mapping = PROPOSAL_DAO_MAPPING[category.value];
    if (mapping) {
      grouped[mapping.priority].push(category);
    }
  });

  return grouped;
}

/**
 * Determines the appropriate voting type based on category priority
 */
export function getVotingTypeForCategory(category: string): 'simple_majority' | 'super_majority' | 'unanimous' {
  const mapping = getDAOForCategory(category);
  if (!mapping) return 'simple_majority';

  switch (mapping.priority) {
    case 'high':
      return 'super_majority';
    case 'medium':
      return 'simple_majority';
    case 'low':
      return 'simple_majority';
    default:
      return 'simple_majority';
  }
}

/**
 * Gets the appropriate DAO organization ID from a list of organizations
 */
export function getDAOIdForCategory(category: string, organizations: DAOOrganization[]): string | null {
  const mapping = getDAOForCategory(category);
  if (!mapping) return null;

  const org = organizations.find(org => org.name === mapping.daoName);
  return org?.id || null;
}

/**
 * Gets the 5 main DAO organizations
 */
export function getMainDAOOrganizations(): Array<{ name: string; description: string; icon: string }> {
  return [
    {
      name: 'Platform Governance DAO',
      description: 'Core platform decisions and infrastructure',
      icon: '🏛️'
    },
    {
      name: 'Financial & Treasury DAO',
      description: 'All financial and economic decisions',
      icon: '💰'
    },
    {
      name: 'Community & Ecosystem DAO',
      description: 'User engagement and ecosystem growth',
      icon: '👥'
    },
    {
      name: 'Business & Merchant DAO',
      description: 'Merchant relations and business operations',
      icon: '🏪'
    },
    {
      name: 'Innovation & Development DAO',
      description: 'New features and technological advancement',
      icon: '🚀'
    }
  ];
}

/**
 * Gets categories grouped by batch within each DAO
 */
export function getCategoriesByBatch(): Record<string, Record<string, Array<{ value: string; label: string }>>> {
  const categories = getAvailableCategories();
  const grouped: Record<string, Record<string, Array<{ value: string; label: string }>>> = {};

  categories.forEach(category => {
    const daoName = category.daoName;
    const batch = category.batch || 'General';
    
    if (!grouped[daoName]) {
      grouped[daoName] = {};
    }
    if (!grouped[daoName][batch]) {
      grouped[daoName][batch] = [];
    }
    
    grouped[daoName][batch].push({
      value: category.value,
      label: category.label
    });
  });

  return grouped;
}
