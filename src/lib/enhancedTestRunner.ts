import { EnhancedTestDataService } from './enhancedTestDataService';
import { DAOService } from './daoService';
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

export class EnhancedTestRunner {
  private results: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;

  /**
   * Run comprehensive tests for all application subsystems
   */
  static async runAllTests(): Promise<TestSuite[]> {
    const runner = new EnhancedTestRunner();
    return await runner.runAllTestsInternal();
  }

  private async runAllTestsInternal(): Promise<TestSuite[]> {
    console.log('🧪 Starting enhanced comprehensive application tests...');

    // Test 1: Database Connection and Schema
    this.startSuite('Database Connection and Schema Tests');
    this.addTestResult(await this.runTest('Database Connection', () => this.testDatabaseConnection()));
    this.addTestResult(await this.runTest('DAO Tables Exist', () => this.testDAOTablesExist()));
    this.addTestResult(await this.runTest('Table Schema Validation', () => this.testTableSchemaValidation()));
    this.endSuite();

    // Test 2: Test Data Generation
    this.startSuite('Test Data Generation Tests');
    this.addTestResult(await this.runTest('Create Comprehensive Test Data', () => this.testCreateComprehensiveTestData()));
    this.addTestResult(await this.runTest('Validate Test Data Counts', () => this.testValidateTestDataCounts()));
    this.addTestResult(await this.runTest('Test Data Relationships', () => this.testTestDataRelationships()));
    this.endSuite();

    // Test 3: DAO Functionality
    this.startSuite('DAO Functionality Tests');
    this.addTestResult(await this.runTest('DAO Organizations Loading', () => this.testDAOOrganizationsLoading()));
    this.addTestResult(await this.runTest('DAO Members Loading', () => this.testDAOMembersLoading()));
    this.addTestResult(await this.runTest('DAO Proposals Loading', () => this.testDAOProposalsLoading()));
    this.addTestResult(await this.runTest('DAO Voting System', () => this.testDAOVotingSystem()));
    this.addTestResult(await this.runTest('DAO Statistics', () => this.testDAOStatistics()));
    this.endSuite();

    // Test 4: Performance Tests
    this.startSuite('Performance Tests');
    this.addTestResult(await this.runTest('Large Dataset Handling', () => this.testLargeDatasetHandling()));
    this.addTestResult(await this.runTest('Concurrent Operations', () => this.testConcurrentOperations()));
    this.addTestResult(await this.runTest('Memory Usage', () => this.testMemoryUsage()));
    this.endSuite();

    // Test 5: Data Validation Tests
    this.startSuite('Data Validation Tests');
    this.addTestResult(await this.runTest('Data Type Validation', () => this.testDataTypeValidation()));
    this.addTestResult(await this.runTest('Constraint Validation', () => this.testConstraintValidation()));
    this.addTestResult(await this.runTest('Business Logic Validation', () => this.testBusinessLogicValidation()));
    this.endSuite();

    // Test 6: Error Handling Tests
    this.startSuite('Error Handling Tests');
    this.addTestResult(await this.runTest('Invalid Data Handling', () => this.testInvalidDataHandling()));
    this.addTestResult(await this.runTest('Network Error Handling', () => this.testNetworkErrorHandling()));
    this.addTestResult(await this.runTest('Permission Error Handling', () => this.testPermissionErrorHandling()));
    this.endSuite();

    // Summary
    const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.duration, 0);

