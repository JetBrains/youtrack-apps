---
to: src/widgets/enhanced-dx/app.tsx
---
import React, {memo, useCallback, useState, useEffect} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import {Input, Size} from '@jetbrains/ring-ui-built/components/input/input';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import {createApi} from "@/api";
import {createComponentLogger} from "@/common/utils/logger.ts";

const host = await YTApp.register();
const api = createApi(host);
const logger = createComponentLogger("app");

const formatJson = (data: unknown) => JSON.stringify(data, null, 2);

const AppComponent: React.FunctionComponent = () => {
  const [response, setResponse] = useState<string>('Click a button to test the API...');
  const [loading, setLoading] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('DEMO');

  const callGlobalApi = useCallback(async () => {
    setLoading(true);
    try {
      const global = await api.global.demo.GET();
      logger.debug(`Global:`, {action: 'fetching global endpoint'}, global);
      setResponse(formatJson(global));
    } catch (error) {
      logger.error('Global API call failed:', {}, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    callGlobalApi();
  }, [callGlobalApi]);

  const callEchoApi = useCallback(async () => {
    setLoading(true);
    try {
      const echoResult = await api.global.echo.POST({
        message: "Hello from Enhanced DX!",
        metadata: { timestamp: Date.now(), widget: 'enhanced-dx' }
      });
      logger.debug('Echo:', {action: 'testing POST handler'}, echoResult);
      setResponse(formatJson(echoResult));
    } catch (error) {
      logger.error('Echo API call failed:', {}, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const callProjectApi = useCallback(async () => {
    setLoading(true);
    try {
      const projectDemo = await api.project.demo.GET({
        projectId,
        message: "Hello from React!"
      });
      logger.debug(`Project:`, {action: 'fetching project endpoint'}, projectDemo);
      setResponse(formatJson(projectDemo));
    } catch (error) {
      logger.error('Project API call failed (is there a project attached?):', {}, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const testValidation = useCallback(async () => {
    setLoading(true);
    const invalidTestData = {
      message: 123,
      metadata: "invalid string",
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentionally invalid data to test Zod validation
      const invalidResponse = await api.global.echo.POST(invalidTestData as any);
      logger.debug('Validation test result:', {action: 'validation-test'}, invalidResponse);
      setResponse(formatJson(invalidResponse));
    } catch (error) {
      logger.error('Validation error (this is expected!):', {}, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      const errorResponse = {
        validationError: true,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        note: 'Zod validation caught invalid types at runtime',
        testData: invalidTestData,
      };

      setResponse(formatJson(errorResponse));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="demo-widget">
      <div className="demo-header">
        <h2>YouTrack Enhanced DX Demo</h2>
      </div>

      <div className="demo-controls">
        <div className="demo-section">
          <h3>Global API (GET)</h3>
          <p>Health check endpoint - demonstrates global scope handlers</p>
          <Button
            primary
            onClick={callGlobalApi}
            disabled={loading}
          >
            Test Health Check
          </Button>
        </div>

        <div className="demo-section">
          <h3>Global API (POST)</h3>
          <p>Echo endpoint - demonstrates POST handler with body</p>
          <Button
            primary
            onClick={callEchoApi}
            disabled={loading}
          >
            Test Echo API
          </Button>
        </div>

        <div className="demo-section">
          <h3>Project API</h3>
          <p>Project-scoped endpoint with project context</p>
          <div className="input-group">
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Project ID (e.g., DEM)"
              label="Project ID:"
              size={Size.S}
            />
            <Button
              primary
              onClick={callProjectApi}
              disabled={loading || !projectId}
            >
              Test Project API
            </Button>
          </div>
        </div>

        <div className="demo-section validation-test">
          <h3>Validation Test</h3>
          <p>Send invalid data to test runtime Zod validation</p>
          <p>Check browser console for detailed validation errors.</p>
          <div className="validation-details">
            <small>
              <strong>Will send:</strong><br/>
              {'\u2022 message: 123 (number instead of string)'}<br/>
              {'\u2022 metadata: "string" (string instead of object)'}<br/>
            </small>
          </div>
          <Button
            onClick={testValidation}
            disabled={loading}
          >
            Test Validation Error
          </Button>
        </div>
      </div>

      <div className="demo-response">
        <div className="response-header">
          <h3>API Response</h3>
          {loading && <LoaderInline/>}
        </div>
        <pre className="response-code">
          {response}
        </pre>
      </div>
    </div>
  );
};

export const App = memo(AppComponent);
