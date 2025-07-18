// Shared storage solution for Vercel serverless functions
// Uses a simple in-memory approach with process.env as fallback

class SharedStorage {
  constructor() {
    // Try to use a more persistent storage approach
    if (typeof global !== 'undefined' && !global.vercelSessions) {
      global.vercelSessions = new Map();
    }
    
    // Fallback to environment variable storage (not ideal but works)
    if (!process.env.VERCEL_SESSIONS) {
      process.env.VERCEL_SESSIONS = JSON.stringify({});
    }
  }

  set(key, value) {
    try {
      // Try global storage first
      if (typeof global !== 'undefined' && global.vercelSessions) {
        global.vercelSessions.set(key, value);
      }
      
      // Also store in process.env as backup
      const sessions = JSON.parse(process.env.VERCEL_SESSIONS || '{}');
      sessions[key] = value;
      process.env.VERCEL_SESSIONS = JSON.stringify(sessions);
      
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  get(key) {
    try {
      // Try global storage first
      if (typeof global !== 'undefined' && global.vercelSessions && global.vercelSessions.has(key)) {
        return global.vercelSessions.get(key);
      }
      
      // Fallback to process.env
      const sessions = JSON.parse(process.env.VERCEL_SESSIONS || '{}');
      return sessions[key] || null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  has(key) {
    try {
      // Try global storage first
      if (typeof global !== 'undefined' && global.vercelSessions && global.vercelSessions.has(key)) {
        return true;
      }
      
      // Fallback to process.env
      const sessions = JSON.parse(process.env.VERCEL_SESSIONS || '{}');
      return key in sessions;
    } catch (error) {
      console.error('Storage has error:', error);
      return false;
    }
  }

  delete(key) {
    try {
      // Try global storage first
      if (typeof global !== 'undefined' && global.vercelSessions) {
        global.vercelSessions.delete(key);
      }
      
      // Also remove from process.env
      const sessions = JSON.parse(process.env.VERCEL_SESSIONS || '{}');
      delete sessions[key];
      process.env.VERCEL_SESSIONS = JSON.stringify(sessions);
      
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }

  // Get all sessions for debugging
  getAll() {
    try {
      const sessions = JSON.parse(process.env.VERCEL_SESSIONS || '{}');
      return sessions;
    } catch (error) {
      console.error('Storage getAll error:', error);
      return {};
    }
  }
}

// Export singleton instance
const storage = new SharedStorage();
export default storage;