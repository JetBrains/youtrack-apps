mkdir -p ./tmp
npm run start -- --name test --type js --title Test --description test --vendor TestUser --vendor-url http://test.com --no-install
npm run widget -- --key test-widget --name 'Test Widget' --extension-point ISSUE_BELOW_SUMMARY --description test
npm run widget -- --key test-widget2222 --name 'Test Widget2222' --extension-point ISSUE_ABOVE_ACTIVITY_STREAM --description test22222
