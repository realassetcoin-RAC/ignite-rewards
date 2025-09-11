/**
 * Error Dashboard Component
 * 
 * Provides comprehensive error tracking, debugging information,
 * and diagnostic tools for administrators.
 */

import React, { useState, useEffect } from 'react';
import { useSmartDataRefresh } from "@/hooks/useSmartDataRefresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Removed Tabs import - using custom navigation
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Download, Trash2, RefreshCw, Eye, TrendingUp, Activity, Database, Wifi, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logger, log, LogLevel } from "@/utils/logger";
import { virtualCardErrorTracker, getVirtualCardErrors, getVirtualCardErrorStats } from "@/utils/virtualCardErrorTracker";

const ErrorDashboard = () => {
  const [errors, setErrors] = useState(getVirtualCardErrors());
  const [stats, setStats] = useState(getVirtualCardErrorStats());
  const [logSummary, setLogSummary] = useState(logger.getLogSummary());
  const [selectedError, setSelectedError] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('errors');
  const { toast } = useToast();

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshData = () => {
    setErrors(getVirtualCardErrors());
    setStats(getVirtualCardErrorStats());
    setLogSummary(logger.getLogSummary());
    log.debug('ERROR_DASHBOARD', 'Data refreshed');
  };

  // Smart data refresh - refreshes error dashboard data when returning to app
  const refreshErrorData = async () => {
    console.log('🔄 Refreshing error dashboard data...');
    refreshData();
  };

  useSmartDataRefresh(refreshErrorData, {
    debounceMs: 2000, // 2 second debounce for error data
    enabled: true,
    dependencies: [] // Refresh when component is active
  });

  const exportLogs = () => {
    try {
      const logData = logger.exportLogs();
      const errorData = virtualCardErrorTracker.exportErrors();
      
      const exportData = {
        timestamp: new Date().toISOString(),
        logs: JSON.parse(logData),
        virtualCardErrors: JSON.parse(errorData)
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pointbridge-error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Error logs have been downloaded successfully"
      });
      
      log.admin('export_logs', { type: 'error_logs', count: logSummary.total });
    } catch (error) {
      log.error('ERROR_DASHBOARD', 'Failed to export logs', { error });
      toast({
        title: "Export Failed",
        description: "Unable to export logs. Please try again.",
        variant: "destructive"
      });
    }
  };

  const clearLogs = () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }
    
    logger.clearLogs();
    virtualCardErrorTracker.clearErrors();
    refreshData();
    
    toast({
      title: "Logs Cleared",
      description: "All error logs have been cleared successfully"
    });
    
    log.admin('clear_logs', { type: 'all_logs' });
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'permission': return <Shield className="h-4 w-4 text-red-500" />;
      case 'database': return <Database className="h-4 w-4 text-orange-500" />;
      case 'network': return <Wifi className="h-4 w-4 text-blue-500" />;
      case 'validation': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'permission': return 'destructive';
      case 'database': return 'secondary';
      case 'network': return 'default';
      case 'validation': return 'outline';
      default: return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecentErrors = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return errors.filter(error => new Date(error.timestamp) >= oneHourAgo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Error Dashboard</h3>
          <p className="text-muted-foreground">
            Monitor application errors and debugging information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-primary/10' : ''}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recent} in the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permission Errors</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.permission || 0}</div>
            <p className="text-xs text-muted-foreground">
              Authorization issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Errors</CardTitle>
            <Database className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.database || 0}</div>
            <p className="text-xs text-muted-foreground">
              Database connectivity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              {logSummary.errors} errors, {logSummary.warnings} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <div className="w-full bg-background/60 backdrop-blur-md border border-primary/20 rounded-lg p-1">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('errors')}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                activeTab === 'errors'
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Virtual Card Errors</span>
              <span className="sm:hidden text-xs">Errors</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Recent Activity</span>
              <span className="sm:hidden text-xs">Recent</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Error Statistics</span>
              <span className="sm:hidden text-xs">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex-1 min-w-0 ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Database className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Application Logs</span>
              <span className="sm:hidden text-xs">Logs</span>
            </button>
          </div>
        </div>

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            <Card>
            <CardHeader>
              <CardTitle>Virtual Card Errors</CardTitle>
              <CardDescription>
                Detailed error tracking for virtual card operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Errors Found</h3>
                  <p className="text-muted-foreground">
                    No virtual card errors have been recorded.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {errors.slice(0, 10).map((error) => (
                    <div key={error.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getErrorTypeIcon(error.errorType)}
                        <div>
                          <div className="font-medium">{error.operation} operation failed</div>
                          <div className="text-sm text-muted-foreground">
                            {error.errorMessage}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(error.timestamp)} • {error.context.component}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getErrorTypeColor(error.errorType) as any}>
                          {error.errorType}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedError(error)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Error Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about the error
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-96">
                              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                                {JSON.stringify(error, null, 2)}
                              </pre>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => {}}>
                        View All {errors.length} Errors
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === 'recent' && (
          <div className="space-y-4">
            <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Errors that occurred in the last hour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getRecentErrors().length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recent Errors</h3>
                  <p className="text-muted-foreground">
                    No errors in the last hour. System is running smoothly!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getRecentErrors().map((error) => (
                    <div key={error.id} className="flex items-center space-x-3 p-2 border-l-2 border-red-500 bg-red-50 rounded">
                      {getErrorTypeIcon(error.errorType)}
                      <div className="flex-1">
                        <div className="font-medium">{error.operation} - {error.errorMessage}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(error.timestamp)}
                        </div>
                      </div>
                      <Badge variant={getErrorTypeColor(error.errorType) as any}>
                        {error.errorType}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Operation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byOperation).map(([operation, count]) => (
                    <div key={operation} className="flex justify-between items-center">
                      <span className="capitalize">{operation}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getErrorTypeIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                      <Badge variant={getErrorTypeColor(type) as any}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <Card>
            <CardHeader>
              <CardTitle>Application Logs Summary</CardTitle>
              <CardDescription>
                Overview of all application logging activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{logSummary.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{logSummary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{logSummary.infos}</div>
                  <div className="text-sm text-muted-foreground">Info</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{logSummary.debugs}</div>
                  <div className="text-sm text-muted-foreground">Debug</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{logSummary.traces}</div>
                  <div className="text-sm text-muted-foreground">Trace</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDashboard;