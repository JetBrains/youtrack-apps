---
to: src/widgets/enhanced-dx/app.css
---
.widget {
  display: flex;
  flex-direction: column;
  gap: calc(var(--ring-unit) * 2);
  margin: calc(var(--ring-unit) / 2);
}

.demo-widget {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.demo-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.demo-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.demo-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.demo-section {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  transition: box-shadow 0.2s ease;
  overflow: hidden;
  box-sizing: border-box;
}

.demo-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-section h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.demo-section p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.input-group .ring-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.input-group input {
  margin-bottom: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.demo-response {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.response-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.response-code {
  max-height: 400px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  padding: 16px 20px;
  background: #f8f9fa;
  border: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Ring UI overrides for better integration */
.ring-button {
  min-width: 120px;
}

.ring-input {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.ring-input input {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Ensure Ring UI input containers don't overflow */
.demo-section .ring-input-container {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Validation test card styling */
.validation-test {
  background: #fff5f5 !important;
  border-color: #fed7d7 !important;
}

.validation-test:hover {
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15) !important;
}

.validation-test h3 {
  color: #dc2626 !important;
}

.validation-details {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0;
}

.validation-details small {
  color: #7f1d1d;
  line-height: 1.5;
}

.validation-button {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

.validation-button:hover {
  background-color: #b91c1c !important;
  border-color: #b91c1c !important;
}

/* Responsive design */
@media (max-width: 1200px) {
  .demo-controls {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .demo-widget {
    padding: 16px;
  }

  .demo-controls {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .demo-section {
    padding: 16px;
  }
}
