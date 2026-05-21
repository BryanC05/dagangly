# Test CI/CD

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) pipelines for the MSME Marketplace.

## GitHub Actions Workflow Template

To automate testing and linting, create a file at `.github/workflows/ci.yml` in your repository and paste the following configuration. This workflow will run tests for both the Go backend and the Node.js frontend/mobile app on every push and pull request to the `main` branch.

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    name: Test Go Backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '1.24.0'
        cache-dependency-path: backend/go.sum

    - name: Install dependencies
      run: go mod download

    - name: Run Go Vet & Lint
      run: |
        go vet ./...
        # Requires golangci-lint installed
        # golangci-lint run

    - name: Run Tests
      run: go test -v -race -cover ./...

  frontend-mobile-test:
    name: Test Frontend & Mobile
    runs-on: ubuntu-latest
    strategy:
      matrix:
        directory: [frontend, mobile]
    
    defaults:
      run:
        working-directory: ./${{ matrix.directory }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: ./${{ matrix.directory }}/package-lock.json

    - name: Install dependencies
      run: npm ci

    - name: Run Linter
      run: npm run lint --if-present

    - name: Run Tests
      run: npm run test --if-present
```

## Next Steps for Deployment
- **Docker Images**: Set up a `cd.yml` workflow to automatically build and push the backend Docker image to a registry (e.g., Docker Hub, GHCR) upon release tags.
- **Mobile Build**: Integrate EAS Build directly into the GitHub Action for seamless APK/AAB generation when code is merged.
