import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  FileText,
  BarChart3
} from 'lucide-react';
import FunctionalTestSuite from '@/utils/functionalTestSuite';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    try {
      setIsRunning(true);
      setTestResults([]);
      
      toast({
        title: "Running Tests",
        description: "Executing comprehensive functional test suite...",
      });

      const testSuite = new FunctionalTestSuite();
      const results = await testSuite.runAllTests();
      
      setTestResults(results);
      setLastRun(new Date());
      
      const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0);
      const totalPassed = results.reduce((sum, suite) => sum + suite.passedTests, 0);
      const totalFailed = results.reduce((sum, suite) => sum + suite.failedTests, 0);
      
      if (totalFailed === 0) {
        toast({
          title: "All Tests Passed!",
          description: `${totalPassed}/${totalTests} tests passed successfully.`,
        });
      } else {
        toast({
          title: "Some Tests Failed",
          description: `${totalFailed}/${totalTests} tests failed. Check the results below.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error running tests:', error);
      toast({
        title: "Test Execution Error",
        description: "Failed to run tests. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (testResults.length === 0) {
      toast({
        title: "No Results",
        description: "Please run tests first before exporting results.",
        variant: "destructive",
      });
      return;
    }

    const testSuite = new FunctionalTestSuite();
    testSuite['results'] = testResults; // Access private property for export
    const report = testSuite.generateReport();
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Test report has been exported as a Markdown file.",
    });
  };

  const exportJSON = () => {
    if (testResults.length === 0) {
      toast({
        title: "No Results",
        description: "Please run tests first before exporting results.",
        variant: "destructive",
      });
      return;
    }

    const testSuite = new FunctionalTestSuite();
    testSuite['results'] = testResults; // Access private property for export
    const json = testSuite.exportResults();
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results Exported",
      description: "Test results have been exported as a JSON file.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'SKIP':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PASS: { color: 'bg-green-100 text-green-800', label: 'Passed' },
      FAIL: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      SKIP: { color: 'bg-yellow-100 text-yellow-800', label: 'Skipped' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SKIP;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const totalTests = testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
  const totalSkipped = testResults.reduce((sum, suite) => sum + suite.skippedTests, 0);
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Functional Test Runner</h3>
        <p className="text-sm text-muted-foreground">
          Run comprehensive end-to-end tests to validate all application functionality.
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Execute all functional tests to validate application features.
              </p>
              {lastRun && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last run: {lastRun.toLocaleString()}
                </p>
              )}
            </div>
            <Button 
              onClick={runTests}
              disabled={isRunning}
              className="btn-gradient"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Test Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">{totalTests}</div>
                <div className="text-xs text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-500">{totalPassed}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-500">{totalFailed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">{totalSkipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold">
                Success Rate: {successRate}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Test Results</h4>
            <div className="flex gap-2">
              <Button 
                onClick={exportReport}
                variant="outline"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button 
                onClick={exportJSON}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {testResults.map((suite, suiteIndex) => (
            <Card key={suiteIndex}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{suite.suiteName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {suite.passedTests}/{suite.totalTests} passed
                    </Badge>
                    <Badge variant="outline">
                      {suite.duration}ms
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <div className="font-medium">{test.testName}</div>
                          {test.status === 'FAIL' && (
                            <div className="text-sm text-red-600">{test.message}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        <span className="text-xs text-muted-foreground">
                          {test.duration}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Test Coverage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Database Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Database connection validation</li>
                <li>• Authentication flow testing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">User Management Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• User creation and validation</li>
                <li>• User data retrieval</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Merchant Management Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Merchant creation and validation</li>
                <li>• Merchant data retrieval</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">DAO Management Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• DAO organization creation</li>
                <li>• DAO proposal creation and validation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Transaction Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Transaction creation and validation</li>
                <li>• Reward points calculation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Marketplace Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Marketplace listing creation</li>
                <li>• Investment data validation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">QR Code Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• QR code data structure validation</li>
                <li>• Reward points calculation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Points Tracking Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Points tracking data structure</li>
                <li>• Monthly points validation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">UI/UX Tests</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Date picker validation</li>
                <li>• Form data validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRunner;
