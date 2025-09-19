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
  active: boolean;
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
    active: true
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
        active: true
      });
      
      setIsModalOpen(false);
      setFormData({
        userTypeId: 1,
        price: '',
        currency: 'BRL',
        billingCycle: 'monthly',
        active: true
      });
      setErrors({});
      setOverlapError(null);
      
      // Reload pricing data
      await loadData();
      
      // Note: success feedback will be handled automatically by HTTP interceptor
      
    } catch (error: any) {
      console.error('Failed to create pricing:', error);

      // Handle 422 duplicate errors - keep modal open with inline feedback
      if (error.code === 'PRICING_DUPLICATE' && error.httpStatus === 422) {
        setOverlapError('Pricing already exists for this combination. Please choose different values.');
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

  const handleToggleActive = async (pricingId: string, newActiveState: boolean) => {
    try {
      await ApplicationsService.updatePricing(Number(applicationId), pricingId, {
        active: newActiveState
      });
      await loadData();

      // Note: success feedback will be handled automatically by HTTP interceptor

    } catch (error) {
      console.error('Failed to update pricing status:', error);
      publishFeedback({
        kind: 'error',
        message: 'Failed to update pricing status'
      });
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€';
    return `${symbol} ${parseFloat(price).toFixed(2)}`;
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
                Add New Price
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
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {pricing.length === 0
                        ? 'No pricing configured. Click "Add New Price" to get started.'
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          onClick={() => handleToggleActive(item.id, !item.active)}
                          variant={item.active ? "secondary" : "default"}
                          size="sm"
                        >
                          {item.active ? 'Deactivate' : 'Activate'}
                        </Button>
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
        title="Add New Price"
        description="Create a new pricing entry for this application"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {overlapError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4" role="alert" aria-live="assertive">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {overlapError}
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