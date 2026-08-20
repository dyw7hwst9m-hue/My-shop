import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

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

/**
 * =========================================================
 * OWNER CONFIG
 * =========================================================
 *
 * ร้านนี้มีเจ้าของเพียงคนเดียว
 *
 * สำคัญ:
 * ห้ามใช้ data.isOwner จากแบบสมัครสมาชิกเป็นตัวตัดสิน
 * เพราะลูกค้าสามารถส่งค่า isOwner=true เองได้
 */
export const OWNER_EMAIL = 'ใส่อีเมลเจ้าของร้านตรงนี้';


/**
 * =========================================================
 * STORAGE KEYS
 * =========================================================
 */

const AUTH_STORAGE_KEY = 'my_shop_auth_session';
const ROLE_STORAGE_KEY = 'my_shop_auth_role';


/**
 * =========================================================
 * AUTH CONTEXT TYPE
 * =========================================================
 */

interface SignUpCustomerData {
  email: string;
  password?: string;
  nickname: string;
  age: number;
  birthDate?: string;
  facePhoto?: File | string;
  phone?: string;
  address?: string;

  /**
   * รับค่าไว้เพื่อไม่ให้ component เดิม error
   * แต่จะไม่ถูกใช้เพื่อให้สิทธิ์ owner
   */
  isOwner?: boolean;
}

interface AuthContextType {
  currentUser: CustomerProfile | null;

  role: UserRole;

  isOwner: boolean;

  isAuthenticated: boolean;

  isLoading: boolean;

  loginError: string | null;

  signUpCustomer: (
    data: SignUpCustomerData
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  loginAsOwner: () => Promise<void>;

  switchRole: (newRole: UserRole) => void;

  toggleRole: () => void;

  grantOwnerPermission: (
    isOwnerPermission: boolean
  ) => Promise<void>;

  logout: () => Promise<void>;

  updateProfile: (
    data: Partial<CustomerProfile>,
    newFacePhoto?: File | string
  ) => Promise<void>;
}


/**
 * =========================================================
 * CONTEXT
 * =========================================================
 */

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);


/**
 * =========================================================
 * OWNER CHECK
 * =========================================================
 *
 * เจ้าของร้านถูกกำหนดจากอีเมลที่ตั้งไว้ในระบบเท่านั้น
 *
 * ไม่รับ isOwner จาก form สมัครสมาชิก
 */
const checkIsOwnerAccount = (
  user: CustomerProfile | null
): boolean => {
  if (!user) return false;

  const email = String(user.email || '')
    .trim()
    .toLowerCase();

  const ownerEmail = OWNER_EMAIL
    .trim()
    .toLowerCase();

  return (
    email !== '' &&
    ownerEmail !== '' &&
    email === ownerEmail
  );
};


