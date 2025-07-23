import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { membershipAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  duration: number;
  features: string[];
  isPopular?: boolean;
}

interface UserMembership {
  id: number;
  userId: number;
  planId: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  plan: MembershipPlan;
}

interface MembershipContextType {
  membershipPlans: MembershipPlan[];
  userMembership: UserMembership | null;
  isLoading: boolean;
  hasActiveMembership: boolean;
  loadMembershipPlans: () => Promise<void>;
  loadUserMembership: () => Promise<void>;
  purchaseMembership: (planId: number) => Promise<{ success: boolean; message: string }>;
  cancelMembership: () => Promise<{ success: boolean; message: string }>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

interface MembershipProviderProps {
  children: ReactNode;
}

export const MembershipProvider: React.FC<MembershipProviderProps> = ({ children }) => {
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  const hasActiveMembership = userMembership?.status === 'active';

  // Load membership plans on mount
  useEffect(() => {
    loadMembershipPlans();
  }, []);

  // Load user membership when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserMembership();
    } else {
      setUserMembership(null);
    }
  }, [isAuthenticated, user]);

  const loadMembershipPlans = async () => {
    try {
      setIsLoading(true);
      const response = await membershipAPI.getPlans();
      
      if (response.success && response.plans) {
        setMembershipPlans(response.plans);
      }
    } catch (error) {
      console.error('Error loading membership plans:', error);
      // Set default plans if API fails
      setMembershipPlans([
        {
          id: 1,
          name: 'Basic Fortune Reading',
          price: 29.99,
          duration: 30,
          features: [
            'Basic fortune reading',
            'Daily horoscope',
            'Email support'
          ]
        },
        {
          id: 2,
          name: 'Premium Destiny Analysis',
          price: 59.99,
          duration: 90,
          features: [
            'Comprehensive destiny analysis',
            'Personalized fortune reports',
            'Monthly consultations',
            'Priority support'
          ],
          isPopular: true
        },
        {
          id: 3,
          name: 'Master Fortune Package',
          price: 99.99,
          duration: 365,
          features: [
            'Complete life path analysis',
            'Unlimited consultations',
            'Custom fortune reports',
            'VIP support',
            'Exclusive content'
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserMembership = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await membershipAPI.getUserMembership();
      
      if (response.success && response.membership) {
        setUserMembership(response.membership);
      } else {
        setUserMembership(null);
      }
    } catch (error) {
      console.error('Error loading user membership:', error);
      setUserMembership(null);
    }
  };

  const purchaseMembership = async (planId: number) => {
    if (!isAuthenticated) {
      return {
        success: false,
        message: 'Please login to purchase membership'
      };
    }

    try {
      const response = await membershipAPI.purchasePlan(planId);
      
      if (response.success) {
        // Reload user membership after successful purchase
        await loadUserMembership();
      }
      
      return response;
    } catch (error) {
      console.error('Error purchasing membership:', error);
      return {
        success: false,
        message: 'Failed to purchase membership. Please try again.'
      };
    }
  };

  const cancelMembership = async () => {
    if (!userMembership) {
      return {
        success: false,
        message: 'No active membership to cancel'
      };
    }

    try {
      const response = await membershipAPI.cancelMembership();
      
      if (response.success) {
        // Reload user membership after cancellation
        await loadUserMembership();
      }
      
      return response;
    } catch (error) {
      console.error('Error cancelling membership:', error);
      return {
        success: false,
        message: 'Failed to cancel membership. Please try again.'
      };
    }
  };

  const value: MembershipContextType = {
    membershipPlans,
    userMembership,
    isLoading,
    hasActiveMembership,
    loadMembershipPlans,
    loadUserMembership,
    purchaseMembership,
    cancelMembership
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};

export const useMembership = (): MembershipContextType => {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};

export default MembershipContext;
