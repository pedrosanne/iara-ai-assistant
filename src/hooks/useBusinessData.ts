
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BusinessProfile, Product, Policy, Promotion, AIConfig } from '@/contexts/AuthContext';

export const useBusinessData = () => {
  const { user, businessProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessProfile) {
      fetchAllData();
    }
  }, [businessProfile]);

  const fetchAllData = async () => {
    if (!businessProfile) return;
    
    setLoading(true);
    try {
      const [productsRes, policiesRes, promotionsRes, aiConfigRes] = await Promise.all([
        supabase.from('products').select('*').eq('business_id', businessProfile.id).eq('active', true),
        supabase.from('policies').select('*').eq('business_id', businessProfile.id).eq('active', true),
        supabase.from('promotions').select('*').eq('business_id', businessProfile.id).eq('active', true),
        supabase.from('ai_configs').select('*').eq('business_id', businessProfile.id).single()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      
      if (policiesRes.data) {
        // Type assertion for policies from database
        const typedPolicies: Policy[] = policiesRes.data.map(p => ({
          ...p,
          type: p.type as 'delivery' | 'exchange' | 'payment' | 'warranty' | 'general'
        }));
        setPolicies(typedPolicies);
      }
      
      if (promotionsRes.data) setPromotions(promotionsRes.data);
      
      if (aiConfigRes.data) {
        // Type assertion for AI config from database
        const typedAiConfig: AIConfig = {
          ...aiConfigRes.data,
          response_style: aiConfigRes.data.response_style as 'concise' | 'balanced' | 'detailed'
        };
        setAiConfig(typedAiConfig);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (product: Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!businessProfile) return null;

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, business_id: businessProfile.id }])
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => [...prev, data]);
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
    
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createPolicy = async (policy: Omit<Policy, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!businessProfile) return null;

    const { data, error } = await supabase
      .from('policies')
      .insert([{ ...policy, business_id: businessProfile.id }])
      .select()
      .single();

    if (error) throw error;
    
    const typedPolicy: Policy = {
      ...data,
      type: data.type as 'delivery' | 'exchange' | 'payment' | 'warranty' | 'general'
    };
    setPolicies(prev => [...prev, typedPolicy]);
    return typedPolicy;
  };

  const updatePolicy = async (id: string, updates: Partial<Policy>) => {
    const { data, error } = await supabase
      .from('policies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const typedPolicy: Policy = {
      ...data,
      type: data.type as 'delivery' | 'exchange' | 'payment' | 'warranty' | 'general'
    };
    setPolicies(prev => prev.map(p => p.id === id ? typedPolicy : p));
    return typedPolicy;
  };

  const deletePolicy = async (id: string) => {
    const { error } = await supabase
      .from('policies')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
    
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  const createPromotion = async (promotion: Omit<Promotion, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!businessProfile) return null;

    const { data, error } = await supabase
      .from('promotions')
      .insert([{ ...promotion, business_id: businessProfile.id }])
      .select()
      .single();

    if (error) throw error;
    
    setPromotions(prev => [...prev, data]);
    return data;
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setPromotions(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase
      .from('promotions')
      .update({ active: false })
      .eq('id', id);

    if (error) throw error;
    
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const updateAIConfig = async (updates: Partial<AIConfig>) => {
    if (!businessProfile) return null;

    if (aiConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('ai_configs')
        .update(updates)
        .eq('id', aiConfig.id)
        .select()
        .single();

      if (error) throw error;
      
      const typedConfig: AIConfig = {
        ...data,
        response_style: data.response_style as 'concise' | 'balanced' | 'detailed'
      };
      setAiConfig(typedConfig);
      return typedConfig;
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('ai_configs')
        .insert([{ ...updates, business_id: businessProfile.id }])
        .select()
        .single();

      if (error) throw error;
      
      const typedConfig: AIConfig = {
        ...data,
        response_style: data.response_style as 'concise' | 'balanced' | 'detailed'
      };
      setAiConfig(typedConfig);
      return typedConfig;
    }
  };

  return {
    products,
    policies,
    promotions,
    aiConfig,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    createPolicy,
    updatePolicy,
    deletePolicy,
    createPromotion,
    updatePromotion,
    deletePromotion,
    updateAIConfig,
    refreshData: fetchAllData
  };
};
