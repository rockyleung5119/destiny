// 简化的数据库模拟，用于演示
// 在生产环境中应该使用真实的 Prisma 客户端

interface MockUser {
  id: string;
  email: string;
  name: string;
  subscriptionType: string;
  createdAt: Date;
}

interface MockAnalysis {
  id: string;
  userId: string;
  analysisType: string;
  overallScore: number;
  createdAt: Date;
}

// 内存中的模拟数据存储
const mockData = {
  users: new Map<string, MockUser>(),
  analyses: new Map<string, MockAnalysis>(),
};

// 模拟 Prisma 客户端
const mockPrisma = {
  user: {
    findUnique: async ({ where }: any) => {
      return mockData.users.get(where.id) || null;
    },
    create: async ({ data }: any) => {
      const user = { ...data, id: Math.random().toString(36), createdAt: new Date() };
      mockData.users.set(user.id, user);
      return user;
    },
    update: async ({ where, data }: any) => {
      const user = mockData.users.get(where.id);
      if (user) {
        Object.assign(user, data);
        return user;
      }
      return null;
    }
  },
  analysis: {
    create: async ({ data }: any) => {
      const analysis = { ...data, id: Math.random().toString(36), createdAt: new Date() };
      mockData.analyses.set(analysis.id, analysis);
      return analysis;
    },
    findFirst: async ({ where }: any) => {
      for (const analysis of mockData.analyses.values()) {
        if (analysis.id === where.id && analysis.userId === where.userId) {
          return analysis;
        }
      }
      return null;
    }
  },
  $queryRaw: async () => [{ test: 1 }],
  $disconnect: async () => {}
};

export default mockPrisma as any;
