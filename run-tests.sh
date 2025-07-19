#!/bin/bash

echo "Running backend tests..."

# Run all tests
echo "Running all tests..."
npx vitest run

# Run tests with coverage
echo "Running tests with coverage..."
npx vitest run --coverage

# Generate coverage report
echo "Test coverage report generated in ./coverage/"