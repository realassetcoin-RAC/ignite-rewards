// Firebase Authentication Test
// This file tests the Firebase authentication integration

import { FirebaseAuthService } from './firebaseAuthService';

export class FirebaseAuthTest {
  /**
   * Test Firebase authentication initialization
   */
  static async testInitialization(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firebase Auth initialization...');
      
      // Initialize Firebase Auth
      FirebaseAuthService.initialize();
      
      console.log('✅ Firebase Auth initialization test passed');
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth initialization test failed:', error);
      return false;
    }
  }

  /**
   * Test Firebase authentication state listener
   */
  static async testAuthStateListener(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firebase Auth state listener...');
      
      // Set up auth state listener
      const unsubscribe = FirebaseAuthService.onAuthStateChange((user) => {
        console.log('📡 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      });
      
      // Wait a bit for the listener to be set up
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clean up
      unsubscribe();
      
      console.log('✅ Firebase Auth state listener test passed');
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth state listener test failed:', error);
      return false;
    }
  }

  /**
   * Test Firebase authentication methods exist
   */
  static async testAuthMethods(): Promise<boolean> {
    try {
      console.log('🧪 Testing Firebase Auth methods...');
      
      // Check if methods exist
      const methods = [
        'signInWithGoogle',
        'signInWithEmailAndPassword',
        'signUpWithEmailAndPassword',
        'signOut',
        'getCurrentUser',
        'onAuthStateChange'
      ];
      
      for (const method of methods) {
        if (typeof (FirebaseAuthService as any)[method] !== 'function') {
          throw new Error(`Method ${method} not found`);
        }
      }
      
      console.log('✅ Firebase Auth methods test passed');
      return true;
    } catch (error) {
      console.error('❌ Firebase Auth methods test failed:', error);
      return false;
    }
  }

  /**
   * Run all Firebase authentication tests
   */
  static async runAllTests(): Promise<{ passed: number; total: number; results: boolean[] }> {
    console.log('🚀 Starting Firebase Authentication Tests...\n');
    
    const tests = [
      this.testInitialization,
      this.testAuthStateListener,
      this.testAuthMethods
    ];
    
    const results: boolean[] = [];
    
    for (const test of tests) {
      const result = await test();
      results.push(result);
    }
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n📊 Firebase Auth Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All Firebase Auth tests passed!');
    } else {
      console.log('⚠️ Some Firebase Auth tests failed. Check the logs above.');
    }
    
    return { passed, total, results };
  }
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  FirebaseAuthTest.runAllTests().catch(console.error);
}
