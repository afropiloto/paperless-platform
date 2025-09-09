#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Test Summary
 * 
 * Analyzes test results and generates a comprehensive summary
 * including test results, coverage, and performance metrics.
 */

function generateTestSummary() {
  console.log('📋 Generating Test Summary...');

  const testResultsDir = path.join(__dirname, '../test-results');
  const summaryFile = path.join(__dirname, '../test-summary.md');
  
  // Read test results
  const testResults = readTestResults(testResultsDir);
  
  // Generate summary
  const summary = generateSummary(testResults);
  
  // Write summary
  fs.writeFileSync(summaryFile, summary);
  
  console.log('✅ Test summary generated successfully!');
  console.log(`📁 Summary saved to: ${summaryFile}`);
}

function readTestResults(testResultsDir) {
  const results = {
    testSuites: [],
    coverage: null,
    performance: null,
    errors: []
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
    results.errors.push(error.message);
  }

  return results;
}

function parseJUnitXML(xmlContent) {
  const testSuites = [];
  const suiteRegex = /<testsuite[^>]*>/g;
  
  let suiteMatch;
  while ((suiteMatch = suiteRegex.exec(xmlContent)) !== null) {
    const suite = {
      name: extractAttribute(suiteMatch[0], 'name'),
      tests: parseInt(extractAttribute(suiteMatch[0], 'tests')) || 0,
      failures: parseInt(extractAttribute(suiteMatch[0], 'failures')) || 0,
      errors: parseInt(extractAttribute(suiteMatch[0], 'errors')) || 0,
      time: parseFloat(extractAttribute(suiteMatch[0], 'time')) || 0
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

function generateSummary(testResults) {
  const totalTests = testResults.testSuites.reduce((sum, suite) => sum + suite.tests, 0);
  const totalFailures = testResults.testSuites.reduce((sum, suite) => sum + suite.failures, 0);
  const totalErrors = testResults.testSuites.reduce((sum, suite) => sum + suite.errors, 0);
  const totalTime = testResults.testSuites.reduce((sum, suite) => sum + suite.time, 0);
  const passedTests = totalTests - totalFailures - totalErrors;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  const status = totalFailures + totalErrors === 0 ? '✅ PASSED' : '❌ FAILED';
  const statusEmoji = totalFailures + totalErrors === 0 ? '🎉' : '💥';

  let summary = `
# ${statusEmoji} Test Results Summary

**Status:** ${status}  
**Generated:** ${new Date().toLocaleString()}

## 📊 Overall Results

| Metric | Value |
|--------|-------|
| **Total Tests** | ${totalTests} |
| **Passed** | ${passedTests} |
| **Failed** | ${totalFailures} |
| **Errors** | ${totalErrors} |
| **Success Rate** | ${successRate}% |
| **Total Time** | ${totalTime.toFixed(2)}s |

`;

  // Add coverage section if available
  if (testResults.coverage) {
    const coverage = testResults.coverage.total;
    summary += `
## 📈 Coverage Report

| Type | Coverage | Covered | Total |
|------|----------|---------|-------|
| **Lines** | ${coverage.lines.pct.toFixed(1)}% | ${coverage.lines.covered} | ${coverage.lines.total} |
| **Functions** | ${coverage.functions.pct.toFixed(1)}% | ${coverage.functions.covered} | ${coverage.functions.total} |
| **Branches** | ${coverage.branches.pct.toFixed(1)}% | ${coverage.branches.covered} | ${coverage.branches.total} |
| **Statements** | ${coverage.statements.pct.toFixed(1)}% | ${coverage.statements.covered} | ${coverage.statements.total} |

`;
  }

  // Add test suite breakdown
  if (testResults.testSuites.length > 0) {
    summary += `
## 🧪 Test Suite Breakdown

| Test Suite | Tests | Passed | Failed | Errors | Time (s) | Status |
|------------|-------|--------|--------|--------|----------|--------|
`;

    testSuites.forEach(suite => {
      const suitePassed = suite.tests - suite.failures - suite.errors;
      const suiteStatus = suite.failures + suite.errors === 0 ? '✅' : '❌';
      summary += `| ${suite.name} | ${suite.tests} | ${suitePassed} | ${suite.failures} | ${suite.errors} | ${suite.time.toFixed(2)} | ${suiteStatus} |\n`;
    });

    summary += '\n';
  }

  // Add performance section if available
  if (testResults.performance) {
    summary += `
## ⚡ Performance Metrics

| Metric | Value |
|--------|-------|
| **Average Test Time** | ${testResults.performance.averageExecutionTime?.toFixed(2)}ms |
| **Memory Peak** | ${testResults.performance.memoryPeak ? (testResults.performance.memoryPeak / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'} |
| **Memory Average** | ${testResults.performance.memoryAverage ? (testResults.performance.memoryAverage / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'} |

`;
  }

  // Add slowest tests if available
  if (testResults.performance?.slowestTests?.length > 0) {
    summary += `
## 🐌 Slowest Tests

| Test | Duration | Status |
|------|----------|--------|
`;

    testResults.performance.slowestTests.slice(0, 10).forEach(test => {
      summary += `| ${test.name} | ${test.duration.toFixed(2)}ms | ${test.status || '✅'} |\n`;
    });

    summary += '\n';
  }

  // Add errors section if any
  if (testResults.errors.length > 0) {
    summary += `
## ⚠️ Errors

${testResults.errors.map(error => `- ${error}`).join('\n')}

`;
  }

  // Add recommendations
  summary += `
## 💡 Recommendations

`;

  if (totalFailures + totalErrors > 0) {
    summary += `- 🔍 **Investigate Failures**: ${totalFailures + totalErrors} test(s) failed and need attention\n`;
  }

  if (testResults.coverage && testResults.coverage.total.lines.pct < 80) {
    summary += `- 📈 **Improve Coverage**: Current coverage is ${testResults.coverage.total.lines.pct.toFixed(1)}%, consider adding more tests\n`;
  }

  if (testResults.performance?.averageExecutionTime > 1000) {
    summary += `- ⚡ **Optimize Performance**: Average test time is ${testResults.performance.averageExecutionTime.toFixed(2)}ms, consider optimization\n`;
  }

  if (totalTests > 0 && totalTime > 300) {
    summary += `- 🚀 **Parallelize Tests**: Total execution time is ${totalTime.toFixed(2)}s, consider running tests in parallel\n`;
  }

  summary += `
## 🔗 Links

- [Test Results](./test-results/)
- [Coverage Report](./coverage-e2e/)
- [Performance Report](./performance-results/)

---

*This summary was generated automatically by the test framework.*
`;

  return summary;
}

// Run the script
if (require.main === module) {
  generateTestSummary();
}

module.exports = { generateTestSummary };
