const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar JSON

  type BillingCycle {
    current: Float!
    limit: Float!
    lastReset: String!
  }

  type DepositAddress {
    id: ID!
    userId: ID!
    chain: String!
    address: String!
    memo: String
    balance: Float!
    isActive: Boolean!
    transactions: [Transaction!]!
    lastChecked: String!
    createdAt: String!
    updatedAt: String!
  }

  type Transaction {
    txId: String!
    amount: Float!
    amountUSD: Float!
    fromAddress: String!
    toAddress: String!
    confirmations: Int!
    processed: Boolean!
    fee: Float
    blockNumber: Int
    blockHash: String
    timestamp: String!
    status: String!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    balance: Float!
    currency: String!
    callbackUrl: String
    emailNotifications: Boolean!
    ggrPercentage: Float!
    parentAgent: User
    agentSettings: AgentSettings!
    billingCycle: BillingCycle!
    status: String!
    lastLogin: String
    createdAt: String!
    updatedAt: String!
  }

  type AgentSettings {
    profitShare: Float!
  }

  type ApiKey {
    id: ID!
    name: String!
    key: String!
    status: String!
    lastUsed: String
    createdAt: String!
    updatedAt: String!
  }

  type ApiKeyResponse {
    success: Boolean!
    apiKey: ApiKey
    error: String
  }

  type SlotMachine {
    id: ID!
    machineId: String!
    name: String!
    location: String!
    status: String!
    gameType: String!
    metrics: SlotMetrics!
    createdAt: String!
    updatedAt: String!
  }

  type SlotMetrics {
    totalBets: Int!
    totalWins: Int!
    rtp: Float!
    hitFrequency: Float!
    maxWin: Float!
  }

  type AuthResponse {
    success: Boolean!
    accessToken: String
    user: User
    error: String
  }

  type CreateAgentResponse {
    success: Boolean!
    agent: User
    error: String
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateApiKeyInput {
    name: String!
  }

  input UpdateBalanceInput {
    amount: Float!
  }

  input UpdateBillingLimitInput {
    limit: Float!
  }

  input CreateSlotInput {
    machineId: String!
    name: String!
    location: String!
    gameType: String!
  }

  input UpdateSlotMetricsInput {
    bet: Float!
    win: Float!
  }

  input AgentSettingsInput {
    profitShare: Float!
  }

  input CreateAgentInput {
    username: String!
    email: String!
    password: String!
    currency: String!
    callbackUrl: String
    ggrPercentage: Float!
    agentSettings: AgentSettingsInput!
  }

  input UpdateAgentInput {
    currency: String
    callbackUrl: String
    ggrPercentage: Float
    agentSettings: AgentSettingsInput
    status: String
  }

  enum ActivityType {
    LOGIN
    LOGOUT
    BALANCE_UPDATE
    API_KEY_CREATED
    API_KEY_DELETED
    API_KEY_STATUS_CHANGED
    AGENT_CREATED
    AGENT_UPDATED
    AGENT_STATUS_CHANGED
    DEPOSIT_ADDRESS_CREATED
    DEPOSIT_RECEIVED
    MERCHANT_DEPOSIT_CONFIRMED
  }

  type ActivityLog {
    id: ID!
    userId: ID!
    username: String!
    activityType: ActivityType!
    description: String!
    metadata: JSON
    createdAt: String!
  }

  type Game {
    id: ID!
    provider: String!
    gameId: String!
    name: String!
    type: String
    category: String
    subcategory: String
    provider_name: String
    image: String
    image_square: String
    image_portrait: String
    image_long: String
    mobile: Boolean
    new: Boolean
    id_hash: String
    freerounds_supported: Boolean
    featurebuy_supported: Boolean
    has_jackpot: Boolean
    play_for_fun_supported: Boolean
    currency: String
    status: String
    last_updated: String
    createdAt: String
    updatedAt: String
    demo: Boolean
    exitButton: Boolean
    rewriterule: Boolean
    bm: Boolean
  }

  input GameFilters {
    provider: String
    category: String
    type: String
    search: String
    status: String
    dateFrom: String
    dateTo: String
  }

  type GamesResponse {
    games: [Game!]!
    totalGames: Int!
    totalPages: Int!
  }

  type MerchantDeposit {
    id: ID!
    merchantId: ID!
    merchant: User!
    chain: String!
    amount: Float!
    txId: String!
    fromAddress: String!
    toAddress: String!
    memo: String
    confirmations: Int!
    status: String!
    processedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type MerchantDepositConnection {
    edges: [MerchantDeposit!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  input MerchantDepositFilters {
    chain: String
    status: String
    fromDate: String
    toDate: String
    minAmount: Float
    maxAmount: Float
  }

  type Query {
    me: User
    getApiKeys: [ApiKey!]!
    getBalance: Float!
    getBillingCycle: BillingCycle!
    getSlots: [SlotMachine!]!
    getSlot(id: ID!): SlotMachine
    getSlotStats(id: ID!): SlotMetrics
    getAgents: [User!]!
    getAgent(id: ID!): User
    getSubAgents: [User!]!
    getActivityLogs(limit: Int, offset: Int): [ActivityLog!]!
    games(filters: GameFilters, page: Int, limit: Int): GamesResponse!
    game(id: ID!): Game
    gamesByProvider(provider: String!): [Game!]!
    gameCategories: [String!]!
    getMerchantDeposits(filters: MerchantDepositFilters, first: Int, after: ID): MerchantDepositConnection!
    getMerchantDeposit(id: ID!): MerchantDeposit
    getDepositAddresses(userId: ID!): [DepositAddress!]!
    getDepositAddress(userId: ID!, chain: String!): DepositAddress
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    logout: Boolean!
    createApiKey(input: CreateApiKeyInput!): ApiKeyResponse!
    deleteApiKey(id: ID!): Boolean!
    toggleApiKeyStatus(id: ID!): ApiKey!
    updateBalance(input: UpdateBalanceInput!): Float!
    updateBillingLimit(input: UpdateBillingLimitInput!): BillingCycle!
    createSlot(input: CreateSlotInput!): SlotMachine!
    updateSlotMetrics(id: ID!, input: UpdateSlotMetricsInput!): SlotMetrics!
    createAgent(input: CreateAgentInput!): CreateAgentResponse!
    updateAgent(id: ID!, input: UpdateAgentInput!): CreateAgentResponse!
    suspendAgent(id: ID!): Boolean!
    activateAgent(id: ID!): Boolean!
    updateAgentBalance(agentId: ID!, amount: Float!): Float!
    toggleAgentStatus(agentId: ID!): User!
    createActivityLog(
      activityType: ActivityType!
      description: String!
      metadata: JSON
    ): ActivityLog!
    updateUserCallbackUrl(url: String!): User!
    updateEmailNotifications(enabled: Boolean!): User!
  }
`;

module.exports = typeDefs; 