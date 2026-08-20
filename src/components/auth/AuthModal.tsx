import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Camera,
  Upload,
  User,
  Mail,
  Lock,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, signUpCustomer, loginAsOwner, isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<number>(25);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Face Photo handling
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [facePhotoFile, setFacePhotoFile] = useState<File | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Birthdate change to compute age
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBirthDate(val);
    if (val) {
      const birth = new Date(val);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge > 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFacePhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFacePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setIsCameraActive(false);
    }
  };

  // Camera capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      setErrorMsg('ไม่สามารถเข้าถึงกล้องได้ กรุณาอัปโหลดรูปภาพแทน');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFacePhotoPreview(dataUrl);
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('เข้าสู่ระบบสำเร็จ!');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อเล่น, อีเมล, รหัสผ่าน)');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (!facePhotoPreview && !facePhotoFile) {
      setErrorMsg('กรุณาถ่ายรูปหรืออัปโหลดรูปถ่ายใบหน้าเพื่อยืนยันตัวตน');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await signUpCustomer({
      email,
      password,
      nickname,
      age: Number(age) || 20,
      birthDate,
      facePhoto: facePhotoFile || facePhotoPreview || undefined,
      phone,
      address,
    });

    setLoading(false);
    if (res.success) {
      setSuccessMsg('สมัครสมาชิกและยืนยันตัวตนสำเร็จ!');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMsg(res.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  // Demo user quick login helpers
  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    const res = await login(demoEmail, '123456');
    setLoading(false);
    if (res.success) {
      onClose();
    }
  };

  const handleOwnerQuickLogin = async () => {
    setLoading(true);
    await loginAsOwner();
    setLoading(false);
    setSuccessMsg('เข้าสู่ระบบเจ้าของร้านสำเร็จ!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-100">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
              🛍️
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-none">
                {activeTab === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {activeTab === 'login' ? 'เลือกลูกค้าหรือเจ้าของร้าน' : 'กรอกข้อมูลและรูปใบหน้ายืนยันตัวตน'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-100 bg-stone-100/60 p-1.5 mx-4 mt-3 rounded-2xl">
          <button
            id="tab-auth-login"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              stopCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            id="tab-auth-signup"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            สมัครสมาชิก (Sign Up)
          </button>
        </div>

        {/* Form Body with scroll */}
        <div className="overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    id="input-login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </button>

              {/* One Click Fast Test Logins */}
              <div className="pt-3 border-t border-stone-100">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider text-center mb-2.5">
                  หรือเลือกบัญชีทดสอบด่วน
                </p>

                {/* Owner Login button */}
                <button
                  id="btn-quick-login-owner"
                  type="button"
                  onClick={handleOwnerQuickLogin}
                  className="w-full mb-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">👑</span>
                    <div>
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span>เข้าสู่ระบบ: เจ้าของร้าน</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-medium">Owner</span>
                      </div>
                      <span className="text-[10px] text-amber-700">thitapornmukji@gmail.com</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800">เข้าใช้งาน →</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('somchai.dee@gmail.com')}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-800">สมชาย (26 ปี)</div>
                    <div className="text-[10px] text-stone-400 truncate">somchai.dee@gmail.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ploy.napa@gmail.com')}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-800">พลอย (22 ปี)</div>
                    <div className="text-[10px] text-stone-400 truncate">ploy.napa@gmail.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('nutthawut.k@gmail.com')}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-800">นัท (17 ปี)</div>
                    <div className="text-[10px] text-stone-400 truncate">nutthawut.k@gmail.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('chatchai.w@gmail.com')}
                    className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-800">คุณชาติ (52 ปี)</div>
                    <div className="text-[10px] text-stone-400 truncate">chatchai.w@gmail.com</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {/* Face Photo Capture / Upload for Identity Verification */}
              <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>รูปถ่ายใบหน้าเพื่อยืนยันตัวตน *</span>
                  </label>
                  <span className="text-[10px] bg-orange-200/70 text-orange-900 px-2 py-0.5 rounded-full font-medium">
                    Private (เจ้าของร้านดูได้เท่านั้น)
                  </span>
                </div>
                <p className="text-[11px] text-stone-600">
                  ถ่ายรูปหรืออัปโหลดรูปที่เห็นใบหน้าชัดเจน เพื่อความปลอดภัยของบัญชี
                </p>

                {/* Face Preview or Camera view */}
                <div className="flex flex-col items-center justify-center pt-1 pb-2">
                  {isCameraActive ? (
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-orange-500 shadow-md bg-black">
                      <video
                        ref={videoRef}
                        playsInline
                        autoPlay
                        muted
                        className="w-full h-full object-cover mirror"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full m-3 pointer-events-none"></div>
                    </div>
                  ) : facePhotoPreview ? (
                    <div className="relative group">
                      <img
                        src={facePhotoPreview}
                        alt="Face verification"
                        className="w-28 h-28 rounded-full object-cover border-3 border-emerald-500 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-stone-200/80 border-2 border-dashed border-stone-400 flex flex-col items-center justify-center text-stone-400">
                      <User className="w-8 h-8" />
                      <span className="text-[10px] mt-1">ยังไม่มีรูป</span>
                    </div>
                  )}

                  {/* Camera / Upload buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    {isCameraActive ? (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>ถ่ายรูปใบหน้า</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-medium rounded-xl hover:bg-stone-300 cursor-pointer"
                        >
                          ยกเลิกกล้อง
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>เปิดกล้องถ่ายรูป</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>เลือกไฟล์รูป</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nickname & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อเล่น *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น น้องพลอย, กอล์ฟ"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    เบอร์โทรศัพท์ (ถ้ามี)
                  </label>
                  <input
                    type="tel"
                    placeholder="081-xxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Age & BirthDate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    วันเกิด (Birth Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={handleBirthDateChange}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    อายุ (ปี) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อีเมล (Email) * (ใช้เป็นตัวระบุบัญชีหลัก)
                </label>
                <input
                  type="email"
                  required
                  placeholder="myemail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  รหัสผ่าน (Password) * (อย่างน้อย 6 ตัวอักษร)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ที่อยู่จัดส่ง (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden resize-none"
                />
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>ยืนยันการสมัครสมาชิก</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
