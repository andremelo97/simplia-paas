import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Select, Label, FieldError, Modal, Badge } from '@client/common/ui';
import { ApplicationsService, ApplicationPricing as PricingType } from '../../../services/applications';
import { Application } from '../../../services/applications';
import { publishFeedback } from '@client/common/feedback/store';

interface PricingFormData {
  userTypeId: number;
  price: string;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  validFrom: string;
  validTo: string;
}

const userTypeOptions = [
  { value: 1, label: 'Operations' },
  { value: 2, label: 'Manager' },
  { value: 3, label: 'Administrator' }
];

const currencyOptions = [
  { value: 'BRL', label: 'Brazilian Real (R$)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' }
];

const billingCycleOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const statusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export function ApplicationPricing() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [pricing, setPricing] = useState<PricingType[]>([]);
  const [filteredPricing, setFilteredPricing] = useState<PricingType[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PricingFormData>({
    userTypeId: 1,
    price: '',
    currency: 'BRL',
    billingCycle: 'monthly',
    validFrom: new Date().toISOString().slice(0, 16), // datetime-local format
    validTo: ''
  });
  
  const [errors, setErrors] = useState<Partial<PricingFormData>>({});
  const [overlapError, setOverlapError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [applicationId]);

  useEffect(() => {
    filterPricing();
  }, [pricing, statusFilter]);

  const filterPricing = () => {
    let filtered = [...pricing];
    
    if (statusFilter === 'active') {
      filtered = filtered.filter(item => item.active === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(item => item.active === false);
    }
    
    setFilteredPricing(filtered);
  };

  const loadData = async () => {
    if (!applicationId) {
      navigate('/applications');
      return;
    }

    try {
      setLoading(true);
      const [appData, pricingData] = await Promise.all([
        ApplicationsService.getApplication(Number(applicationId)),
        ApplicationsService.getPricing(Number(applicationId), false) // false = load all pricing history, not just current
      ]);
      
      
      setApplication(appData);
      setPricing(pricingData);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      publishFeedback({
        kind: 'error',
        message: 'Failed to load application pricing data'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PricingFormData> = {};
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }
    
    if (formData.validTo && new Date(formData.validTo) <= new Date(formData.validFrom)) {
      newErrors.validTo = 'Valid to must be after valid from date';
    }

    // Check for overlapping periods
    const selectedUserType = formData.userTypeId;
    const newValidFrom = new Date(formData.validFrom);
    const newValidTo = formData.validTo ? new Date(formData.validTo) : null;
    
    console.log('🔍 [Validation] Checking overlap for:', {
      selectedUserType,
      newValidFrom,
      newValidTo,
      existingPricingForUserType: pricing.filter(p => p.userTypeId === selectedUserType).map(p => ({
        id: p.id,
        active: p.active,
        validFrom: p.validFrom,
        validTo: p.validTo
      }))
    });
    
    const hasOverlap = pricing.some(p => {
      if (p.userTypeId !== selectedUserType) return false;
      if (!p.active) {
        console.log('⏭️ [Validation] Skipping inactive pricing:', { id: p.id, active: p.active });
        return false; // Skip inactive pricing entries
      }
      
      const existingFrom = new Date(p.validFrom);
      const existingTo = p.validTo ? new Date(p.validTo) : null;
      
      console.log('🔍 [Validation] Checking overlap with active pricing:', {
        id: p.id,
        existingFrom,
        existingTo,
        newValidFrom,
        newValidTo
      });
      
      let overlaps = false;
      
      // Check if periods overlap using proper interval logic
      if (newValidTo && existingTo) {
        // Both have end dates: overlap if new starts before existing ends AND new ends after existing starts
        overlaps = newValidFrom < existingTo && newValidTo > existingFrom;
        console.log('📅 [Validation] Both have end dates:', { overlaps });
      } else if (newValidTo && !existingTo) {
        // New has end, existing is open: overlap if new ends after existing starts
        overlaps = newValidTo > existingFrom;
        console.log('📅 [Validation] New has end, existing is open:', { overlaps });
      } else if (!newValidTo && existingTo) {
        // New is open, existing has end: overlap if new starts before existing ends
        overlaps = newValidFrom < existingTo;
        console.log('📅 [Validation] New is open, existing has end:', { overlaps });
      } else {
        // Both are open-ended: always overlap
        overlaps = true;
        console.log('📅 [Validation] Both are open-ended:', { overlaps });
      }
      
      return overlaps;
    });
    
    if (hasOverlap) {
      newErrors.validFrom = 'Price period overlaps with existing pricing for this user type';
      console.log('⚠️ [Validation] Overlap detected - adding error to newErrors:', newErrors);
    }
    
    console.log('📋 [Validation] Final validation result:', { 
      hasErrors: Object.keys(newErrors).length > 0, 
      errors: newErrors 
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔧 [ApplicationPricing] Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('❌ [ApplicationPricing] Form validation failed');
      return;
    }
    
    // Clear any previous overlap errors
    setOverlapError(null);
    
    try {
      console.log('⚡ [ApplicationPricing] Starting pricing creation...');
      setSubmitting(true);
      
      await ApplicationsService.createPricing(Number(applicationId), {
        userTypeId: formData.userTypeId,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        validFrom: formData.validFrom,
        validTo: formData.validTo || undefined
      });
      
      setIsModalOpen(false);
      setFormData({
        userTypeId: 1,
        price: '',
        currency: 'BRL',
        billingCycle: 'monthly',
        validFrom: new Date().toISOString().slice(0, 16),
        validTo: ''
      });
      setErrors({});
      setOverlapError(null);
      
      // Reload pricing data
      await loadData();
      
      // Note: success feedback will be handled automatically by HTTP interceptor
      
    } catch (error: any) {
      console.error('Failed to create pricing:', error);
      
      // Handle 422 overlap errors - keep modal open with inline feedback
      if (error.code === 'PRICING_OVERLAP' && error.httpStatus === 422 && error.details?.conflict) {
        const conflict = error.details.conflict;
        setOverlapError(
          `Pricing period overlaps with existing period ${conflict.existingRange}. ` +
          `Please adjust your dates to avoid the conflict.`
        );
        // Don't close modal, don't show global feedback
        return;
      }
      
      // For other errors, show global feedback and close modal
      publishFeedback({
        kind: 'error',
        message: error.message || 'Failed to create pricing entry'
      });
      setIsModalOpen(false);
    } finally {
      console.log('🏁 [ApplicationPricing] Pricing creation finished, setting submitting to false');
      setSubmitting(false);
    }
  };

  const handleEndPricing = async (pricingId: string) => {
    try {
      await ApplicationsService.endPricing(Number(applicationId), pricingId);
      await loadData();
      
      // Note: success feedback will be handled automatically by HTTP interceptor
      
    } catch (error) {
      console.error('Failed to end pricing:', error);
      publishFeedback({
        kind: 'error',
        message: 'Failed to end pricing period'
      });
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';
    return `${symbol} ${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (active: boolean) => {
    if (active) {
      return <Badge variant="tertiary">Active</Badge>;
    } else {
      return <Badge variant="default">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pricing Matrix
          </h1>
          <p className="text-gray-600 mt-1">
            {application?.name} - Manage pricing by user type
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pricing Matrix</h2>
            <div className="flex items-center space-x-4">
              {/* Status Filter */}
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusFilterOptions}
                />
              </div>
              <Button 
                variant="default"
                onClick={() => setIsModalOpen(true)}
              >
                Schedule New Price
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing Cycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPricing.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {pricing.length === 0 
                        ? 'No pricing configured. Click "Schedule New Price" to get started.'
                        : `No pricing found matching your filters.`
                      }
                    </td>
                  </tr>
                ) : (
                  filteredPricing.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {item.userTypeName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(item.price, item.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.billingCycle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.validFrom)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.validTo ? formatDate(item.validTo) : 'Open-ended'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!item.validTo && item.active && (
                          <Button
                            onClick={() => handleEndPricing(item.id)}
                            variant="secondary"
                            size="sm"
                          >
                            End Period
                          </Button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      <Modal 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setOverlapError(null);
          setErrors({});
        }}
        title="Schedule New Price"
        description="Create a new pricing entry for this application"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {overlapError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4" role="alert" aria-live="assertive">
              <div className="text-sm text-red-800">
                <strong>Period Overlap:</strong> {overlapError}
              </div>
            </div>
          )}
            <div>
              <Label htmlFor="userTypeId">User Type</Label>
              <Select
                id="userTypeId"
                value={formData.userTypeId}
                onChange={(e) => setFormData(prev => ({ ...prev, userTypeId: Number(e.target.value) }))}
                options={userTypeOptions}
              />
              {errors.userTypeId && <FieldError message={errors.userTypeId} />}
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              />
              {errors.price && <FieldError message={errors.price} />}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                options={currencyOptions}
              />
              {errors.currency && <FieldError message={errors.currency} />}
            </div>

            <div>
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select
                id="billingCycle"
                value={formData.billingCycle}
                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value as 'monthly' | 'yearly' }))}
                options={billingCycleOptions}
              />
              {errors.billingCycle && <FieldError message={errors.billingCycle} />}
            </div>

            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
              />
              {errors.validFrom && <FieldError message={errors.validFrom} />}
            </div>

            <div>
              <Label htmlFor="validTo">Valid To (Optional)</Label>
              <Input
                id="validTo"
                type="datetime-local"
                value={formData.validTo}
                onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
              />
              <small className="text-gray-500 text-sm">Leave empty for open-ended pricing</small>
              {errors.validTo && <FieldError message={errors.validTo} />}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Pricing'}
              </Button>
            </div>
          </form>
      </Modal>
    </div>
  );
}