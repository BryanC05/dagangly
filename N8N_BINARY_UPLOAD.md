# N8N Instagram Binary Upload Setup - Exact Settings

## Node 1: Download Image (NEW - Add before Upload to IG)

Add an **HTTP Request** node with these exact settings:

```
Method: GET
URL: {{ $json.body.productImage }}
Response Content: Binary File
Binary Property: image
```

**Screenshot settings:**
- Method: GET
- URL: `{{ $json.body.productImage }}`
- ▼ Response Content: Binary File
- Binary Property: `image`

## Node 2: Upload to IG (MODIFY your existing node)

```
Method: POST
URL: https://graph.facebook.com/v18.0/{{ $json.body.instagramUserID }}/media
Body Content Type: Multipart Form
```

**Form Data (click "Add Field"):**

| Field | Type | Value |
|-------|------|-------|
| media | Binary | `image` (select from dropdown) |
| caption | String | `{{ $json.body.productName + "\n\nPrice: " + $json.body.productPrice + "\nAvailable at: " + $json.body.storeName + "\nLink: " + $json.body.productLink }}` |
| access_token | String | `{{ $json.body.accessToken }}` |

**Important:**
1. For `media` field, click the dropdown and select **Binary**
2. Then select property: **image**
3. Make sure Body Content Type is **Multipart Form** NOT "Form URL Encoded"

## Node 3: Publish (keep existing)

```
Method: POST  
URL: https://graph.facebook.com/v18.0/{{ $json.body.instagramUserID }}/media_publish
Body Content Type: Form URL Encoded
```

**Body Fields:**
| Name | Value |
|------|-------|
| creation_id | `{{ $json.id }}` |
| access_token | `{{ $json.body.accessToken }}` |

## Visual Workflow

```
[Webhook] → [HTTP Request: Download Image] → [HTTP Request: Upload to IG] → [HTTP Request: Publish]
```

## Troubleshooting

**Error "No binary property":**
- Make sure Node 1 Response is set to "Binary File"
- Make sure Binary Property is "image"

**Error "Invalid image":**
- Try adding `media_type: IMAGE` in Form Data
