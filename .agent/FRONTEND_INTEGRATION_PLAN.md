# Multi-Broker CSV Support - Frontend Integration Plan

## Status: In Progress

### Phase 1: Backend API Enhancement ✅

**Objective:** Update Lambda handler to support multi-broker CSV detection and provide detailed feedback to frontend.

#### Changes Required:

1. **Update `deployment/lambda_handler.py`:**
   - Import `ConverterFactory` and `MultiBrokerParser`
   - Add broker detection logic before processing
   - Return broker detection metadata in response
   - Add `/detect-broker` endpoint for file preview

2. **Response Format Enhancement:**
   ```json
   {
     "results": { ... },
     "metadata": {
       "broker_detected": "Trading 212",
       "confidence": 1.0,
       "file_type": "csv",
       "transaction_count": 45,
       "date_range": {
         "start": "2024-01-01",
         "end": "2024-12-31"
       }
     }
   }
   ```

3. **Error Handling:**
   - Broker not detected (confidence < 0.5)
   - Invalid file format
   - Missing required columns (broker-specific)

#### Implementation Steps:

- [ ] Update imports in `lambda_handler.py`
- [ ] Add `detect_broker_from_file()` helper function
- [ ] Modify `handle_calculation_request()` to use `ConverterFactory`
- [ ] Add broker metadata to response
- [ ] Add `/detect-broker` preview endpoint
- [ ] Test with IBKR and Trading 212 files

---

### Phase 2: Frontend UI Enhancement

**Objective:** Display broker detection and validation feedback in the UI.

#### Components to Update:

1. **`MultiFileUpload.tsx`:**
   - Add broker detection indicator
   - Show confidence badge
   - Display validation status

2. **`UploadDetailsStep.tsx`:**
   - Show detected broker for each file
   - Add validation preview section
   - Display transaction count and date range

3. **New Component: `BrokerDetectionBadge.tsx`:**
   ```tsx
   interface Props {
     broker: string;
     confidence: number;
     status: 'detecting' | 'detected' | 'error';
   }
   ```

4. **New Component: `FileValidationPreview.tsx`:**
   - Show parsed transaction summary
   - Display any warnings or issues
   - Allow user to confirm before submission

#### UI Mockup:

```
┌─────────────────────────────────────────────────┐
│ 📄 trades.csv (2.3 MB)                          │
│                                                 │
│ ✅ Trading 212  [Confidence: 100%]              │
│ 📊 45 transactions (Jan 2024 - Dec 2024)        │
│                                                 │
│ [Preview Transactions] [Remove]                 │
└─────────────────────────────────────────────────┘
```

---

### Phase 3: Enhanced User Experience

**Objective:** Provide comprehensive guidance and support for users.

#### Features:

1. **Broker-Specific Instructions:**
   - How to export from each broker
   - Required columns for each format
   - Common issues and solutions

2. **Sample Files:**
   - Downloadable sample CSV for each broker
   - Example data with annotations

3. **Validation Feedback:**
   - Real-time file validation
   - Helpful error messages
   - Suggestions for fixing issues

4. **Help Documentation:**
   - Update help page with multi-broker support
   - Add FAQ section
   - Video tutorials (future)

---

## Timeline

- **Phase 1:** 2-3 hours (Backend updates)
- **Phase 2:** 3-4 hours (Frontend UI)
- **Phase 3:** 2-3 hours (UX enhancements)

**Total Estimated Time:** 7-10 hours

---

## Testing Checklist

### Backend:
- [ ] IBKR CSV file detection
- [ ] Trading 212 CSV file detection
- [ ] QFX file handling (backward compatibility)
- [ ] Invalid file rejection
- [ ] Error response formatting

### Frontend:
- [ ] File upload with broker detection
- [ ] Confidence badge display
- [ ] Validation preview
- [ ] Error message display
- [ ] Multiple file handling

### Integration:
- [ ] End-to-end flow with IBKR file
- [ ] End-to-end flow with Trading 212 file
- [ ] Mixed broker files (IBKR + Trading 212)
- [ ] QFX file (legacy flow)

---

## Next Steps

1. ✅ Complete Trading 212 converter implementation
2. 🔄 **Current:** Update Lambda handler for multi-broker support
3. ⏳ Add broker detection UI components
4. ⏳ Implement validation preview
5. ⏳ Add user guidance and documentation

