import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, Button, Input, Select, Label, FieldError, Modal } from '@client/common/ui';
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

export function ApplicationPricing() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [pricing, setPricing] = useState<PricingType[]>([]);
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

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const loadData = async () => {
    if (!applicationId) {
      navigate('/applications');
      return;
    }

    try {
      setLoading(true);
      const [appData, pricingData] = await Promise.all([
        ApplicationsService.getApplication(Number(applicationId)),
        ApplicationsService.getPricing(Number(applicationId))
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
    
    const hasOverlap = pricing.some(p => {
      if (p.userTypeId !== selectedUserType) return false;
      
      const existingFrom = new Date(p.validFrom);
      const existingTo = p.validTo ? new Date(p.validTo) : null;
      
      // Check if periods overlap
      if (newValidTo && existingTo) {
        return newValidFrom < existingTo && newValidTo > existingFrom;
      } else if (newValidTo && !existingTo) {
        return newValidFrom < existingFrom || newValidTo > existingFrom;
      } else if (!newValidTo && existingTo) {
        return newValidFrom < existingTo;
      } else {
        return true; // Both open-ended, always overlap
      }
    });
    
    if (hasOverlap) {
      newErrors.validFrom = 'Price period overlaps with existing pricing for this user type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
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
      
      // Reload pricing data
      await loadData();
      
      publishFeedback({
        kind: 'success',
        message: 'Pricing created successfully'
      });
      
    } catch (error) {
      console.error('Failed to create pricing:', error);
      publishFeedback({
        kind: 'error',
        message: 'Failed to create pricing entry'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndPricing = async (pricingId: string) => {
    try {
      const now = new Date().toISOString();
      await ApplicationsService.updatePricing(Number(applicationId), pricingId, {
        validTo: now
      });
      
      await loadData();
      
      publishFeedback({
        kind: 'success',
        message: 'Pricing period ended successfully'
      });
      
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
            <h2 className="text-lg font-semibold text-gray-900">Current Pricing</h2>
            <Button 
              variant="default"
              onClick={() => setIsModalOpen(true)}
            >
              Schedule New Price
            </Button>
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
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricing.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No pricing configured. Click "Schedule New Price" to get started.
                    </td>
                  </tr>
                ) : (
                  pricing.map((item) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!item.validTo && (
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
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Price"
        description="Create a new pricing entry for this application"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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