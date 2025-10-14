import React from 'react';

export const IbkrGuide: React.FC = () => {
  return (
    <div className="ibkr-guide">
      <h4>How to Export Data from Interactive Brokers</h4>

      <div className="mb-4">
        <h5>🏆 Recommended: QFX Export (Most Comprehensive)</h5>
        <p className="mb-3">QFX files provide the most complete data for UK tax calculations:</p>
        <ol>
          <li>
            <strong>Navigate to Reports</strong>:
            <ul>
              <li>From the main menu, select <strong>Performance & Reports</strong></li>
              <li>Choose <strong>Statements</strong> from the dropdown</li>
            </ul>
          </li>
          <li>
            <strong>Select Third-Party Downloads</strong>:
            <ul>
              <li>Look for the <strong>Third-Party Downloads</strong> section</li>
              <li>Click to access export options</li>
            </ul>
          </li>
          <li>
            <strong>Choose Quicken Format</strong>:
            <ul>
              <li>Select <strong>Quicken</strong> as the export format</li>
              <li>This generates a comprehensive QFX file</li>
            </ul>
          </li>
          <li>
            <strong>Set Date Range</strong>:
            <ul>
              <li>Choose your tax year dates (e.g., 06/04/2023 - 05/04/2024)</li>
            </ul>
          </li>
          <li>
            <strong>Generate and Download</strong>:
            <ul>
              <li>Click <strong>Generate</strong> to create the QFX file</li>
              <li>Download when ready</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="mb-4">
        <h5>🔄 Alternative: CSV Export via Flex Queries</h5>
        <p className="mb-3">For CSV format or when QFX encounters issues:</p>
        <ol>
          <li>
            <strong>Login to Interactive Brokers</strong>:
            <ul>
              <li>Access your <a href="https://www.interactivebrokers.com.au/sso/Login" target="_blank" rel="noopener noreferrer">Interactive Brokers account</a></li>
            </ul>
          </li>
          <li>
            <strong>Navigate to Reports</strong>:
            <ul>
              <li>Click on the <strong>Reports</strong> tab</li>
              <li>Select <strong>Flex Queries</strong></li>
            </ul>
          </li>
          <li>
            <strong>Create Activity Flex Query</strong>:
            <ul>
              <li>Click <strong>'+'</strong> next to <strong>Activity Flex Query</strong></li>
            </ul>
          </li>
          <li>
            <strong>Select Data Sections</strong>:
            <ul>
              <li>Select <strong>Trades</strong> under <strong>Sections</strong></li>
              <li>Select <strong>Executions</strong> on the pop-up window</li>
            </ul>
          </li>
          <li>
            <strong>Configure Fields</strong>:
            <ul>
              <li>Tick <strong>SELECT ALL</strong> to include all available fields</li>
              <li>Click <strong>Save</strong></li>
            </ul>
          </li>
          <li>
            <strong>Name Your Query</strong>:
            <ul>
              <li>Enter a <strong>Query Name</strong> (e.g., "Tax Calculator Export")</li>
            </ul>
          </li>
          <li>
            <strong>Set Date Format</strong>:
            <ul>
              <li>Change <strong>Date Format</strong> to <strong>mm/dd/yyyy</strong> under <strong>General Configuration</strong></li>
            </ul>
          </li>
          <li>
            <strong>Create and Run Query</strong>:
            <ul>
              <li>Click <strong>Create</strong> to save your query</li>
              <li><strong>Run</strong> the Activity Flex Query</li>
            </ul>
          </li>
          <li>
            <strong>Set Date Range</strong>:
            <ul>
              <li>Under <strong>Period</strong>, select <strong>Custom Date Range</strong></li>
              <li>Choose dates to cover all your trades</li>
            </ul>
          </li>
          <li>
            <strong>Download CSV File</strong>:
            <ul>
              <li>Set <strong>Format</strong> as <strong>CSV</strong></li>
              <li>Click <strong>Run</strong> and download your trades file</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="alert alert-info mt-3">
        <strong>Important:</strong> QFX files contain the most comprehensive data including corporate actions, dividends, and complete fee structures. Use CSV only if QFX import encounters issues.
      </div>
    </div>
  );
};
