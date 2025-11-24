# 📚 IBKR Tax Calculator Documentation

Complete documentation for the UK Capital Gains Tax Calculator project.

## 🚀 Quick Start

- **New Contributors**: Start with [CONTRIBUTING.md](CONTRIBUTING.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)

## 📖 Documentation Index

### Getting Started
- [**CONTRIBUTING.md**](CONTRIBUTING.md) - Developer guide, setup, and workflow
- [**ARCHITECTURE.md**](ARCHITECTURE.md) - System architecture and design decisions

### Deployment & Operations
- [**DEPLOYMENT.md**](DEPLOYMENT.md) - AWS deployment guide (Terraform)
- [**TESTING.md**](TESTING.md) - Testing guide and best practices

### Reference Documentation
- [**TAX_REFERENCE.md**](TAX_REFERENCE.md) - UK tax rules and calculations
- [**UK_TAX_CALCULATION_REQUIREMENTS.md**](UK_TAX_CALCULATION_REQUIREMENTS.md) - Tax calculation requirements
- [**STANDARD_CSV_FORMAT.md**](STANDARD_CSV_FORMAT.md) - Internal CSV format specification
- [**IBKR_QFX_GUIDE.md**](IBKR_QFX_GUIDE.md) - How to generate QFX files from Interactive Brokers

### Historical Reference
- [**archive/PROJECT_PLAN.md**](archive/PROJECT_PLAN.md) - Original comprehensive project plan

## 🎯 Common Tasks

### Running the Application

**CLI Mode**:
```bash
conda activate ibkr-tax
python run_calculator.py --input data/file.qfx --tax-year 2024-2025
```

**Local Development**:
```bash
docker-compose up -d
sh run-local-dev.sh
```

**Frontend Development**:
```bash
cd frontend
npm run dev
```

### Testing

**Python Tests**:
```bash
pytest
pytest --cov=src --cov-report=html
```

**Frontend Tests**:
```bash
cd frontend
npm run test:unit  # Jest
npm run test       # Playwright E2E
```

### Deployment

**Backend**:
```bash
./deployment/01-package.sh
./deployment/terraform-deploy.sh
```

**Frontend**:
```bash
cd frontend && npm run build
aws s3 sync dist/ s3://bucket-name/ --profile goker
aws cloudfront create-invalidation --distribution-id E3CPZK9XL7GR6Q --paths "/*" --profile goker
```

## 🏗️ Project Structure

```
ibkr-tax-calculator/
├── src/                    # Python backend
├── frontend/               # React SPA
├── deployment/             # Terraform & scripts
├── tests/                  # Test suite
├── data/                   # Test data
└── docs/                   # Documentation (you are here)
```

## 🔗 External Resources

- **Live Website**: https://cgttaxtool.uk
- **HMRC Tax Guide**: https://www.gov.uk/capital-gains-tax
- **AWS Documentation**: https://docs.aws.amazon.com/
- **React Docs**: https://react.dev/

## 📝 Documentation Maintenance

This documentation was consolidated on 2025-11-20 from 26 separate files into a more organized structure.

If you need to update documentation:
1. Edit the relevant file in `docs/`
2. Keep documentation concise and up-to-date
3. Remove obsolete information
4. Update this index if adding new docs

---

*Last Updated: 2025-11-20*
