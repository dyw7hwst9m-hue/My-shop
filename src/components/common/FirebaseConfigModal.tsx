import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { FirebaseConfig } from '../../types';
import {
  X,
  Database,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  KeyRound,
  FileCode,
} from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isFirebaseLive, activeFirebaseConfig, updateFirebaseConfig, removeFirebaseConfig } =
    useShop();

  const [apiKey, setApiKey] = useState(activeFirebaseConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(activeFirebaseConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(activeFirebaseConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(activeFirebaseConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(
    activeFirebaseConfig?.messagingSenderId || ''
  );
  const [appId, setAppId] = useState(activeFirebaseConfig?.appId || '');

  const [jsonInput, setJsonInput] = useState('');
  const [copiedRule, setCopiedRule] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      // support JS object paste or JSON paste
      const cleaned = jsonInput
        .replace(/const\s+firebaseConfig\s*=\s*/, '')
        .replace(/;/g, '')
        .trim();
      // Relaxed JSON parsing or eval-safe regex extraction
      const extract = (key: string) => {
        const match = cleaned.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
        return match ? match[1] : '';
      };

      const extractedApiKey = extract('apiKey');
      const extractedAuthDomain = extract('authDomain');
      const extractedProjectId = extract('projectId');
      const extractedStorageBucket = extract('storageBucket');
      const extractedMessagingSenderId = extract('messagingSenderId');
      const extractedAppId = extract('appId');

      if (extractedApiKey && extractedProjectId) {
        setApiKey(extractedApiKey);
        setAuthDomain(extractedAuthDomain);
        setProjectId(extractedProjectId);
        setStorageBucket(extractedStorageBucket);
        setMessagingSenderId(extractedMessagingSenderId);
        setAppId(extractedAppId);
        setStatusMsg({ text: 'อ่านค่า Firebase Config เรียบร้อยแล้ว!', type: 'success' });
      } else {
        setStatusMsg({
          text: 'ไม่สามารถดึงข้อมูล Config ได้ กรุณาตรวจสอบรูปแบบข้อความ',
          type: 'error',
        });
      }
    } catch (e) {
      setStatusMsg({ text: 'รูปแบบ JSON ไม่ถูกต้อง', type: 'error' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      setStatusMsg({ text: 'กรุณากรอก API Key และ Project ID เป็นอย่างน้อย', type: 'error' });
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    updateFirebaseConfig(config);
    setStatusMsg({ text: 'บันทึกการตั้งค่า Firebase สำเร็จและกำลังเชื่อมต่อ...', type: 'success' });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    removeFirebaseConfig();
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setStatusMsg({ text: 'รีเซ็ตกลับสู่โหมด Local Storage เรียบร้อยแล้ว', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                ตั้งค่าการเชื่อมต่อ Firebase
              </h2>
              <p className="text-xs text-stone-500">
                Firestore Database • Authentication • Firebase Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* Live Status indicator */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isFirebaseLive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isFirebaseLive ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Database className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {isFirebaseLive
                    ? 'สถานะ: เชื่อมต่อ Firebase Cloud สำเร็จ'
                    : 'สถานะ: โหมด Local Storage (พร้อมเชื่อมต่อ)'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {isFirebaseLive
                    ? `Project: ${activeFirebaseConfig?.projectId}`
                    : 'ข้อมูลจำลองและบันทึกในเครื่องอัตโนมัติ สามารถใส่ Firebase Config เพื่อใช้งานจริงได้ตลอดเวลา'}
                </div>
              </div>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Quick paste JSON box */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
            <label className="font-bold text-stone-800 flex items-center justify-between">
              <span>วางโค้ด firebaseConfig จาก Firebase Console</span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 hover:underline flex items-center gap-1 font-normal text-[11px]"
              >
                <span>เปิด Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <textarea
              rows={3}
              placeholder='วาง const firebaseConfig = { apiKey: "...", ... } ที่นี่'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-2.5 font-mono text-[11px] bg-white border border-stone-200 rounded-xl focus:border-orange-500 outline-hidden"
            />
            <button
              type="button"
              onClick={handleParseJson}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              แปลงข้อความเป็นค่า Config ด้านล่าง
            </button>
          </div>

          {/* Manual inputs */}
          <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-stone-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Project ID</label>
                <input
                  type="text"
                  placeholder="my-shop-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Auth Domain</label>
                <input
                  type="text"
                  placeholder="my-shop.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Storage Bucket</label>
                <input
                  type="text"
                  placeholder="my-shop.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">App ID</label>
                <input
                  type="text"
                  placeholder="1:1234567890:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {activeFirebaseConfig ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>กลับสู่ Local Mode</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-orange-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกและเชื่อมต่อ</span>
              </button>
            </div>
          </form>

          {/* Security Rules Notice */}
          <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 space-y-1 text-stone-600 text-[11px]">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-stone-500" />
              <span>ความปลอดภัยของ Firebase Rules</span>
            </div>
            <p>
              โปรเจกต์นี้มีไฟล์ <code className="bg-white px-1 py-0.5 rounded border border-stone-300">firestore.rules</code> และ <code className="bg-white px-1 py-0.5 rounded border border-stone-300">storage.rules</code> ที่แยกสิทธิ์เจ้าของร้านกับลูกค้าไว้อย่างเข้มงวดเรียบร้อยแล้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
