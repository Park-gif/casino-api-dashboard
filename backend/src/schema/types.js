const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar JSON

  enum SortDirection {
    asc
    desc
  }

  type BillingCycle {
    current: Float!
    limit: Float!
    lastReset: String!
  }

  type DepositAddress {
    id: ID!
    userId: ID!
    currency: String!
    network: String!
    address: String!
    isActive: Boolean!
    transactions: [Transaction!]!
    createdAt: String!
    updatedAt: String
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
    players: [Player!]
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
    currency: String!
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

  type Player {
    id: ID!
    username: String!
    formattedUsername: String!
    currency: String!
    createdAt: String!
    lastLogin: String
    status: String!
    totalBets: Float
    totalWins: Float
  }

  type PlayersResponse {
    players: [Player!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  input PlayerFilters {
    search: String
    status: String
    dateFrom: String
    dateTo: String
    orderBy: String
    orderDirection: SortDirection
  }

  type SlotTransaction {
    id: ID!
    playerId: ID!
    username: String!
    formattedUsername: String!
    operator: String!
    roundId: String!
    gameId: String!
    type: String!
    credit: Float
    debit: Float
    currency: String!
    callId: String!
    sessionId: String!
    gameplayFinal: Boolean!
    status: String!
    metadata: SlotTransactionMetadata!
    createdAt: String!
    updatedAt: String!
  }

  type SlotTransactionMetadata {
    timestamp: String!
    balanceBefore: Float!
    balanceAfter: Float!
  }

  input TransactionFilter {
    username: String
    formattedUsername: String
    gameId: String
    roundId: String
    type: String
    startDate: String
    endDate: String
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
    games(filters: GameFilters, limit: Int, page: Int): GamesResponse!
    game(id: ID!): Game
    gamesByProvider(provider: String!): [Game!]!
    gameCategories: [String!]!
    getMerchantDeposits(filters: MerchantDepositFilters): [MerchantDeposit!]!
    getMerchantDeposit(id: ID!): MerchantDeposit
    getDepositAddresses: [DepositAddress!]!
    getDepositAddress(userId: ID!, chain: String!): DepositAddress
    players(filters: PlayerFilters, first: Int!, after: String): PlayersResponse!
    exchangeRates: ExchangeRates
    slotTransactions(
      filter: TransactionFilter
      page: Int = 1
      limit: Int = 10
    ): SlotTransactionResponse!
  }

  type ExchangeRates {
    EUR: Float
    GBP: Float
    BRL: Float
    TRY: Float
    TND: Float
    AUD: Float
    CAD: Float
    NZD: Float
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
    launchGame(gameId: ID!): LaunchGameResponse!
  }

  type LaunchGameResponse {
    url: String!
    success: Boolean!
    error: String
  }

  type RegisterResponse {
    success: Boolean!
    error: String
    accessToken: String
    user: User
  }

  type SlotTransactionResponse {
    transactions: [SlotTransaction!]!
    totalCount: Int!
    currentPage: Int!
    totalPages: Int!
  }
`;

module.exports = typeDefs; 