# 🖼️ Complete NFT Upload Guide

## 📋 **Current Status**
✅ NFT files found in `D:\RAC\NFT\Current\`  
✅ Database schema fix script created  
❌ Storage bucket needs to be created  
❌ Images need to be uploaded  

---

## 🚀 **Step-by-Step Instructions**

### **Step 1: Fix Database Schema**
Run the SQL script to add missing columns to the `nft_types` table:

```sql
-- Execute this in your PostgreSQL database or Supabase SQL editor
\i fix_nft_types_schema.sql
```

**Or manually execute:**
```sql
ALTER TABLE public.nft_types 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_upgradeable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_evolvable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_fractional_eligible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_custodial BOOLEAN DEFAULT TRUE;
```

### **Step 2: Create Storage Bucket**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/wndswqvqogeblksrujpg)
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set bucket name: `public-assets`
5. Make it **Public**
6. Set file size limit: `10 MB`
7. Allowed MIME types: `image/png, image/jpeg, image/jpg, image/gif`
8. Click **"Create bucket"**

### **Step 3: Upload NFT Images**
After creating the bucket, run the upload script:

```bash
node fix_database_and_upload.js
```

---

## 📁 **NFT Files Found**
The following files were found in `D:\RAC\NFT\Current\`:

| File | Card Type | Rarity | Price (USDT) |
|------|-----------|--------|--------------|
| `Black.png` | Black | Very Rare | $1,000.00 |
| `Gold.png` | Gold | Very Rare | $1,000.00 |
| `Lava Orange.png` | Lava Orange | Rare | $500.00 |
| `Pearl White.png` | Pearl White | Common | $0.00 |
| `Pink.png` | Pink | Less Common | $100.00 |
| `Silver.png` | Silver | Less Common | $100.00 |

---

## 🔧 **Alternative Manual Upload**

If the automated script doesn't work, you can manually upload:

### **Manual Storage Upload:**
1. Go to Supabase Storage → `public-assets` bucket
2. Create folder: `nft-images/`
3. Upload each PNG file with descriptive names:
   - `loyalty-black.png`
   - `loyalty-gold.png`
   - `loyalty-lava-orange.png`
   - `loyalty-pearl-white.png`
   - `loyalty-pink.png`
   - `loyalty-silver.png`

### **Manual Database Update:**
After uploading, update the database with image URLs:

```sql
UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-black.png'
WHERE nft_name = 'Black';

UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-gold.png'
WHERE nft_name = 'Gold';

UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-lava-orange.png'
WHERE nft_name = 'Lava Orange';

UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-pearl-white.png'
WHERE nft_name = 'Pearl White';

UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-pink.png'
WHERE nft_name = 'Pink';

UPDATE public.nft_types 
SET image_url = 'https://wndswqvqogeblksrujpg.supabase.co/storage/v1/object/public/public-assets/nft-images/loyalty-silver.png'
WHERE nft_name = 'Silver';
```

---

## ✅ **Verification**

After completing the upload, verify everything is working:

```sql
SELECT 
  nft_name, 
  display_name, 
  rarity, 
  buy_price_usdt, 
  is_custodial,
  image_url,
  CASE 
    WHEN image_url IS NOT NULL THEN '✅ Image URL set'
    ELSE '❌ No image URL'
  END as image_status
FROM public.nft_types 
WHERE is_custodial = TRUE
ORDER BY nft_name;
```

---

## 🎯 **Expected Results**

After successful completion, you should see:

- ✅ 6 NFT types in the database
- ✅ All with `is_custodial = TRUE`
- ✅ All with proper image URLs
- ✅ Images accessible via public URLs
- ✅ Proper rarity and pricing set

---

## 🆘 **Troubleshooting**

### **If storage bucket creation fails:**
- Ensure you have admin access to the Supabase project
- Try creating the bucket through the Supabase dashboard instead

### **If image upload fails:**
- Check file permissions on the NFT files
- Ensure files are not corrupted
- Verify the storage bucket exists and is public

### **If database update fails:**
- Check if the `image_url` column exists
- Verify you have write permissions to the `nft_types` table
- Run the schema fix script first

---

## 📞 **Support**

If you encounter any issues:
1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Try the manual upload process as a fallback
4. Ensure all files and permissions are correct
