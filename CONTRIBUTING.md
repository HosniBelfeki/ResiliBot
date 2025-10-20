# Contributing to ResiliBot

Thank you for your interest in contributing to ResiliBot! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/resilibot.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

```bash
# Install dependencies
cd infrastructure && npm install
cd ../frontend && npm install

# Run tests
cd backend && pytest tests/

# Deploy to dev environment
cd infrastructure && cdk deploy --all --profile dev
```

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Add docstrings for functions
- Maximum line length: 100 characters

### TypeScript/JavaScript
- Use ESLint configuration
- Prefer const over let
- Use async/await over promises
- Add JSDoc comments

### React
- Functional components with hooks
- PropTypes for type checking
- CSS modules for styling

## Testing

### Unit Tests
```bash
cd backend
pytest tests/unit/
```

### Integration Tests
```bash
cd backend
pytest tests/integration/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Pull Request Guidelines

1. **Title**: Clear, descriptive title
2. **Description**: Explain what and why
3. **Tests**: Include tests for new features
4. **Documentation**: Update docs if needed
5. **Changelog**: Add entry to CHANGELOG.md

## Commit Messages

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example: `feat(agent): add retry logic for Bedrock API calls`

## Reporting Issues

When reporting issues, include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (AWS region, Node version, etc.)
- Logs or error messages

## Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Describe the use case
- Explain the expected behavior
- Consider implementation approach

## Code Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review comments
4. Squash commits before merge

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Follow the Code of Conduct

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue or reach out to the maintainers.

Thank you for contributing! 🚀