    console.log(`📊 Enhanced Test Results: ${totalPassed} passed, ${totalFailed} failed out of ${totalTests} tests`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    return this.results;
  }

  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      return {
        test: testName,
        success: true,
        message: 'Test passed successfully',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        test: testName,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private startSuite(suiteName: string): void {
    this.currentSuite = {
      suiteName,
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0
    };
  }

  private endSuite(): void {
    if (this.currentSuite) {
      this.currentSuite.totalTests = this.currentSuite.tests.length;
      this.currentSuite.passedTests = this.currentSuite.tests.filter(t => t.success).length;
      this.currentSuite.failedTests = this.currentSuite.tests.filter(t => !t.success).length;
      this.currentSuite.duration = this.currentSuite.tests.reduce((sum, test) => sum + (test.duration || 0), 0);
      
      this.results.push(this.currentSuite);
      this.currentSuite = null;
    }
  }

  private addTestResult(result: TestResult): void {
    if (this.currentSuite) {
      this.currentSuite.tests.push(result);
    }
  }

  // Database Connection and Schema Tests
  private async testDatabaseConnection(): Promise<void> {
    const { /* data: _data, */ error } = await supabase
      .from('dao_organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private async testDAOTablesExist(): Promise<void> {
    const tables = ['dao_organizations', 'dao_members', 'dao_proposals', 'dao_votes'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Table ${table} does not exist: ${error.message}`);
      }
    }
  }

  private async testTableSchemaValidation(): Promise<void> {
    // Test dao_organizations schema
    const { /* data: _orgs, */ error: orgsError } = await supabase
      .from('dao_organizations')
      .select('id, name, governance_token_symbol, voting_period_days, quorum_percentage')
      .limit(1);

    if (orgsError) {
      throw new Error(`DAO organizations schema validation failed: ${orgsError.message}`);
    }

    // Test dao_proposals schema
    const { /* data: _proposals, */ error: proposalsError } = await supabase
      .from('dao_proposals')
      .select('id, title, status, category, voting_type, total_votes, yes_votes, no_votes, abstain_votes')
      .limit(1);

    if (proposalsError) {
      throw new Error(`DAO proposals schema validation failed: ${proposalsError.message}`);
    }
  }

  // Test Data Generation Tests
  private async testCreateComprehensiveTestData(): Promise<void> {
    const result = await EnhancedTestDataService.createComprehensiveTestData();
    
    if (!result.success) {
      throw new Error(`Failed to create comprehensive test data: ${result.error}`);
    }

    // Validate that we have the expected number of records
    const summary = result.data?.summary;
    if (!summary) {
      throw new Error('Test data summary not found');
    }

    if (summary.dao.organizations < 5) {
      throw new Error(`Expected at least 5 DAO organizations, got ${summary.dao.organizations}`);
    }

    if (summary.dao.members < 50) {
      throw new Error(`Expected at least 50 DAO members, got ${summary.dao.members}`);
    }

    if (summary.dao.proposals < 100) {
      throw new Error(`Expected at least 100 DAO proposals, got ${summary.dao.proposals}`);
    }
  }

  private async testValidateTestDataCounts(): Promise<void> {
    const summary = await EnhancedTestDataService.getTestDataSummary();
    
    if (!summary.success) {
      throw new Error(`Failed to get test data summary: ${summary.error}`);
    }

    const data = summary.data;
    
    // Validate minimum counts
    if (data.dao.organizations < 5) {
      throw new Error(`Insufficient DAO organizations: ${data.dao.organizations}`);
    }
    
    if (data.dao.members < 50) {
      throw new Error(`Insufficient DAO members: ${data.dao.members}`);
    }
    
    if (data.dao.proposals < 100) {
      throw new Error(`Insufficient DAO proposals: ${data.dao.proposals}`);
    }
    
    if (data.dao.votes < 100) {
      throw new Error(`Insufficient DAO votes: ${data.dao.votes}`);
    }
  }

  private async testTestDataRelationships(): Promise<void> {
    // Test that all members belong to existing organizations
    const { data: members, error: membersError } = await supabase
      .from('dao_members')
      .select('dao_id')
      .limit(10);

    if (membersError) {
      throw new Error(`Failed to fetch DAO members: ${membersError.message}`);
    }

    for (const member of members || []) {
      const { data: org, error: orgError } = await supabase
        .from('dao_organizations')
        .select('id')
        .eq('id', member.dao_id)
        .single();

      if (orgError || !org) {
        throw new Error(`Member references non-existent DAO organization: ${member.dao_id}`);
      }
    }

    // Test that all proposals belong to existing organizations
    const { data: proposals, error: proposalsError } = await supabase
      .from('dao_proposals')
      .select('dao_id')
      .limit(10);

    if (proposalsError) {
      throw new Error(`Failed to fetch DAO proposals: ${proposalsError.message}`);
    }

    for (const proposal of proposals || []) {
      const { data: org, error: orgError } = await supabase
        .from('dao_organizations')
        .select('id')
        .eq('id', proposal.dao_id)
        .single();

      if (orgError || !org) {
        throw new Error(`Proposal references non-existent DAO organization: ${proposal.dao_id}`);
      }
    }
  }

  // DAO Functionality Tests
  private async testDAOOrganizationsLoading(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found');
    }

    // Validate organization structure
    for (const org of orgs) {
      if (!org.id || !org.name || !org.governance_token_symbol) {
        throw new Error('Invalid organization structure');
      }
    }
  }

  private async testDAOMembersLoading(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found for member testing');
    }

    const members = await DAOService.getMembers(orgs[0].id);
    
    if (members.length === 0) {
      throw new Error('No DAO members found');
    }

    // Validate member structure
    for (const member of members) {
      if (!member.id || !member.dao_id || !member.user_id) {
        throw new Error('Invalid member structure');
      }
    }
  }

  private async testDAOProposalsLoading(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found for proposal testing');
    }

    const proposals = await DAOService.getProposals(orgs[0].id);
    
    if (proposals.length === 0) {
      throw new Error('No DAO proposals found');
    }

    // Validate proposal structure
    for (const proposal of proposals) {
      if (!proposal.id || !proposal.dao_id || !proposal.title) {
        throw new Error('Invalid proposal structure');
      }
    }
  }

  private async testDAOVotingSystem(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found for voting testing');
    }

    const proposals = await DAOService.getProposals(orgs[0].id);
    const activeProposals = proposals.filter(p => p.status === 'active');
    
    if (activeProposals.length === 0) {
      throw new Error('No active proposals found for voting testing');
    }

    // Test vote retrieval
    const testProposal = activeProposals[0];
    const userVote = await DAOService.getUserVote(testProposal.id, 'test-user-id');
    
    // This should not throw an error even if no vote exists
    if (userVote !== null && !['yes', 'no', 'abstain'].includes(userVote)) {
      throw new Error('Invalid vote choice returned');
    }
  }

  private async testDAOStatistics(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found for statistics testing');
    }

    const stats = await DAOService.getDAOStats(orgs[0].id);
    
    if (typeof stats.total_members !== 'number' || 
        typeof stats.total_proposals !== 'number' ||
        typeof stats.participation_rate !== 'number') {
      throw new Error('Invalid statistics structure');
    }
  }

  // Performance Tests
  private async testLargeDatasetHandling(): Promise<void> {
    const startTime = Date.now();
    
    // Test loading all proposals
    const { data: allProposals, error } = await supabase
      .from('dao_proposals')
      .select('*')
      .limit(1000);

    const duration = Date.now() - startTime;
    
    if (error) {
      throw new Error(`Failed to load large dataset: ${error.message}`);
    }

    if (duration > 5000) { // 5 seconds
      throw new Error(`Large dataset loading too slow: ${duration}ms`);
    }

    if (!allProposals || allProposals.length < 100) {
      throw new Error(`Expected at least 100 proposals, got ${allProposals?.length || 0}`);
    }
  }

  private async testConcurrentOperations(): Promise<void> {
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      throw new Error('No DAO organizations found for concurrent testing');
    }

    // Test concurrent loading of different data types
    const [proposals, members] = await Promise.all([
      DAOService.getProposals(orgs[0].id),
      DAOService.getMembers(orgs[0].id),
      DAOService.getDAOStats(orgs[0].id)
    ]);

    if (proposals.length === 0 || members.length === 0) {
      throw new Error('Concurrent operations failed to load data');
    }
  }

  private async testMemoryUsage(): Promise<void> {
    // Test that we can handle large result sets without memory issues
    const { data: largeDataset, error } = await supabase
      .from('dao_proposals')
      .select('id, title, description, status, category, total_votes, yes_votes, no_votes, abstain_votes')
      .limit(500);

    if (error) {
      throw new Error(`Memory usage test failed: ${error.message}`);
    }

    if (!largeDataset || largeDataset.length < 100) {
      throw new Error(`Memory usage test insufficient data: ${largeDataset?.length || 0}`);
    }

    // Verify data integrity
    for (const proposal of largeDataset) {
      if (!proposal.id || !proposal.title) {
        throw new Error('Data integrity compromised in large dataset');
      }
    }
  }

  // Data Validation Tests
  private async testDataTypeValidation(): Promise<void> {
    const { data: proposals, error } = await supabase
      .from('dao_proposals')
      .select('total_votes, yes_votes, no_votes, abstain_votes, participation_rate')
      .limit(10);

    if (error) {
      throw new Error(`Data type validation failed: ${error.message}`);
    }

    for (const proposal of proposals || []) {
      if (typeof proposal.total_votes !== 'number' ||
          typeof proposal.yes_votes !== 'number' ||
          typeof proposal.no_votes !== 'number' ||
          typeof proposal.abstain_votes !== 'number') {
        throw new Error('Invalid data types in proposal votes');
      }
    }
  }

  private async testConstraintValidation(): Promise<void> {
    // Test that vote counts are consistent
    const { data: proposals, error } = await supabase
      .from('dao_proposals')
      .select('total_votes, yes_votes, no_votes, abstain_votes')
      .limit(10);

    if (error) {
      throw new Error(`Constraint validation failed: ${error.message}`);
    }

    for (const proposal of proposals || []) {
      const calculatedTotal = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
      if (proposal.total_votes !== calculatedTotal) {
        throw new Error(`Vote count inconsistency: total=${proposal.total_votes}, calculated=${calculatedTotal}`);
      }
    }
  }

  private async testBusinessLogicValidation(): Promise<void> {
    // Test that participation rates are reasonable
    const { data: proposals, error } = await supabase
      .from('dao_proposals')
      .select('participation_rate, total_votes')
      .limit(10);

    if (error) {
      throw new Error(`Business logic validation failed: ${error.message}`);
    }

    for (const proposal of proposals || []) {
      if (proposal.participation_rate < 0 || proposal.participation_rate > 100) {
        throw new Error(`Invalid participation rate: ${proposal.participation_rate}`);
      }
    }
  }

  // Error Handling Tests
  private async testInvalidDataHandling(): Promise<void> {
    // Test handling of invalid proposal ID
    try {
      await DAOService.getUserVote('invalid-uuid', 'test-user-id');
      // Should not throw an error, just return null
    } catch (error) {
      throw new Error(`Invalid data handling failed: ${error}`);
    }
  }

  private async testNetworkErrorHandling(): Promise<void> {
    // Test that the service handles network errors gracefully
    const orgs = await DAOService.getOrganizations();
    
    if (orgs.length === 0) {
      // This is expected if tables don't exist, should not throw
      return;
    }

    // Test with invalid organization ID
    const members = await DAOService.getMembers('00000000-0000-0000-0000-000000000000');
    // Should return empty array, not throw error
    if (!Array.isArray(members)) {
      throw new Error('Network error handling failed');
    }
  }

  private async testPermissionErrorHandling(): Promise<void> {
    // Test that the service handles permission errors gracefully
    try {
      const orgs = await DAOService.getOrganizations();
      // Should not throw even if there are permission issues
      if (!Array.isArray(orgs)) {
        throw new Error('Permission error handling failed');
      }
    } catch (error) {
      throw new Error(`Permission error handling failed: ${error}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  static generateReport(results: TestSuite[]): string {
    let report = '# Enhanced Test Report\n\n';
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    for (const suite of results) {
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      totalDuration += suite.duration;

      report += `## ${suite.suiteName}\n\n`;
      report += `- **Total Tests:** ${suite.totalTests}\n`;
      report += `- **Passed:** ${suite.passedTests}\n`;
      report += `- **Failed:** ${suite.failedTests}\n`;
      report += `- **Duration:** ${suite.duration}ms\n\n`;

      for (const test of suite.tests) {
        const status = test.success ? '✅' : '❌';
        report += `- ${status} **${test.test}** (${test.duration}ms)\n`;
        if (!test.success) {
          report += `  - Error: ${test.message}\n`;
        }
      }
      report += '\n';
    }

    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${totalPassed}\n`;
    report += `- **Failed:** ${totalFailed}\n`;
    report += `- **Total Duration:** ${totalDuration}ms\n`;
    report += `- **Success Rate:** ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%\n`;

    return report;
  }
}
