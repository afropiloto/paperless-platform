#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Performance Report
 * 
 * Analyzes test results and generates a comprehensive performance report
 * including execution times, memory usage, and performance trends.
 */

function generatePerformanceReport() {
  console.log('📊 Generating Performance Report...');

  const testResultsDir = path.join(__dirname, '../test-results');
  const performanceResultsDir = path.join(__dirname, '../performance-results');
  
  // Ensure performance results directory exists
  if (!fs.existsSync(performanceResultsDir)) {
    fs.mkdirSync(performanceResultsDir, { recursive: true });
  }

  // Read test results
  const testResults = readTestResults(testResultsDir);
  
  // Generate performance metrics
  const performanceMetrics = analyzePerformance(testResults);
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(performanceMetrics);
  
  // Generate JSON report
  const jsonReport = generateJSONReport(performanceMetrics);
  
  // Generate Markdown report
  const markdownReport = generateMarkdownReport(performanceMetrics);
  
  // Write reports
  fs.writeFileSync(path.join(performanceResultsDir, 'performance-report.html'), htmlReport);
  fs.writeFileSync(path.join(performanceResultsDir, 'performance-report.json'), jsonReport);
  fs.writeFileSync(path.join(performanceResultsDir, 'performance-report.md'), markdownReport);
  
  console.log('✅ Performance report generated successfully!');
  console.log(`📁 Reports saved to: ${performanceResultsDir}`);
}

function readTestResults(testResultsDir) {
  const results = {
    testSuites: [],
    testCases: [],
    coverage: null,
    performance: null
  };

  try {
    // Read JUnit XML results
    const junitFile = path.join(testResultsDir, 'junit.xml');
    if (fs.existsSync(junitFile)) {
      const junitContent = fs.readFileSync(junitFile, 'utf8');
      results.testSuites = parseJUnitXML(junitContent);
    }

    // Read coverage data
    const coverageFile = path.join(__dirname, '../coverage-e2e/coverage-summary.json');
    if (fs.existsSync(coverageFile)) {
      results.coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    }

    // Read performance data
    const performanceFile = path.join(testResultsDir, 'performance-metrics.json');
    if (fs.existsSync(performanceFile)) {
      results.performance = JSON.parse(fs.readFileSync(performanceFile, 'utf8'));
    }

  } catch (error) {
    console.warn('⚠️ Error reading test results:', error.message);
  }

  return results;
}

function parseJUnitXML(xmlContent) {
  // Simple XML parsing for JUnit results
  const testSuites = [];
  const suiteRegex = /<testsuite[^>]*>/g;
  const testCaseRegex = /<testcase[^>]*>/g;
  
  let suiteMatch;
  while ((suiteMatch = suiteRegex.exec(xmlContent)) !== null) {
    const suite = {
      name: extractAttribute(suiteMatch[0], 'name'),
      tests: parseInt(extractAttribute(suiteMatch[0], 'tests')) || 0,
      failures: parseInt(extractAttribute(suiteMatch[0], 'failures')) || 0,
      errors: parseInt(extractAttribute(suiteMatch[0], 'errors')) || 0,
      time: parseFloat(extractAttribute(suiteMatch[0], 'time')) || 0,
      testCases: []
    };
    
    testSuites.push(suite);
  }
  
  return testSuites;
}

function extractAttribute(xml, attribute) {
  const regex = new RegExp(`${attribute}="([^"]*)"`);
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function analyzePerformance(testResults) {
  const metrics = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalTime: 0,
      averageTime: 0,
      coverage: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0
      }
    },
    testSuites: [],
    performance: {
      slowestTests: [],
      fastestTests: [],
      memoryUsage: {
        peak: 0,
        average: 0
      }
    },
    trends: {
      executionTime: [],
      memoryUsage: [],
      testCount: []
    }
  };

  // Analyze test suites
  testResults.testSuites.forEach(suite => {
    metrics.summary.totalTests += suite.tests;
    metrics.summary.passedTests += (suite.tests - suite.failures - suite.errors);
    metrics.summary.failedTests += (suite.failures + suite.errors);
    metrics.summary.totalTime += suite.time;

    metrics.testSuites.push({
      name: suite.name,
      tests: suite.tests,
      failures: suite.failures,
      errors: suite.errors,
      time: suite.time,
      averageTime: suite.tests > 0 ? suite.time / suite.tests : 0
    });
  });

  // Calculate averages
  if (metrics.summary.totalTests > 0) {
    metrics.summary.averageTime = metrics.summary.totalTime / metrics.summary.totalTests;
  }

  // Analyze coverage
  if (testResults.coverage) {
    metrics.summary.coverage = {
      lines: testResults.coverage.total.lines.pct,
      functions: testResults.coverage.total.functions.pct,
      branches: testResults.coverage.total.branches.pct,
      statements: testResults.coverage.total.statements.pct
    };
  }

  // Analyze performance data
  if (testResults.performance) {
    metrics.performance = testResults.performance;
  }

  // Sort test suites by execution time
  metrics.testSuites.sort((a, b) => b.time - a.time);
  metrics.performance.slowestTests = metrics.testSuites.slice(0, 10);
  metrics.performance.fastestTests = metrics.testSuites.slice(-10).reverse();

  return metrics;
}