/**
 * =========================================================
 * AUTH PROVIDER
 * =========================================================
 */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [currentUser, setCurrentUser] =
    useState<CustomerProfile | null>(null);

  const [role, setRole] =
    useState<UserRole>('customer');

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [loginError, setLoginError] =
    useState<string | null>(null);


  /**
   * -------------------------------------------------------
   * COMPUTED OWNER STATUS
   * -------------------------------------------------------
   */

  const hasOwnerPermission =
    checkIsOwnerAccount(currentUser);


  const effectiveRole: UserRole =
    hasOwnerPermission && role === 'owner'
      ? 'owner'
      : 'customer';


  /**
   * -------------------------------------------------------
   * SAVE SESSION
   * -------------------------------------------------------
   */

  const saveSession = (
    user: CustomerProfile | null,
    userRole: UserRole
  ) => {

    setCurrentUser(user);

    /**
     * ป้องกันไม่ให้ user ธรรมดาบังคับ role เป็น owner
     */
    const safeRole: UserRole =
      user && checkIsOwnerAccount(user)
        ? userRole
        : 'customer';

    setRole(safeRole);

    if (user) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(user)
      );

      localStorage.setItem(
        ROLE_STORAGE_KEY,
        safeRole
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  };


  /**
   * -------------------------------------------------------
   * RESTORE LOCAL SESSION
   * -------------------------------------------------------
   */

  const restoreLocalSession = () => {

    try {

      const savedUserJson =
        localStorage.getItem(AUTH_STORAGE_KEY);

      const savedRole =
        localStorage.getItem(
          ROLE_STORAGE_KEY
        ) as UserRole | null;

      if (!savedUserJson) {
        setCurrentUser(null);
        setRole('customer');
        return;
      }

      const user =
        JSON.parse(savedUserJson) as CustomerProfile;

      const owner =
        checkIsOwnerAccount(user);

      /**
       * ถ้าไม่ใช่เจ้าของร้าน
       * บังคับกลับเป็น customer
       */
      const safeRole: UserRole =
        owner && savedRole === 'owner'
          ? 'owner'
          : 'customer';

      setCurrentUser(user);
      setRole(safeRole);

      /**
       * เขียนค่าที่ปลอดภัยกลับเข้า localStorage
       */
      localStorage.setItem(
        ROLE_STORAGE_KEY,
        safeRole
      );

    } catch (error) {

      console.error(
        'Session restore error:',
        error
      );

      localStorage.removeItem(
        AUTH_STORAGE_KEY
      );

      localStorage.removeItem(
        ROLE_STORAGE_KEY
      );

      setCurrentUser(null);
      setRole('customer');
    }
  };


  /**
   * -------------------------------------------------------
   * INITIAL AUTH
   * -------------------------------------------------------
   */

  useEffect(() => {

    let unsubscribe:
      | (() => void)
      | undefined;

    const initAuth = async () => {

      setIsLoading(true);

      try {

        const {
          auth,
          isConfigured,
        } = initFirebase();

        /**
         * Firebase ยังไม่ได้ตั้งค่า
         * ให้ใช้ local session ไปก่อน
         */
        if (!isConfigured || !auth) {

          restoreLocalSession();

          setIsLoading(false);

          return;
        }


        unsubscribe =
          onAuthStateChanged(
            auth,
            async (fbUser) => {

              try {

                if (
                  fbUser &&
                  fbUser.email
                ) {

                  const emailLower =
                    fbUser.email
                      .trim()
                      .toLowerCase();

                  const customers =
                    await getCustomersService();

                  let matched =
                    customers.find(
                      (customer) =>
                        String(
                          customer.email || ''
                        )
                          .trim()
                          .toLowerCase() ===
                        emailLower
                    );


                    /**
                     * ------------------------------------------------
                     * EXISTING CUSTOMER
                     * ------------------------------------------------
                     */

                  if (matched) {

                    /**
                     * ตรวจ owner จาก email จริงเท่านั้น
                     */
                    const owner =
                      emailLower ===
                      OWNER_EMAIL
                        .trim()
                        .toLowerCase();


                    if (owner) {

                      matched = {
                        ...matched,
                        isOwner: true,
                        roles: [
                          'customer',
                          'owner',
                        ],
                      };

                      await saveCustomerProfileService(
                        matched
                      );

                    } else {

                      /**
                       * ลูกค้าทั่วไป
                       * ห้ามมี owner privilege
                       */
                      matched = {
                        ...matched,
                        isOwner: false,
                        roles: ['customer'],
                      };

                      await saveCustomerProfileService(
                        matched
                      );
                    }


                    const savedRole =
                      localStorage.getItem(
                        ROLE_STORAGE_KEY
                      ) as UserRole | null;


                    const safeRole: UserRole =
                      owner &&
                      savedRole === 'owner'
                        ? 'owner'
                        : 'customer';


                    saveSession(
                      matched,
                      safeRole
                    );

                  } else {

                    /**
                     * ------------------------------------------------
                     * FIRST LOGIN / PROFILE NOT FOUND
                     * ------------------------------------------------
                     */

                    const owner =
                      emailLower ===
                      OWNER_EMAIL
                        .trim()
                        .toLowerCase();


                    const newProfile:
                      CustomerProfile = {
                        id: fbUser.uid,

                        email: emailLower,

                        nickname:
                          fbUser.displayName ||
                          (owner
                            ? 'เจ้าของร้าน'
                            : 'ลูกค้า'),

                        age: 0,

                        birthDate: '',

                        facePhotoUrl: '',

                        createdAt:
                          new Date().toISOString(),

                        orderCount: 0,

                        totalSpent: 0,

                        status: 'active',

                        phone: '',

                        address: '',

                        /**
                         * owner จาก email เท่านั้น
                         */
                        isOwner: owner,

                        roles: owner
                          ? [
                              'customer',
                              'owner',
                            ]
                          : ['customer'],
                      };


                    await saveCustomerProfileService(
                      newProfile
                    );


                    saveSession(
                      newProfile,
                      owner
                        ? 'owner'
                        : 'customer'
                    );
                  }

                } else {

                  restoreLocalSession();
                }

              } catch (error) {

                console.error(
                  'Firebase auth state error:',
                  error
                );

                restoreLocalSession();

              } finally {

                setIsLoading(false);
              }
            }
          );

      } catch (error) {

        console.error(
          'Firebase initialization error:',
          error
        );

        restoreLocalSession();

        setIsLoading(false);
      }
    };


    initAuth();


    return () => {

      if (unsubscribe) {
        unsubscribe();
      }

    };

  }, []);


  /**
   * =======================================================
   * SIGN UP CUSTOMER
   * =======================================================
   */

  const signUpCustomer = async (
    data: SignUpCustomerData
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {

    try {

      setLoginError(null);


      const emailLower =
        data.email
          .trim()
          .toLowerCase();


      /**
       * -----------------------------------------------
       * ตรวจข้อมูลพื้นฐาน
       * -----------------------------------------------
       */

      if (!emailLower) {
        return {
          success: false,
          error: 'กรุณากรอกอีเมล',
        };
      }


      if (!data.nickname.trim()) {
        return {
          success: false,
          error: 'กรุณากรอกชื่อ',
        };
      }


      /**
       * -----------------------------------------------
       * ห้ามสมัครด้วย OWNER EMAIL
       * -----------------------------------------------
       *
       * เจ้าของร้านใช้บัญชีเจ้าของร้านเท่านั้น
       */
      if (
        emailLower ===
        OWNER_EMAIL
          .trim()
          .toLowerCase()
      ) {

        return {
          success: false,
          error:
            'อีเมลนี้เป็นบัญชีเจ้าของร้าน กรุณาเข้าสู่ระบบเจ้าของร้าน',
        };
      }


      /**
       * -----------------------------------------------
       * CHECK DUPLICATE CUSTOMER
       * -----------------------------------------------
       */

      const existingCustomers =
        await getCustomersService();


      const duplicate =
        existingCustomers.find(
          (customer) =>
            String(customer.email || '')
              .trim()
              .toLowerCase() ===
            emailLower
        );


      if (duplicate) {

        return {
          success: false,
          error:
            'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ',
        };
      }


      /**
       * -----------------------------------------------
       * CREATE FIREBASE ACCOUNT
       * -----------------------------------------------
       */

      let userId =
        `user-${Date.now()}`;


      const {
        auth,
        isConfigured,
      } = initFirebase();


      if (
        isConfigured &&
        auth &&
        data.password
      ) {

        try {

          const result =
            await createUserWithEmailAndPassword(
              auth,
              emailLower,
              data.password
            );

          userId =
            result.user.uid;

        } catch (firebaseError: any) {

          if (
            firebaseError?.code ===
            'auth/email-already-in-use'
          ) {

            return {
              success: false,
              error:
                'อีเมลนี้ถูกลงทะเบียนใน Firebase แล้ว',
            };
          }


          if (
            firebaseError?.code ===
            'auth/weak-password'
          ) {

            return {
              success: false,
              error:
                'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
            };
          }

          console.warn(
            'Firebase signup failed:',
            firebaseError
          );
        }
      }


      /**
       * -----------------------------------------------
       * UPLOAD FACE PHOTO
       * -----------------------------------------------
       */

      let facePhotoUrl = '';


      if (data.facePhoto) {

        try {

          const uploadPath =
            `customer_verifications/${userId}/face_${Date.now()}.jpg`;


          facePhotoUrl =
            await uploadImageService(
              data.facePhoto,
              uploadPath
            );

        } catch (uploadError) {

          console.warn(
            'Face photo upload failed:',
            uploadError
          );
        }
      }


      /**
       * -----------------------------------------------
       * CREATE CUSTOMER PROFILE
       * -----------------------------------------------
       *
       * สำคัญ:
       * isOwner = false เสมอ
       * สำหรับการสมัครสมาชิกทั่วไป
       */

      const newCustomer:
        CustomerProfile = {

          id: userId,

          email: emailLower,

          nickname:
            data.nickname.trim(),

          age:
            Number(data.age) || 0,

          birthDate:
            data.birthDate || '',

          facePhotoUrl,

          createdAt:
            new Date().toISOString(),

          orderCount: 0,

          totalSpent: 0,

          status: 'active',

          phone:
            data.phone || '',

          address:
            data.address || '',

          /**
           * ห้ามรับ data.isOwner
           */
          isOwner: false,

          roles: ['customer'],
        };


      await saveCustomerProfileService(
        newCustomer
      );


      /**
       * สมัครเสร็จ → เข้าเป็น customer
       */
      saveSession(
        newCustomer,
        'customer'
      );


      return {
        success: true,
      };

    } catch (error: any) {

      console.error(
        'Sign up error:',
        error
      );


      const message =
        error?.message ||
        'เกิดข้อผิดพลาดในการสมัครสมาชิก';


      setLoginError(message);


      return {
        success: false,
        error: message,
      };
    }
  };


  /**
   * =======================================================
   * LOGIN
   * =======================================================
   */

  const login = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {

    try {

      setLoginError(null);


      const emailLower =
        email
          .trim()
          .toLowerCase();


      if (!emailLower || !password) {

        return {
          success: false,
          error:
            'กรุณากรอกอีเมลและรหัสผ่าน',
        };
      }


      const {
        auth,
        isConfigured,
      } = initFirebase();


      /**
       * -----------------------------------------------
       * FIREBASE LOGIN
       * -----------------------------------------------
       */

      if (
        isConfigured &&
        auth
      ) {

        try {

          await signInWithEmailAndPassword(
            auth,
            emailLower,
            password
          );

        } catch (firebaseError: any) {

          console.error(
            'Firebase login error:',
            firebaseError
          );


          if (
            firebaseError?.code ===
            'auth/invalid-credential' ||
            firebaseError?.code ===
            'auth/invalid-login-credentials' ||
            firebaseError?.code ===
            'auth/user-not-found' ||
            firebaseError?.code ===
            'auth/wrong-password'
          ) {

            return {
              success: false,
              error:
                'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
            };
          }


          return {
            success: false,
            error:
              firebaseError?.message ||
              'เข้าสู่ระบบไม่สำเร็จ',
          };
        }
      }


      /**
       * -----------------------------------------------
       * FIND PROFILE
       * -----------------------------------------------
       */

      const customers =
        await getCustomersService();


      const matched =
        customers.find(
          (customer) =>
            String(customer.email || '')
              .trim()
              .toLowerCase() ===
            emailLower
        );


      /**
       * -----------------------------------------------
       * PROFILE NOT FOUND
       * -----------------------------------------------
       */

      if (!matched) {

        return {
          success: false,
          error:
            'ไม่พบข้อมูลบัญชี กรุณาสมัครสมาชิกก่อน',
        };
      }


      /**
       * -----------------------------------------------
       * OWNER CHECK
       * -----------------------------------------------
       */

      const owner =
        emailLower ===
        OWNER_EMAIL
          .trim()
          .toLowerCase();


      let safeUser:
        CustomerProfile;


      if (owner) {

        safeUser = {
          ...matched,

          isOwner: true,

          roles: [
            'customer',
            'owner',
          ],
        };

      } else {

        safeUser = {
          ...matched,

          isOwner: false,

          roles: ['customer'],
        };
      }


      await saveCustomerProfileService(
        safeUser
      );


      /**
       * เจ้าของเข้า owner
       * ลูกค้าทั่วไปเข้า customer
       */
      saveSession(
        safeUser,
        owner
          ? 'owner'
          : 'customer'
      );


      return {
        success: true,
      };

    } catch (error: any) {

      console.error(
        'Login error:',
        error
      );


      const message =
        error?.message ||
        'เข้าสู่ระบบไม่สำเร็จ';


      setLoginError(message);


      return {
        success: false,
        error: message,
      };
    }
  };


  /**
   * =======================================================
   * LOGIN AS OWNER
   * =======================================================
   *
   * ใช้สำหรับปุ่ม/เมนูเดิมที่ App.tsx เรียก
   *
   * จะไม่สามารถทำให้บัญชีอื่นกลายเป็น owner ได้
   */

  const loginAsOwner = async (): Promise<void> => {

    if (!currentUser) {

      throw new Error(
        'กรุณาเข้าสู่ระบบก่อน'
      );
    }


    if (
      !checkIsOwnerAccount(
        currentUser
      )
    ) {

      throw new Error(
        'บัญชีนี้ไม่มีสิทธิ์เจ้าของร้าน'
      );
    }


    saveSession(
      currentUser,
      'owner'
    );
  };


  /**
   * =======================================================
   * SWITCH ROLE
   * =======================================================
   */

  const switchRole = (
    newRole: UserRole
  ): void => {

    /**
     * customer เท่านั้น
     */
    if (
      newRole === 'customer'
    ) {

      setRole('customer');

      localStorage.setItem(
        ROLE_STORAGE_KEY,
        'customer'
      );

      return;
    }


    /**
     * owner ต้องตรวจสิทธิ์ทุกครั้ง
     */
    if (
      newRole === 'owner' &&
      checkIsOwnerAccount(
        currentUser
      )
    ) {

      setRole('owner');

      localStorage.setItem(
        ROLE_STORAGE_KEY,
        'owner'
      );

      return;
    }


    /**
     * ไม่มีสิทธิ์ → customer
     */
    setRole('customer');

    localStorage.setItem(
      ROLE_STORAGE_KEY,
      'customer'
    );
  };


  /**
   * =======================================================
   * TOGGLE ROLE
   * =======================================================
   */

  const toggleRole = (): void => {

    if (
      !checkIsOwnerAccount(
        currentUser
      )
    ) {

      setRole('customer');

      return;
    }


    const nextRole: UserRole =
      role === 'owner'
        ? 'customer'
        : 'owner';


    switchRole(nextRole);
  };


  /**
   * =======================================================
   * GRANT OWNER PERMISSION
   * =======================================================
   *
   * ไม่อนุญาตให้ผู้ใช้ทั่วไปเรียกฟังก์ชันนี้
   * แล้วทำให้ตัวเองเป็นเจ้าของ
   *
   * เจ้าของจะถูกกำหนดจาก OWNER_EMAIL เท่านั้น
   */

  const grantOwnerPermission = async (
    isOwnerPermission: boolean
  ): Promise<void> => {

    if (!currentUser) {
      return;
    }


    /**
     * ถ้าไม่ใช่ owner account
     * ไม่สามารถ grant ตัวเองได้
     */
    if (
      !checkIsOwnerAccount(
        currentUser
      )
    ) {

      setRole('customer');

      return;
    }


    const updatedUser:
      CustomerProfile = {

        ...currentUser,

        isOwner:
          isOwnerPermission,

        roles:
          isOwnerPermission
            ? [
                'customer',
                'owner',
              ]
            : ['customer'],
      };


    await saveCustomerProfileService(
      updatedUser
    );


    saveSession(
      updatedUser,
      isOwnerPermission
        ? 'owner'
        : 'customer'
    );
  };


  /**
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  const logout = async (): Promise<void> => {

    try {

      const {
        auth,
        isConfigured,
      } = initFirebase();


      if (
        isConfigured &&
        auth
      ) {

        await firebaseSignOut(
          auth
        );
      }

    } catch (error) {

      console.warn(
        'Firebase logout error:',
        error
      );

    } finally {

      saveSession(
        null,
        'customer'
      );

      setLoginError(null);
    }
  };


  /**
   * =======================================================
   * UPDATE PROFILE
   * =======================================================
   */

  const updateProfile = async (
    data: Partial<CustomerProfile>,
    newFacePhoto?: File | string
  ): Promise<void> => {

    if (!currentUser) {

      throw new Error(
        'ยังไม่ได้เข้าสู่ระบบ'
      );
    }


    let facePhotoUrl =
      currentUser.facePhotoUrl || '';


    /**
     * Upload รูปใหม่
     */
    if (newFacePhoto) {

      const uploadPath =
        `customer_verifications/${currentUser.id}/face_${Date.now()}.jpg`;


      facePhotoUrl =
        await uploadImageService(
          newFacePhoto,
          uploadPath
        );
    }


    /**
     * -----------------------------------------------
     * ป้องกันการแก้สิทธิ์ owner
     * -----------------------------------------------
     */

    const owner =
      checkIsOwnerAccount(
        currentUser
      );


    const updatedUser:
      CustomerProfile = {

        ...currentUser,

        ...data,

        facePhotoUrl,

        /**
         * owner ถูกกำหนดจาก email เท่านั้น
         */
        isOwner: owner,

        roles: owner
          ? [
              'customer',
              'owner',
            ]
          : ['customer'],
      };


    await saveCustomerProfileService(
      updatedUser
    );


    /**
     * ถ้าเป็น owner ให้คง role เดิม
     * ถ้าไม่ใช่ owner ให้กลับ customer
     */
    const safeRole: UserRole =
      owner && role === 'owner'
        ? 'owner'
        : 'customer';


    saveSession(
      updatedUser,
      safeRole
    );
  };


  /**
   * =======================================================
   * CONTEXT VALUE
   * =======================================================
   */

  const value: AuthContextType = {

    currentUser,

    role: effectiveRole,

    isOwner:
      checkIsOwnerAccount(
        currentUser
      ) &&
      effectiveRole === 'owner',

    isAuthenticated:
      !!currentUser,

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
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};


/**
 * =========================================================
 * USE AUTH
 * =========================================================
 */

export const useAuth = (): AuthContextType => {

  const context =
    useContext(AuthContext);


  if (!context) {

    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }


  return context;
};


export default AuthContext;
