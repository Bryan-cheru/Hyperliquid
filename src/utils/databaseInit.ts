// Database Initialization Script for HyperLiquid Trading Platform
import { databaseService } from '../services/databaseService';
import { tradingDataService } from '../services/tradingDataService';
import { enhancedMarketDataService } from '../services/enhancedMarketDataService';

export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🚀 Initializing MongoDB connection for HyperLiquid Trading Platform...');
    
    // Connect to MongoDB
    await databaseService.connect();
    
    if (!databaseService.isConnectionActive()) {
      throw new Error('Failed to establish database connection');
    }

    console.log('✅ Database connection established successfully');

    // Perform initial setup tasks
    await performInitialSetup();

    console.log('✅ Database initialization completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

async function performInitialSetup(): Promise<void> {
  try {
    // Create default admin user if needed
    const defaultUserId = 'system_admin';
    const existingUser = await tradingDataService.getUserById(defaultUserId);
    
    if (!existingUser) {
      await tradingDataService.createUser({
        userId: defaultUserId,
        email: 'admin@hyperliquid.local',
        username: 'system_admin',
        passwordHash: 'temp_hash_replace_in_production',
        preferences: {
          defaultLeverage: 10,
          riskLevel: 'medium',
          autoSave: true,
          notifications: true
        }
      });
      console.log('✅ Created default system admin user');
    }

    // Start data cleanup scheduler (runs every 24 hours)
    setInterval(async () => {
      try {
        const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '90');
        await tradingDataService.cleanupOldData(retentionDays);
        console.log('✅ Automated data cleanup completed');
      } catch (error) {
        console.error('❌ Automated data cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('✅ Initial setup tasks completed');

  } catch (error) {
    console.error('❌ Initial setup failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await databaseService.disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

// Enhanced user management functions
export async function createUserAccount(userData: {
  userId: string;
  email: string;
  username: string;
  password: string;
}): Promise<boolean> {
  try {
    // Hash password (in production, use bcrypt)
    const passwordHash = Buffer.from(userData.password).toString('base64');
    
    await tradingDataService.createUser({
      userId: userData.userId,
      email: userData.email,
      username: userData.username,
      passwordHash,
      preferences: {
        defaultLeverage: 10,
        riskLevel: 'medium',
        autoSave: true,
        notifications: true
      }
    });

    // Set user ID for enhanced market data service
    enhancedMarketDataService.setUserId(userData.userId);

    console.log(`✅ Created user account: ${userData.username}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to create user account:', error);
    return false;
  }
}

export async function loginUser(userId: string): Promise<boolean> {
  try {
    const user = await tradingDataService.getUserById(userId);
    
    if (!user) {
      console.error('❌ User not found:', userId);
      return false;
    }

    // Update last login
    await tradingDataService.updateUserPreferences(userId, {
      defaultLeverage: user.preferences.defaultLeverage,
      riskLevel: user.preferences.riskLevel,
      autoSave: user.preferences.autoSave,
      notifications: user.preferences.notifications
    });

    // Set user ID for enhanced market data service
    enhancedMarketDataService.setUserId(userId);

    console.log(`✅ User logged in: ${user.username}`);
    return true;

  } catch (error) {
    console.error('❌ Login failed:', error);
    return false;
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: any;
}> {
  try {
    const connectionState = databaseService.getConnectionState();
    const isActive = databaseService.isConnectionActive();

    if (!isActive) {
      return {
        status: 'unhealthy',
        details: {
          connectionState,
          isActive,
          error: 'Database connection not active'
        }
      };
    }

    // Try a simple query to test database responsiveness
    const testUser = await tradingDataService.getUserById('system_admin');
    
    return {
      status: 'healthy',
      details: {
        connectionState,
        isActive,
        testQuery: testUser ? 'success' : 'no_admin_user',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connectionState: databaseService.getConnectionState(),
        isActive: databaseService.isConnectionActive(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
