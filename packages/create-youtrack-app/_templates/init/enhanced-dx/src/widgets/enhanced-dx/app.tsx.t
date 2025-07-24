---
to: src/widgets/enhanced-dx/app.tsx
---
import React, {memo, useCallback, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import {Input, Size} from '@jetbrains/ring-ui-built/components/input/input';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import {createApi} from "@/api";
import {createComponentLogger} from "@/common/utils/logger.ts";

const host = await YTApp.register();
const api = createApi(host);
const logger = createComponentLogger("app");

const AppComponent: React.FunctionComponent = () => {
  const [response, setResponse] = useState<string>('Click a button to test the API...');
  const [loading, setLoading] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<string>('DEM');

  const callGlobalApi = useCallback(async () => {
    setLoading(true);
    try {
      const global = await api.global.demo.GET();
      logger.debug(`Global:`, {action: 'fetching global endpoint'}, global);
      setResponse(JSON.stringify(global, null, 2));
    } catch (error) {
      logger.error('Global API call failed:', {}, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);


  const callProjectApi = useCallback(async () => {
    setLoading(true);
    try {
      const projectDemo = await api.project.demo.GET({
        projectId: projectId,
        message: "Hello from React!"
      });
      logger.debug(`Project:`, {action: 'fetching project endpoint'}, projectDemo);
      setResponse(JSON.stringify(projectDemo, null, 2));
    } catch (error) {
      logger.error('Project API call failed (is there a project attached?):', {}, error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);


  const testValidation = useCallback(async () => {
    setLoading(true);
    try {
      // Test with completely invalid data to trigger Zod validation
      const invalidData = {
        projectId: 123,                           //  Number instead of string
        message: ["invalid", "array"],            //  Array instead of string
      } as any;

      const invalidResponse = await api.project.demo.GET(invalidData);
      logger.debug('Validation test result:', {action: 'validation-test'}, invalidResponse);
      setResponse(JSON.stringify(invalidResponse, null, 2));
    } catch (error) {
      logger.error('Validation error (this is expected!):', {}, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      const errorResponse = {
        validationError: true,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        testData: {
          projectId: 123,
          message: ["invalid", "array"],
          nonExistentField: true,
          anotherBadField: { nested: "object" }
        }
      };

      setResponse(JSON.stringify(errorResponse, null, 2));
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
            <h3>Global API</h3>
            <p>Health check endpoint</p>
            <Button
                primary
                onClick={callGlobalApi}
                disabled={loading}
            >
              Test Global API
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
            <p>Check out console log for schema validation.</p>
            <div className="validation-details">
              <small>
                <strong>Will send:</strong><br/>
                • projectId: 123 (number instead of string)<br/>
                • message: ["array"] (array instead of string)<br/>
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
            {loading && <LoaderInline />}
          </div>
          <pre className="response-code">
          {response}
        </pre>
        </div>
      </div>
  );
};

export const App = memo(AppComponent);
