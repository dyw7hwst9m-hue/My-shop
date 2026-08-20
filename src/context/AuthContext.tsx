import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerProfile, UserRole } from '../types';
import {
  getCustomersService,
  saveCustomerProfileService,
  uploadImageService,
} from '../firebase/services';
import { initFirebase } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: CustomerProfile | null;
  role: UserRole; // Active view role ('customer' | 'owner')
  isOwner: boolean; // Does the user have store owner privileges?
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  signUpCustomer: (data: {
    email: string;
    password?: string;
    nickname: string;
    age: number;
    birthDate?: string;
    facePhoto?: File | string;
    phone?: string;
    address?: string;
    isOwner?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsOwner: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  toggleRole: () => void;
  grantOwnerPermission: (isOwnerPermission: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<CustomerProfile>, newFacePhoto?: File | string) => Promise<void>;
}

export const OWNER_EMAIL = 'thitapornmukji@gmail.com';
const AUTH_STORAGE_KEY = 'my_shop_auth_session_user';
const ROLE_STORAGE_KEY = 'my_shop_auth_role';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Helper to check if a profile has owner privileges
  const checkHasOwnerPrivilege = (user: CustomerProfile | null): boolean => {
    if (!user) return false;
    if (user.email && user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
    if (user.isOwner === true) return true;
    if (user.roles && user.roles.includes('owner')) return true;
    return false;
  };

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const { auth, isConfigured } = initFirebase();

      if (isConfigured && auth) {
        onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser && fbUser.email) {
            const emailLower = fbUser.email.toLowerCase();
            const customers = await getCustomersService();
            let matched = customers.find((c) => c.email.toLowerCase() === emailLower || c.id === fbUser.uid);

            const isEmailOwner = emailLower === OWNER_EMAIL.toLowerCase();

            if (matched) {
              if (isEmailOwner && (!matched.isOwner || !matched.roles?.includes('owner'))) {
                matched = {
                  ...matched,
                  isOwner: true,
                  roles: ['customer', 'owner'],
                };
                await saveCustomerProfileService(matched);
              }
              const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
              const hasOwner = checkHasOwnerPrivilege(matched);
              const effectiveRole: UserRole = savedRole || (hasOwner ? 'owner' : 'customer');
              saveSession(matched, effectiveRole);
            } else {
              // Create unified profile in Firestore
              const newProfile: CustomerProfile = {
                id: fbUser.uid,
                email: emailLower,
                nickname: fbUser.displayName || (isEmailOwner ? 'เจ้าของร้าน' : 'ลูกค้า'),
                age: 28,
                createdAt: new Date().toISOString(),
                orderCount: 0,
                totalSpent: 0,
                status: 'active',
                isOwner: isEmailOwner,
                roles: isEmailOwner ? ['customer', 'owner'] : ['customer'],
              };
              await saveCustomerProfileService(newProfile);
              saveSession(newProfile, isEmailOwner ? 'owner' : 'customer');
            }
          } else {
            restoreLocalSession();
          }
          setIsLoading(false);
        });
      } else {
        restoreLocalSession();
        setIsLoading(false);
      }
    }

    function restoreLocalSession() {
      try {
        const savedUserJson = localStorage.getItem(AUTH_STORAGE_KEY);
        const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
        if (savedUserJson) {
          const user: CustomerProfile = JSON.parse(savedUserJson);
          const hasOwner = checkHasOwnerPrivilege(user);
          // ensure consistent owner flags
          if (hasOwner) {
            user.isOwner = true;
            if (!user.roles) user.roles = ['customer', 'owner'];
            else if (!user.roles.includes('owner')) user.roles.push('owner');
          }
          setCurrentUser(user);
          setRole(savedRole || (hasOwner ? 'owner' : 'customer'));
        } else {
          setRole('customer');
        }
      } catch (e) {
        console.error('Session restore error:', e);
      }
    }

    initAuth();
  }, []);

  const saveSession = (user: CustomerProfile | null, userRole: UserRole) => {
    setCurrentUser(user);
    setRole(userRole);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_STORAGE_KEY, userRole);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  };

  const signUpCustomer = async (data: {
    email: string;
    password?: string;
    nickname: string;
    age: number;
    birthDate?: string;
    facePhoto?: File | string;
    phone?: string;
    address?: string;
    isOwner?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoginError(null);
      const emailLower = data.email.trim().toLowerCase();
      const isEmailOwner = emailLower === OWNER_EMAIL.toLowerCase() || data.isOwner === true;

      // Check duplicate email in customers database
      const existingCustomers = await getCustomersService();
      const duplicate = existingCustomers.find((c) => c.email.toLowerCase() === emailLower);
      if (duplicate) {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ' };
      }

      let userId = `user-${Date.now()}`;
      const { auth, isConfigured } = initFirebase();

      if (isConfigured && auth && data.password) {
        try {
          const res = await createUserWithEmailAndPassword(auth, emailLower, data.password);
          userId = res.user.uid;
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            return { success: false, error: 'อีเมลนี้ถูกลงทะเบียนในระบบ Firebase แล้ว' };
          }
          if (fbErr.code === 'auth/weak-password') {
            return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
          }
          console.warn('Firebase signup failed, continuing local fallback:', fbErr);
        }
      }

      // Upload face photo
      let facePhotoUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
      if (data.facePhoto) {
        const uploadPath = `customer_verifications/${userId}/face_${Date.now()}.jpg`;
        facePhotoUrl = await uploadImageService(data.facePhoto, uploadPath);
      }

      const newCustomer: CustomerProfile = {
        id: userId,
        email: emailLower,
        nickname: data.nickname.trim(),
        age: Number(data.age) || 25,
        birthDate: data.birthDate || '',
        facePhotoUrl,
        createdAt: new Date().toISOString(),
        orderCount: 0,
        totalSpent: 0,
        status: 'active',
        phone: data.phone || '',
        address: data.address || '',
        isOwner: isEmailOwner,
        roles: isEmailOwner ? ['customer', 'owner'] : ['customer'],
      };

      await saveCustomerProfileService(newCustomer);
      saveSession(newCustomer, isEmailOwner ? 'owner' : 'customer');

      return { success: true };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoginError(null);
      const emailLower = email.trim().toLowerCase();
      const isEmailOwner = emailLower === OWNER_EMAIL.toLowerCase();

      const { auth, isConfigured } = initFirebase();
      if (isConfigured && auth && password) {
        try {
          const res = await signInWithEmailAndPassword(auth, emailLower, password);
          const customers = await getCustomersService();
          let found = customers.find((c) => c.email.toLowerCase() === emailLower || c.id === res.user.uid);
          if (found) {
            if (isEmailOwner && !found.isOwner) {
              found.isOwner = true;
              found.roles = ['customer', 'owner'];
              await saveCustomerProfileService(found);
            }
            saveSession(found, found.isOwner ? 'owner' : 'customer');
            return { success: true };
          }
        } catch (fbErr: any) {
          console.warn('Firebase login attempt fallback to local check:', fbErr);
        }
      }

      // Check existing customer profiles
      const customers = await getCustomersService();
      let customer = customers.find((c) => c.email.toLowerCase() === emailLower);

      if (customer) {
        if (customer.status === 'suspended') {
          return { success: false, error: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อร้านค้า' };
        }
        if (isEmailOwner && !customer.isOwner) {
          customer = { ...customer, isOwner: true, roles: ['customer', 'owner'] };
          await saveCustomerProfileService(customer);
        }
        saveSession(customer, checkHasOwnerPrivilege(customer) ? 'owner' : 'customer');
        return { success: true };
      }

      // If email is the registered owner email but not found in profile list yet
      if (isEmailOwner) {
        const ownerUser: CustomerProfile = {
          id: `owner-${Date.now()}`,
          email: OWNER_EMAIL,
          nickname: 'เจ้าของร้าน (Admin)',
          age: 32,
          createdAt: new Date().toISOString(),
          orderCount: 0,
          totalSpent: 0,
          status: 'active',
          phone: '089-123-4567',
          address: 'ร้านค้าหลัก',
          isOwner: true,
          roles: ['customer', 'owner'],
        };
        await saveCustomerProfileService(ownerUser);
        saveSession(ownerUser, 'owner');
        return { success: true };
      }

      return {
        success: false,
        error: 'ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'เข้าสู่ระบบไม่สำเร็จ' };
    }
  };

  const loginAsOwner = async () => {
    // Check if an existing profile for owner email already exists to reuse
    const customers = await getCustomersService();
    let ownerProfile = customers.find((c) => c.email.toLowerCase() === OWNER_EMAIL.toLowerCase());

    if (!ownerProfile) {
      ownerProfile = {
        id: 'owner-main',
        email: OWNER_EMAIL,
        nickname: 'เจ้าของร้าน (Admin)',
        age: 30,
        createdAt: new Date().toISOString(),
        orderCount: 0,
        totalSpent: 0,
        status: 'active',
        phone: '089-123-4567',
        address: 'ร้านค้าหลัก',
        isOwner: true,
        roles: ['customer', 'owner'],
      };
      await saveCustomerProfileService(ownerProfile);
    } else {
      ownerProfile = {
        ...ownerProfile,
        isOwner: true,
        roles: ['customer', 'owner'],
      };
      await saveCustomerProfileService(ownerProfile);
    }

    saveSession(ownerProfile, 'owner');
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  };

  const toggleRole = () => {
    const nextRole: UserRole = role === 'owner' ? 'customer' : 'owner';
    switchRole(nextRole);
  };

  const grantOwnerPermission = async (isOwnerPermission: boolean) => {
    if (!currentUser) return;
    const currentRoles = currentUser.roles || ['customer'];
    const updatedRoles: UserRole[] = isOwnerPermission
      ? Array.from(new Set([...currentRoles, 'owner']))
      : currentRoles.filter((r) => r !== 'owner');

    const updatedUser: CustomerProfile = {
      ...currentUser,
      isOwner: isOwnerPermission,
      roles: updatedRoles,
      updatedAt: new Date().toISOString(),
    };

    await saveCustomerProfileService(updatedUser);
    saveSession(updatedUser, isOwnerPermission ? role : 'customer');
  };

  const logout = async () => {
    const { auth, isConfigured } = initFirebase();
    if (isConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.error('Firebase sign out error:', e);
      }
    }
    saveSession(null, 'customer');
  };

  const updateProfile = async (data: Partial<CustomerProfile>, newFacePhoto?: File | string) => {
    if (!currentUser) return;
    let facePhotoUrl = data.facePhotoUrl || currentUser.facePhotoUrl;
    if (newFacePhoto) {
      const uploadPath = `customer_verifications/${currentUser.id}/face_${Date.now()}.jpg`;
      facePhotoUrl = await uploadImageService(newFacePhoto, uploadPath);
    }

    const updated: CustomerProfile = {
      ...currentUser,
      ...data,
      facePhotoUrl,
      updatedAt: new Date().toISOString(),
    };
    await saveCustomerProfileService(updated);
    saveSession(updated, role);
  };

  const hasOwnerPrivilege = checkHasOwnerPrivilege(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isOwner: hasOwnerPrivilege,
        isAuthenticated: !!currentUser,
        isLoading,
        loginError,
        signUpCustomer,
        login,
        loginAsOwner,
        switchRole,
        toggleRole,
        grantOwnerPermission,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
