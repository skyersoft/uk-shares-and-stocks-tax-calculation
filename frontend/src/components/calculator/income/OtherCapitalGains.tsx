import React, { useState } from 'react';
import { OtherCapitalGainsData } from '../../../types/calculator';
import { Button } from '../../ui/Button';

interface OtherCapitalGainsProps {
  data: OtherCapitalGainsData;
  onChange: (data: OtherCapitalGainsData) => void;
}

export const OtherCapitalGains: React.FC<OtherCapitalGainsProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'property' | 'crypto' | 'other'>('property');

  const generateId = () => `gain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Property Gains Functions
  const addPropertyGain = () => {
    onChange({
      ...data,
      propertyGains: [
        ...data.propertyGains,
        {
          id: generateId(),
          description: '',
          acquisitionDate: '',
          disposalDate: '',
          acquisitionCost: 0,
          disposalProceeds: 0,
          improvementCosts: 0,
          sellingCosts: 0
        }
      ]
    });
  };

  const updatePropertyGain = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      propertyGains: data.propertyGains.map(gain =>
        gain.id === id ? { ...gain, [field]: value } : gain
      )
    });
  };

  const removePropertyGain = (id: string) => {
    onChange({
      ...data,
      propertyGains: data.propertyGains.filter(gain => gain.id !== id)
    });
  };

  const calculatePropertyGain = (gain: typeof data.propertyGains[0]) => {
    const totalCosts = gain.acquisitionCost + gain.improvementCosts + gain.sellingCosts;
    return gain.disposalProceeds - totalCosts;
  };

  // Crypto Gains Functions
  const addCryptoGain = () => {
    onChange({
      ...data,
      cryptoGains: [
        ...data.cryptoGains,
        {
          id: generateId(),
          asset: '',
          acquisitionDate: '',
          disposalDate: '',
          acquisitionCost: 0,
          disposalProceeds: 0
        }
      ]
    });
  };

  const updateCryptoGain = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      cryptoGains: data.cryptoGains.map(gain =>
        gain.id === id ? { ...gain, [field]: value } : gain
      )
    });
  };

  const removeCryptoGain = (id: string) => {
    onChange({
      ...data,
      cryptoGains: data.cryptoGains.filter(gain => gain.id !== id)
    });
  };

  const calculateCryptoGain = (gain: typeof data.cryptoGains[0]) => {
    return gain.disposalProceeds - gain.acquisitionCost;
  };

  // Other Gains Functions
  const addOtherGain = () => {
    onChange({
      ...data,
      otherGains: [
        ...data.otherGains,
        {
          id: generateId(),
          description: '',
          acquisitionDate: '',
          disposalDate: '',
          acquisitionCost: 0,
          disposalProceeds: 0,
          costs: 0
        }
      ]
    });
  };

  const updateOtherGain = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      otherGains: data.otherGains.map(gain =>
        gain.id === id ? { ...gain, [field]: value } : gain
      )
    });
  };

  const removeOtherGain = (id: string) => {
    onChange({
      ...data,
      otherGains: data.otherGains.filter(gain => gain.id !== id)
    });
  };

  const calculateOtherGain = (gain: typeof data.otherGains[0]) => {
    return gain.disposalProceeds - gain.acquisitionCost - gain.costs;
  };

  const totalPropertyGains = data.propertyGains.reduce((sum, g) => sum + calculatePropertyGain(g), 0);
  const totalCryptoGains = data.cryptoGains.reduce((sum, g) => sum + calculateCryptoGain(g), 0);
  const totalOtherGains = data.otherGains.reduce((sum, g) => sum + calculateOtherGain(g), 0);
  const allGains = totalPropertyGains + totalCryptoGains + totalOtherGains;

  return (
    <div className="other-capital-gains card border-dark">
      <div className="card-header bg-dark text-white">
        <h5 className="mb-0">
          <i className="fas fa-coins me-2"></i>
          Other Capital Gains
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Enter capital gains from non-portfolio sources like property sales, cryptocurrency,
          or other assets. These are separate from your share portfolio gains.
        </p>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'property' ? 'active' : ''}`}
              onClick={() => setActiveTab('property')}
            >
              <i className="fas fa-building me-2"></i>
              Property ({data.propertyGains.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'crypto' ? 'active' : ''}`}
              onClick={() => setActiveTab('crypto')}
            >
              <i className="fab fa-bitcoin me-2"></i>
              Crypto ({data.cryptoGains.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'other' ? 'active' : ''}`}
              onClick={() => setActiveTab('other')}
            >
              <i className="fas fa-box me-2"></i>
              Other ({data.otherGains.length})
            </button>
          </li>
        </ul>

        {/* Property Gains Tab */}
        {activeTab === 'property' && (
          <div className="tab-pane-property">
            {data.propertyGains.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-building text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted">No property disposals added yet</p>
                <Button variant="primary" onClick={addPropertyGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Property Disposal
                </Button>
              </div>
            ) : (
              <>
                {data.propertyGains.map((gain, index) => {
                  const gainAmount = calculatePropertyGain(gain);
                  return (
                    <div key={gain.id} className="card mb-3">
                      <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Property Disposal #{index + 1}</h6>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removePropertyGain(gain.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Property description (e.g., '123 High Street, London')"
                              value={gain.description}
                              onChange={(e) => updatePropertyGain(gain.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Acquisition Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.acquisitionDate}
                              onChange={(e) => updatePropertyGain(gain.id, 'acquisitionDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Disposal Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.disposalDate}
                              onChange={(e) => updatePropertyGain(gain.id, 'disposalDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Purchase Price</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.acquisitionCost || ''}
                                onChange={(e) => updatePropertyGain(gain.id, 'acquisitionCost', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Sale Price</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.disposalProceeds || ''}
                                onChange={(e) => updatePropertyGain(gain.id, 'disposalProceeds', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Improvement Costs</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.improvementCosts || ''}
                                onChange={(e) => updatePropertyGain(gain.id, 'improvementCosts', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Selling Costs</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.sellingCosts || ''}
                                onChange={(e) => updatePropertyGain(gain.id, 'sellingCosts', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className={`alert ${gainAmount >= 0 ? 'alert-success' : 'alert-danger'} mb-0`}>
                              <strong>Calculated Gain/Loss:</strong>{' '}
                              {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(gainAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline-primary" onClick={addPropertyGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Another Property
                </Button>
              </>
            )}
          </div>
        )}

        {/* Crypto Gains Tab */}
        {activeTab === 'crypto' && (
          <div className="tab-pane-crypto">
            {data.cryptoGains.length === 0 ? (
              <div className="text-center py-4">
                <i className="fab fa-bitcoin text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted">No cryptocurrency disposals added yet</p>
                <Button variant="primary" onClick={addCryptoGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Crypto Disposal
                </Button>
              </div>
            ) : (
              <>
                {data.cryptoGains.map((gain, index) => {
                  const gainAmount = calculateCryptoGain(gain);
                  return (
                    <div key={gain.id} className="card mb-3">
                      <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Crypto Disposal #{index + 1}</h6>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeCryptoGain(gain.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Asset (e.g., 'Bitcoin', 'Ethereum')"
                              value={gain.asset}
                              onChange={(e) => updateCryptoGain(gain.id, 'asset', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Purchase Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.acquisitionDate}
                              onChange={(e) => updateCryptoGain(gain.id, 'acquisitionDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Sale Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.disposalDate}
                              onChange={(e) => updateCryptoGain(gain.id, 'disposalDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Purchase Cost (GBP)</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.acquisitionCost || ''}
                                onChange={(e) => updateCryptoGain(gain.id, 'acquisitionCost', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Sale Proceeds (GBP)</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.disposalProceeds || ''}
                                onChange={(e) => updateCryptoGain(gain.id, 'disposalProceeds', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className={`alert ${gainAmount >= 0 ? 'alert-success' : 'alert-danger'} mb-0`}>
                              <strong>Calculated Gain/Loss:</strong>{' '}
                              {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(gainAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline-primary" onClick={addCryptoGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Another Crypto Asset
                </Button>
              </>
            )}
          </div>
        )}

        {/* Other Gains Tab - Similar structure */}
        {activeTab === 'other' && (
          <div className="tab-pane-other">
            {data.otherGains.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-box text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted">No other asset disposals added yet</p>
                <Button variant="primary" onClick={addOtherGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Asset Disposal
                </Button>
              </div>
            ) : (
              <>
                {data.otherGains.map((gain, index) => {
                  const gainAmount = calculateOtherGain(gain);
                  return (
                    <div key={gain.id} className="card mb-3">
                      <div className="card-header bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Asset Disposal #{index + 1}</h6>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeOtherGain(gain.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Asset description (e.g., 'Antique furniture', 'Artwork')"
                              value={gain.description}
                              onChange={(e) => updateOtherGain(gain.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Acquisition Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.acquisitionDate}
                              onChange={(e) => updateOtherGain(gain.id, 'acquisitionDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small">Disposal Date</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={gain.disposalDate}
                              onChange={(e) => updateOtherGain(gain.id, 'disposalDate', e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Purchase Cost</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.acquisitionCost || ''}
                                onChange={(e) => updateOtherGain(gain.id, 'acquisitionCost', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Sale Proceeds</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.disposalProceeds || ''}
                                onChange={(e) => updateOtherGain(gain.id, 'disposalProceeds', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Associated Costs</label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text">£</span>
                              <input
                                type="number"
                                className="form-control"
                                value={gain.costs || ''}
                                onChange={(e) => updateOtherGain(gain.id, 'costs', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <div className={`alert ${gainAmount >= 0 ? 'alert-success' : 'alert-danger'} mb-0`}>
                              <strong>Calculated Gain/Loss:</strong>{' '}
                              {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(gainAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline-primary" onClick={addOtherGain}>
                  <i className="fas fa-plus me-2"></i>
                  Add Another Asset
                </Button>
              </>
            )}
          </div>
        )}

        {/* Overall Summary */}
        {allGains !== 0 && (
          <div className="card bg-light border-0 mt-4">
            <div className="card-body">
              <h6 className="card-title">
                <i className="fas fa-calculator me-2"></i>
                Total Other Capital Gains
              </h6>
              <div className="row g-2">
                <div className="col-4">
                  <div className="small text-muted">Property</div>
                  <div className="fw-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totalPropertyGains)}</div>
                </div>
                <div className="col-4">
                  <div className="small text-muted">Crypto</div>
                  <div className="fw-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totalCryptoGains)}</div>
                </div>
                <div className="col-4">
                  <div className="small text-muted">Other</div>
                  <div className="fw-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(totalOtherGains)}</div>
                </div>
                <div className="col-12">
                  <hr />
                  <div className="small text-muted">Total Gains</div>
                  <div className={`fw-bold fs-5 ${allGains >= 0 ? 'text-success' : 'text-danger'}`}>
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(allGains)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="alert alert-warning mt-4 mb-0" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <small>
            <strong>Important:</strong> Property gains may be subject to higher CGT rates (18%/24% vs 10%/20% for other assets).
            Cryptocurrency and other asset disposals are taxed at standard CGT rates.
          </small>
        </div>
      </div>
    </div>
  );
};
