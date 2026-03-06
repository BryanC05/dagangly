# 📸 Instagram Auto-Posting Feature

This feature automates publishing image posts directly to an Instagram Business profile using the Meta Graph API. It supports both direct API calls and n8n workflow automation.

## 🚀 Features

* **Two Posting Methods:**
  1. **Direct API** - Python script using requests library
  2. **n8n Workflow** - No-code automation via webhooks (recommended for production)
* **Secure Credential Management:** Utilizes `.env` files to keep Meta Access Tokens and Account IDs out of the source code.
* **Two-Step API Pipeline:** Automatically handles container creation and asynchronous publishing.
* **Dual Account Support:**
  - **Platform Account** - Posts to TroliToko's official Instagram
  - **User's Own Account** - Sellers can connect their personal Instagram Business account
* **Smart Image Handling:** Supports both external URLs and uploaded product images

## 📋 Prerequisites

Before using this feature, you must have the following:

1. A **Facebook Page** linked to an **Instagram Business Account**.
2. A **Meta Developer App** with the following permissions granted:
   * `instagram_basic`
   * `instagram_content_publish`
   * `pages_show_list`
   * `pages_read_engagement`
3. A valid **Page Access Token** and **Instagram Business Account ID**.

## 🛠️ Setup & Configuration

### Environment Variables

Add these to your `backend/.env` file:

```env
# Platform-level Instagram credentials (for posting on behalf of the business)
IG_ACCESS_TOKEN=your_ig_access_token
IG_ACCOUNT_ID=your_ig_account_id

# Optional: User-level Instagram OAuth (for sellers connecting their own accounts)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/users/instagram/callback
```

### Method 1: Direct API (Python Script)

1. **Install required dependencies:**
   ```bash
   pip install requests python-dotenv
   ```

2. **Run the script:**
   ```bash
   python IG_AUTOMATION.py
   ```

### Method 2: n8n Workflow (Recommended)

The n8n workflow is the recommended method for production use as it provides:
- No-code configuration
- Error handling and retry logic
- Easy monitoring via n8n dashboard

#### Workflow Setup

1. **Create a new workflow** in n8n
2. **Add Webhook Node** (trigger):
   - Path: Copy your unique webhook URL
   - Response: JSON

3. **Add HTTP Request Node (Node 1 - Download Image)**:
   - URL: `{{ $json.body.productImage }}`
   - Method: GET
   - Response: Binary File
   - Output Property Name: `image`

4. **Add HTTP Request Node (Node 2 - Create Media)**:
   - URL: `https://graph.facebook.com/v18.0/{{$json.body.instagramUserID}}/media`
   - Method: POST
   - Body Content Type: Multipart Form
   - Form Data:
     | Name | Value |
     |------|-------|
     | media | `{{ $binary.image }}` (select Binary Property) |
     | caption | `{{ $json.body.caption }}` |

5. **Add HTTP Request Node (Node 3 - Publish)**:
   - URL: `https://graph.facebook.com/v18.0/{{$json.body.instagramUserID}}/media_publish`
   - Method: POST
   - Body Content Type: Form URL Encoded
   - Body Fields:
     | Name | Value |
     |------|-------|
     | creation_id | `{{ $json.id }}` |
     | access_token | `YOUR_ACCESS_TOKEN` |

> **⚠️ Important**: Do NOT use `image_url` parameter - Instagram's API cannot download images from most servers due to security restrictions. Always upload the image as binary data instead.

#### Webhook Payload Schema

The backend sends this payload when a product is created with Instagram posting enabled:

```json
{
  "event": "instagram.post",
  "productName": "Kue Lapis Legit",
  "productPrice": "Rp 150000",
  "storeName": "Dapur Summarecon",
  "productLink": "https://trolitoko.app/product/69aa637061b3016de9532c1f",
  "productImage": "https://umkm-marketplace-production.up.railway.app/uploads/products/image.png",
  "instagramUserID": "17841443191636686",
  "accessToken": "EA...",
  "preference": "trolitoko",
  "caption": "Check out our new product!"
}
```

## 🔧 How It Works

1. **Seller creates a product** on TroliToko with "Post to Instagram" toggle enabled
2. **Backend processes** the product and extracts:
   - Product image (supports external URLs and uploaded images)
   - Product name, price, store name
   - Custom caption (if provided)
3. **Backend sends webhook** to n8n with all product details
4. **n8n workflow**:
   - **Step 1:** Creates a media container with image URL and caption
   - **Step 2:** Publishes the container to Instagram (after brief delay)
5. **Post appears** on Instagram with product image, caption, and link

## 🐛 Troubleshooting

### Token Issues
- **"Invalid OAuth access token"**: Ensure token is valid and not expired
- **Token debug**: Use Meta's debug_token API to verify token validity
- **Permissions**: Ensure token has `instagram_content_publish` scope

### API Errors
- **"Object does not exist"**: Verify the Instagram Account ID is correct and linked to your Facebook Page
- **"Missing permissions"**: Re-grant Instagram permissions in Meta Developer Portal

### Image Issues
- **Fallback image showing**: Ensure product images are properly uploaded and accessible via public URL
- **Image not loading**: Check that the image URL is publicly accessible (not behind authentication)

## 📝 Testing

Use the test script to verify your setup:

```bash
cd backend
python test_ig_post.py
```

This will create a test product and trigger the Instagram posting workflow.
