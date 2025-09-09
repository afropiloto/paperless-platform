import { performance } from 'perf_hooks';

/**
 * Performance Monitor for Test Execution
 * 
 * Tracks and reports test performance metrics including:
 * - Test execution times
 * - Memory usage
 * - Database operation times
 * - API response times
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memorySnapshots: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];

  private constructor() {
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a test or operation
   */
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  /**
   * End timing and record the duration
   */
  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(name, {
      duration,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage()
    });

    this.startTimes.delete(name);
    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: any, metadata?: any): void {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      metadata
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }

  /**
   * Get test execution summary
   */
  getTestSummary(): {
    totalTests: number;
    averageExecutionTime: number;
    slowestTests: Array<{ name: string; duration: number }>;
    memoryPeak: number;
    memoryAverage: number;
  } {
    const testMetrics = Array.from(this.metrics.entries())
      .filter(([name]) => name.startsWith('test:'))
      .map(([name, data]) => ({ name, duration: data.duration }));

    const totalTests = testMetrics.length;
    const averageExecutionTime = testMetrics.reduce((sum, test) => sum + test.duration, 0) / totalTests;
    
    const slowestTests = testMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const memoryUsages = this.memorySnapshots.map(snapshot => snapshot.usage.heapUsed);
    const memoryPeak = Math.max(...memoryUsages);
    const memoryAverage = memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length;

    return {
      totalTests,
      averageExecutionTime,
      slowestTests,
      memoryPeak,
      memoryAverage
    };
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const interval = setInterval(() => {
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });

      // Keep only last 100 snapshots to prevent memory leaks
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }
    }, 1000);

    // Clear interval when process exits
    process.on('exit', () => clearInterval(interval));
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getTestSummary();
    const metrics = this.getMetrics();

    let report = '\n📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    // Test execution summary
    report += `Total Tests: ${summary.totalTests}\n`;
    report += `Average Execution Time: ${summary.averageExecutionTime.toFixed(2)}ms\n`;
    report += `Memory Peak: ${(summary.memoryPeak / 1024 / 1024).toFixed(2)}MB\n`;
    report += `Memory Average: ${(summary.memoryAverage / 1024 / 1024).toFixed(2)}MB\n\n`;

    // Slowest tests
    if (summary.slowestTests.length > 0) {
      report += '🐌 Slowest Tests:\n';
      report += '-'.repeat(30) + '\n';
      summary.slowestTests.forEach((test, index) => {
        report += `${index + 1}. ${test.name}: ${test.duration.toFixed(2)}ms\n`;
      });
      report += '\n';
    }

    // Database operations
    const dbMetrics = Array.from(metrics.entries())
      .filter(([name]) => name.startsWith('db:'))
      .map(([name, data]) => ({ name, duration: data.duration }));

    if (dbMetrics.length > 0) {
      report += '🗄️ Database Operations:\n';
      report += '-'.repeat(30) + '\n';
      dbMetrics.forEach(metric => {
        report += `${metric.name}: ${metric.duration.toFixed(2)}ms\n`;
      });
      report += '\n';
    }

    // API operations
    const apiMetrics = Array.from(metrics.entries())
      .filter(([name]) => name.startsWith('api:'))
      .map(([name, data]) => ({ name, duration: data.duration }));

    if (apiMetrics.length > 0) {
      report += '🌐 API Operations:\n';
      report += '-'.repeat(30) + '\n';
      apiMetrics.forEach(metric => {
        report += `${metric.name}: ${metric.duration.toFixed(2)}ms\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.memorySnapshots = [];
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    const data = {
      timestamp: Date.now(),
      summary: this.getTestSummary(),
      metrics: Object.fromEntries(this.metrics),
      memorySnapshots: this.memorySnapshots
    };

    return JSON.stringify(data, null, 2);
  }
}

/**
 * Decorator for timing test methods
 */
export function timedTest(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  const monitor = PerformanceMonitor.getInstance();

  descriptor.value = async function (...args: any[]) {
    const testName = `test:${target.constructor.name}.${propertyName}`;
    monitor.startTimer(testName);
    
    try {
      const result = await method.apply(this, args);
      monitor.endTimer(testName);
      return result;
    } catch (error) {
      monitor.endTimer(testName);
      throw error;
    }
  };
}

/**
 * Decorator for timing database operations
 */
export function timedDbOperation(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const timerName = `db:${operationName}`;
      monitor.startTimer(timerName);
      
      try {
        const result = await method.apply(this, args);
        monitor.endTimer(timerName);
        return result;
      } catch (error) {
        monitor.endTimer(timerName);
        throw error;
      }
    };
  };
}

/**
 * Decorator for timing API operations
 */
export function timedApiOperation(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const timerName = `api:${operationName}`;
      monitor.startTimer(timerName);
      
      try {
        const result = await method.apply(this, args);
        monitor.endTimer(timerName);
        return result;
      } catch (error) {
        monitor.endTimer(timerName);
        throw error;
      }
    };
  };
}

export default PerformanceMonitor;