function generateHTMLReport(metrics) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9e9e9; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { font-size: 14px; color: #666; }
        .section { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background-color: #f2f2f2; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>📈 Summary</h2>
        <div class="metric">
            <div class="metric-value">${metrics.summary.totalTests}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value success">${metrics.summary.passedTests}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value danger">${metrics.summary.failedTests}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${metrics.summary.totalTime.toFixed(2)}s</div>
            <div class="metric-label">Total Time</div>
        </div>
        <div class="metric">
            <div class="metric-value">${metrics.summary.averageTime.toFixed(2)}s</div>
            <div class="metric-label">Average Time</div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Coverage</h2>
        <div class="metric">
            <div class="metric-value">${metrics.summary.coverage.lines.toFixed(1)}%</div>
            <div class="metric-label">Lines</div>
        </div>
        <div class="metric">
            <div class="metric-value">${metrics.summary.coverage.functions.toFixed(1)}%</div>
            <div class="metric-label">Functions</div>
        </div>
        <div class="metric">
            <div class="metric-value">${metrics.summary.coverage.branches.toFixed(1)}%</div>
            <div class="metric-label">Branches</div>
        </div>
        <div class="metric">
            <div class="metric-value">${metrics.summary.coverage.statements.toFixed(1)}%</div>
            <div class="metric-label">Statements</div>
        </div>
    </div>

    <div class="section">
        <h2>🐌 Slowest Tests</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Test Suite</th>
                    <th>Tests</th>
                    <th>Time (s)</th>
                    <th>Avg Time (s)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${metrics.performance.slowestTests.map(suite => `
                    <tr>
                        <td>${suite.name}</td>
                        <td>${suite.tests}</td>
                        <td>${suite.time.toFixed(2)}</td>
                        <td>${suite.averageTime.toFixed(2)}</td>
                        <td class="${suite.failures + suite.errors > 0 ? 'danger' : 'success'}">
                            ${suite.failures + suite.errors > 0 ? 'Failed' : 'Passed'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
  `;
}

function generateJSONReport(metrics) {
  return JSON.stringify(metrics, null, 2);
}

function generateMarkdownReport(metrics) {
  return `
# 📊 Performance Report

Generated on: ${new Date().toLocaleString()}

## 📈 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${metrics.summary.totalTests} |
| Passed Tests | ${metrics.summary.passedTests} |
| Failed Tests | ${metrics.summary.failedTests} |
| Total Time | ${metrics.summary.totalTime.toFixed(2)}s |
| Average Time | ${metrics.summary.averageTime.toFixed(2)}s |

## 📊 Coverage

| Type | Coverage |
|------|----------|
| Lines | ${metrics.summary.coverage.lines.toFixed(1)}% |
| Functions | ${metrics.summary.coverage.functions.toFixed(1)}% |
| Branches | ${metrics.summary.coverage.branches.toFixed(1)}% |
| Statements | ${metrics.summary.coverage.statements.toFixed(1)}% |

## 🐌 Slowest Tests

| Test Suite | Tests | Time (s) | Avg Time (s) | Status |
|------------|-------|----------|--------------|--------|
${metrics.performance.slowestTests.map(suite => 
  `| ${suite.name} | ${suite.tests} | ${suite.time.toFixed(2)} | ${suite.averageTime.toFixed(2)} | ${suite.failures + suite.errors > 0 ? '❌ Failed' : '✅ Passed'} |`
).join('\n')}

## 🚀 Fastest Tests

| Test Suite | Tests | Time (s) | Avg Time (s) | Status |
|------------|-------|----------|--------------|--------|
${metrics.performance.fastestTests.map(suite => 
  `| ${suite.name} | ${suite.tests} | ${suite.time.toFixed(2)} | ${suite.averageTime.toFixed(2)} | ${suite.failures + suite.errors > 0 ? '❌ Failed' : '✅ Passed'} |`
).join('\n')}
  `;
}

// Run the script
if (require.main === module) {
  generatePerformanceReport();
}

module.exports = { generatePerformanceReport };
